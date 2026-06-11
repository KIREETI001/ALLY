-- ALLY v2 migration: security floor (RLS), provenance, proof-of-work care log,
-- notifications scaffolding, PDPA consents, and the subsidy_rules target table.
--
-- Design notes (docs/product/REBUILD-BLUEPRINT.md §3):
-- * RLS everywhere: PDPA treats discharge data as sensitive health data; the
--   anon key must never be able to read across households.
-- * care_log is the MDW's proof-of-work (council verdict: her protection from
--   blame is the engagement driver) — append-only by design.
-- * notifications carries an idempotency key (Seed 17) and jitter offset
--   (Seed 19) so the future WhatsApp worker can be retried safely and
--   morning reminders don't burst.

-- ── 1. Provenance on tasks (parser v2) ─────────────────────────────────────
alter table public.tasks add column if not exists source_quote text not null default '';

-- ── 2. Proof-of-work care log (append-only) ────────────────────────────────
create table if not exists public.care_log (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('done', 'undone', 'note', 'photo')),
  note text not null default '',
  photo_url text,
  created_at timestamptz not null default now()
);
create index if not exists care_log_plan_idx on public.care_log (care_plan_id, created_at desc);

-- ── 3. Notifications scaffolding (WABA-ready, send worker comes later) ─────
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  recipient_id uuid references auth.users(id) on delete cascade,
  recipient_phone text,                       -- MDWs may have no account: phone identity
  channel text not null default 'whatsapp' check (channel in ('whatsapp', 'push', 'email')),
  kind text not null check (kind in ('task_reminder', 'daily_digest', 'urgent_alert')),
  payload jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz not null,
  jitter_seconds int not null default floor(random() * 300)::int,  -- Seed 19
  idempotency_key text not null unique,                            -- Seed 17
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_due_idx on public.notifications (scheduled_at) where sent_at is null;

-- ── 4. PDPA consents ────────────────────────────────────────────────────────
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  purpose text not null,
  details text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists consents_user_idx on public.consents (user_id, created_at desc);

-- ── 5. Subsidy rules target table ───────────────────────────────────────────
-- v1 ships rules as code (src/lib/subsidies.ts, RULES_VERSION). This table is
-- the destination once admin tooling exists; shapes match SchemeResult.
create table if not exists public.subsidy_rules (
  id text not null,
  country text not null default 'SG',
  version text not null,
  name text not null,
  rules jsonb not null,
  source text not null,
  verified_on date not null,
  created_at timestamptz not null default now(),
  primary key (country, id, version)
);

-- ── 6. Row Level Security ───────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.patients      enable row level security;
alter table public.care_plans    enable row level security;
alter table public.tasks         enable row level security;
alter table public.care_team     enable row level security;
alter table public.care_team_invites enable row level security;
alter table public.mood_logs     enable row level security;
alter table public.care_log      enable row level security;
alter table public.notifications enable row level security;
alter table public.consents      enable row level security;
alter table public.subsidy_rules enable row level security;

-- Helper: is the current user a member of a care plan's team (or its owner)?
create or replace function public.is_care_team_member(plan_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.care_plans cp
    where cp.id = plan_id and cp.owner_id = auth.uid()
  ) or exists (
    select 1 from public.care_team ct
    where ct.care_plan_id = plan_id and ct.user_id = auth.uid()
  );
$$;

-- profiles: self only
drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- patients: owner only (care-team read access flows through care_plans)
drop policy if exists patients_owner on public.patients;
create policy patients_owner on public.patients
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- care_plans: owner full access; team members read
drop policy if exists care_plans_owner on public.care_plans;
create policy care_plans_owner on public.care_plans
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists care_plans_team_read on public.care_plans;
create policy care_plans_team_read on public.care_plans
  for select using (public.is_care_team_member(id));

-- tasks: any team member can read and update (mark done); owner manages
drop policy if exists tasks_team_select on public.tasks;
create policy tasks_team_select on public.tasks
  for select using (public.is_care_team_member(care_plan_id));
drop policy if exists tasks_team_update on public.tasks;
create policy tasks_team_update on public.tasks
  for update using (public.is_care_team_member(care_plan_id))
  with check (public.is_care_team_member(care_plan_id));
drop policy if exists tasks_owner_write on public.tasks;
create policy tasks_owner_write on public.tasks
  for insert with check (
    exists (select 1 from public.care_plans cp where cp.id = care_plan_id and cp.owner_id = auth.uid())
  );
drop policy if exists tasks_owner_delete on public.tasks;
create policy tasks_owner_delete on public.tasks
  for delete using (
    exists (select 1 from public.care_plans cp where cp.id = care_plan_id and cp.owner_id = auth.uid())
  );

-- care_team: members see their team; owner manages membership
drop policy if exists care_team_member_read on public.care_team;
create policy care_team_member_read on public.care_team
  for select using (public.is_care_team_member(care_plan_id));
drop policy if exists care_team_owner_write on public.care_team;
create policy care_team_owner_write on public.care_team
  for all using (
    exists (select 1 from public.care_plans cp where cp.id = care_plan_id and cp.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.care_plans cp where cp.id = care_plan_id and cp.owner_id = auth.uid())
  );

-- care_team_invites: owner manages; invitee visibility handled via token flow server-side
drop policy if exists invites_owner on public.care_team_invites;
create policy invites_owner on public.care_team_invites
  for all using (invited_by = auth.uid()) with check (invited_by = auth.uid());

-- mood_logs: strictly private to the caregiver — burnout data is sensitive
drop policy if exists mood_self on public.mood_logs;
create policy mood_self on public.mood_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- care_log: team members read + append; no updates/deletes (append-only)
drop policy if exists care_log_team_read on public.care_log;
create policy care_log_team_read on public.care_log
  for select using (public.is_care_team_member(care_plan_id));
drop policy if exists care_log_team_insert on public.care_log;
create policy care_log_team_insert on public.care_log
  for insert with check (actor_id = auth.uid() and public.is_care_team_member(care_plan_id));

-- notifications: team members read their plan's notifications; writes are service-role only
drop policy if exists notifications_team_read on public.notifications;
create policy notifications_team_read on public.notifications
  for select using (public.is_care_team_member(care_plan_id));

-- consents: self read+insert; immutable
drop policy if exists consents_self_read on public.consents;
create policy consents_self_read on public.consents
  for select using (user_id = auth.uid());
drop policy if exists consents_self_insert on public.consents;
create policy consents_self_insert on public.consents
  for insert with check (user_id = auth.uid());

-- subsidy_rules: world-readable reference data; writes via service role only
drop policy if exists subsidy_rules_read on public.subsidy_rules;
create policy subsidy_rules_read on public.subsidy_rules
  for select using (true);
