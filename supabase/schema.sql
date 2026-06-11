-- =====================================================================
-- ALLY database schema
-- Run this in Supabase SQL editor (Project → SQL → New query → paste → Run).
-- Idempotent — safe to re-run.
-- =====================================================================

-- ----- Extensions -----
create extension if not exists "uuid-ossp";

-- ----- Profiles (1:1 with auth.users) -----
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text,
  language text not null default 'en',
  fdw_mode boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----- Patients -----
create table if not exists public.patients (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  age int,
  conditions text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.patients enable row level security;

-- ----- Care plans -----
create table if not exists public.care_plans (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  diagnosis text,
  diet text,
  warnings text[] not null default '{}',
  medications jsonb not null default '[]'::jsonb,
  raw_discharge_text text,
  activated_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.care_plans enable row level security;

-- ----- Care team (membership) -----
create table if not exists public.care_team (
  id uuid primary key default uuid_generate_v4(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'secondary',
  display_initials text not null default '',
  display_color text not null default '#1B6B7B',
  joined_at timestamptz not null default now(),
  unique (care_plan_id, user_id)
);
alter table public.care_team enable row level security;

-- ----- Care team invites -----
create table if not exists public.care_team_invites (
  id uuid primary key default uuid_generate_v4(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  email text not null,
  role text not null default 'secondary',
  token uuid not null default uuid_generate_v4() unique,
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days')
);
alter table public.care_team_invites enable row level security;

-- ----- Tasks -----
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  title text not null,
  type text not null default 'Other',
  scheduled_time text not null default '',
  done boolean not null default false,
  done_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  urgent boolean not null default false,
  notes text not null default '',
  steps text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.tasks enable row level security;
create index if not exists tasks_care_plan_idx on public.tasks(care_plan_id);
create index if not exists tasks_assigned_idx on public.tasks(assigned_to);

-- ----- Mood logs -----
create table if not exists public.mood_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood int not null check (mood between 1 and 5),
  note text,
  recorded_at timestamptz not null default now()
);
alter table public.mood_logs enable row level security;
create index if not exists mood_logs_user_idx on public.mood_logs(user_id, recorded_at desc);

-- ----- Helper: is user a member of a care plan? -----
create or replace function public.is_team_member(plan uuid, uid uuid)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.care_team where care_plan_id = plan and user_id = uid
  ) or exists (
    select 1 from public.care_plans where id = plan and owner_id = uid
  );
$$;

-- ----- RLS policies -----

-- patients: owner OR team member of any plan for this patient can read; only owner can insert/update/delete.
drop policy if exists "patients select" on public.patients;
create policy "patients select" on public.patients for select
  using (
    auth.uid() = owner_id
    or exists (
      select 1 from public.care_plans p
      join public.care_team t on t.care_plan_id = p.id
      where p.patient_id = patients.id and t.user_id = auth.uid()
    )
  );
drop policy if exists "patients insert" on public.patients;
create policy "patients insert" on public.patients for insert with check (auth.uid() = owner_id);
drop policy if exists "patients update" on public.patients;
create policy "patients update" on public.patients for update using (auth.uid() = owner_id);
drop policy if exists "patients delete" on public.patients;
create policy "patients delete" on public.patients for delete using (auth.uid() = owner_id);

-- care_plans: owner or team member can select; only owner can mutate
drop policy if exists "care_plans select" on public.care_plans;
create policy "care_plans select" on public.care_plans for select
  using (auth.uid() = owner_id or public.is_team_member(id, auth.uid()));
drop policy if exists "care_plans insert" on public.care_plans;
create policy "care_plans insert" on public.care_plans for insert with check (auth.uid() = owner_id);
drop policy if exists "care_plans update" on public.care_plans;
create policy "care_plans update" on public.care_plans for update using (auth.uid() = owner_id);
drop policy if exists "care_plans delete" on public.care_plans;
create policy "care_plans delete" on public.care_plans for delete using (auth.uid() = owner_id);

-- care_team: members of a plan can see other members; only the plan owner can insert/delete.
drop policy if exists "care_team select" on public.care_team;
create policy "care_team select" on public.care_team for select
  using (public.is_team_member(care_plan_id, auth.uid()));
drop policy if exists "care_team insert" on public.care_team;
create policy "care_team insert" on public.care_team for insert with check (
  exists (select 1 from public.care_plans p where p.id = care_plan_id and p.owner_id = auth.uid())
  or auth.uid() = user_id   -- the joining user themselves can insert (used by accept-invite flow)
);
drop policy if exists "care_team update" on public.care_team;
create policy "care_team update" on public.care_team for update using (
  exists (select 1 from public.care_plans p where p.id = care_plan_id and p.owner_id = auth.uid())
);
drop policy if exists "care_team delete" on public.care_team;
create policy "care_team delete" on public.care_team for delete using (
  exists (select 1 from public.care_plans p where p.id = care_plan_id and p.owner_id = auth.uid())
  or auth.uid() = user_id   -- a member can leave themselves
);

-- care_team_invites: only the inviting user (or plan owner) can read/insert; the invitee accepts via token (RPC, see below)
drop policy if exists "invites select" on public.care_team_invites;
create policy "invites select" on public.care_team_invites for select
  using (
    auth.uid() = invited_by
    or exists (select 1 from public.care_plans p where p.id = care_plan_id and p.owner_id = auth.uid())
  );
drop policy if exists "invites insert" on public.care_team_invites;
create policy "invites insert" on public.care_team_invites for insert with check (
  auth.uid() = invited_by
  and exists (select 1 from public.care_plans p where p.id = care_plan_id and p.owner_id = auth.uid())
);

-- tasks: any team member can read/update/insert/delete tasks of a plan
drop policy if exists "tasks select" on public.tasks;
create policy "tasks select" on public.tasks for select
  using (public.is_team_member(care_plan_id, auth.uid()));
drop policy if exists "tasks insert" on public.tasks;
create policy "tasks insert" on public.tasks for insert with check (public.is_team_member(care_plan_id, auth.uid()));
drop policy if exists "tasks update" on public.tasks;
create policy "tasks update" on public.tasks for update using (public.is_team_member(care_plan_id, auth.uid()));
drop policy if exists "tasks delete" on public.tasks;
create policy "tasks delete" on public.tasks for delete using (public.is_team_member(care_plan_id, auth.uid()));

-- mood_logs: only the user themselves can read/write their own
drop policy if exists "mood select" on public.mood_logs;
create policy "mood select" on public.mood_logs for select using (auth.uid() = user_id);
drop policy if exists "mood insert" on public.mood_logs;
create policy "mood insert" on public.mood_logs for insert with check (auth.uid() = user_id);
drop policy if exists "mood update" on public.mood_logs;
create policy "mood update" on public.mood_logs for update using (auth.uid() = user_id);

-- ----- accept_invite RPC (security definer so the invitee can join even though they don't yet have access)
create or replace function public.accept_invite(invite_token uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  inv public.care_team_invites%rowtype;
  uid uuid := auth.uid();
  initials text;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into inv from public.care_team_invites where token = invite_token;
  if not found then
    raise exception 'Invite not found';
  end if;
  if inv.accepted_at is not null then
    raise exception 'Invite already accepted';
  end if;
  if inv.expires_at < now() then
    raise exception 'Invite expired';
  end if;

  -- Build display initials from the user's profile name (or email)
  select coalesce(
    upper(substr(coalesce(full_name, split_part(email, '@', 1)), 1, 1))
    || upper(substr(split_part(coalesce(full_name, ''), ' ', 2), 1, 1)),
    'AL'
  )
  into initials
  from public.profiles where id = uid;

  insert into public.care_team (care_plan_id, user_id, role, display_initials)
  values (inv.care_plan_id, uid, inv.role, coalesce(nullif(initials, ''), 'AL'))
  on conflict (care_plan_id, user_id) do nothing;

  update public.care_team_invites set accepted_at = now() where id = inv.id;

  return inv.care_plan_id;
end;
$$;

-- ----- Realtime publication (Supabase enables this on a default publication called supabase_realtime)
-- ALTER PUBLICATION ... ADD TABLE has no IF NOT EXISTS form in Postgres, so a
-- bare ADD throws 42710 on re-run. Guard against pg_publication_tables to keep
-- this script truly idempotent.
do $$
declare
  t text;
begin
  foreach t in array array['tasks', 'care_team', 'mood_logs'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
