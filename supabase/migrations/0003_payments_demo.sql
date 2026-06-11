-- ALLY v2.1 — Family Care Wallet (payments DEMO layer).
--
-- PSA POSTURE (docs/compliance/PSA-READINESS.md): ALLY is a technical service
-- provider — it records expenses, computes splits, and generates payment
-- INSTRUCTIONS (PayNow references). It never holds, receives, transmits or
-- controls money (PSA First Schedule Part 2 exclusion). Cross-border helper
-- remittance is a REFERRAL to a licensed MPI (post-Apr-2024 "arranging" scope
-- means we must never sit in the instruction chain). These tables therefore
-- store records and statuses only — no balances, no custody, anywhere.

-- ── Expenses (receipt-snap or manual) ───────────────────────────────────────
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null references public.care_plans(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  merchant text not null,
  category text not null check (category in ('Clinic','Pharmacy','Equipment','Groceries','Transport','Helper','Other')),
  amount_cents integer not null check (amount_cents > 0),
  currency char(3) not null default 'SGD',
  expense_date date not null default current_date,
  source text not null default 'manual' check (source in ('receipt_snap','manual')),
  receipt_quote text not null default '',   -- provenance from the receipt image/text
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists expenses_plan_idx on public.expenses (care_plan_id, expense_date desc);

-- ── Splits (siblings may not have accounts yet → label-first) ───────────────
create table if not exists public.expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  member_label text not null,                                -- "Sarah", "David" — works pre-signup
  member_user_id uuid references auth.users(id) on delete set null,
  share_cents integer not null check (share_cents >= 0),
  status text not null default 'pending' check (status in ('pending','settled')),
  settle_method text check (settle_method in ('paynow','cash','other')),
  paynow_ref text,                                           -- instruction reference only; money moves in the member's own bank app
  settled_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists splits_expense_idx on public.expense_splits (expense_id);

-- ── Helper payroll (one helper per care plan, MVP) ──────────────────────────
create table if not exists public.helper_payroll (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null unique references public.care_plans(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  helper_name text not null,
  helper_phone text not null default '',
  salary_cents integer not null check (salary_cents > 0),
  currency char(3) not null default 'SGD',
  payday_dom integer not null default 28 check (payday_dom between 1 and 28),
  remit_corridor text not null default 'NONE' check (remit_corridor in ('PH','ID','MM','IN','LK','BD','NONE')),
  remit_share_cents integer not null default 0 check (remit_share_cents >= 0),  -- how much she typically sends home (referral framing only)
  created_at timestamptz not null default now()
);

-- ── Payroll runs: the 12 guaranteed transactions/yr ─────────────────────────
-- status: scheduled → initiated (PayNow ref shown) → confirmed (employer says paid).
create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  payroll_id uuid not null references public.helper_payroll(id) on delete cascade,
  period_label text not null,                                -- '2026-06'
  amount_cents integer not null check (amount_cents > 0),
  status text not null default 'scheduled' check (status in ('scheduled','initiated','confirmed')),
  paynow_ref text,
  idempotency_key text not null unique,                      -- payroll_id || period (Seed 17)
  initiated_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists payroll_runs_idx on public.payroll_runs (payroll_id, period_label);

-- ── RLS: everything scoped to the care team ────────────────────────────────
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;
alter table public.helper_payroll enable row level security;
alter table public.payroll_runs   enable row level security;

drop policy if exists expenses_team_all on public.expenses;
create policy expenses_team_all on public.expenses
  for all using (public.is_care_team_member(care_plan_id))
  with check (created_by = auth.uid() and public.is_care_team_member(care_plan_id));

drop policy if exists splits_team_all on public.expense_splits;
create policy splits_team_all on public.expense_splits
  for all using (
    exists (select 1 from public.expenses e
            where e.id = expense_id and public.is_care_team_member(e.care_plan_id))
  )
  with check (
    exists (select 1 from public.expenses e
            where e.id = expense_id and public.is_care_team_member(e.care_plan_id))
  );

drop policy if exists payroll_team_all on public.helper_payroll;
create policy payroll_team_all on public.helper_payroll
  for all using (public.is_care_team_member(care_plan_id))
  with check (created_by = auth.uid() and public.is_care_team_member(care_plan_id));

drop policy if exists payroll_runs_team_all on public.payroll_runs;
create policy payroll_runs_team_all on public.payroll_runs
  for all using (
    exists (select 1 from public.helper_payroll hp
            where hp.id = payroll_id and public.is_care_team_member(hp.care_plan_id))
  )
  with check (
    exists (select 1 from public.helper_payroll hp
            where hp.id = payroll_id and public.is_care_team_member(hp.care_plan_id))
  );
