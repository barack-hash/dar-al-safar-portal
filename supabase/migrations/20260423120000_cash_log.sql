-- Cash Log (Informal & Personal Ledger): quick-entry cash tracking with client linkage.
-- Apply in Supabase SQL Editor or via `supabase db push`.
-- Run after prior migrations (clients, profiles).

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table public.cash_log (
  id uuid primary key default gen_random_uuid(),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null
    check (currency in ('ETB', 'USD')),
  transaction_type text not null
    check (transaction_type in ('INCOME', 'EXPENSE', 'LOAN_REPAYMENT')),
  account_source text not null,
  linked_client_id text references public.clients (id) on delete set null,
  recorded_by uuid not null references public.profiles (user_id) on delete restrict,
  description text not null default '',
  quick_tags text[] not null default '{}'::text[],
  is_formal_accounting_ready boolean not null default false,
  due_date date,
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cash_log is
  'Informal/personal ledger entries used by Cash Log quick-entry workflow.';
comment on column public.cash_log.account_source is
  'Source bucket for funds, e.g. Personal CBE, Cash in Hand, Informal Loan.';
comment on column public.cash_log.linked_client_id is
  'Optional FK to clients for client-linked loan/payment history.';
comment on column public.cash_log.recorded_by is
  'Staff member (profiles.user_id) who recorded the entry.';
comment on column public.cash_log.is_formal_accounting_ready is
  'Flag for later sync/review in formal Accounting workflows.';
comment on column public.cash_log.due_date is
  'Optional expected due date for informal loan/repayment reminders.';
comment on column public.cash_log.reminder_enabled is
  'Whether reminder logic should alert staff for this entry.';

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

create index cash_log_due_date_idx
  on public.cash_log (due_date);

create index cash_log_linked_client_id_idx
  on public.cash_log (linked_client_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.cash_log enable row level security;

create policy "cash_log_authenticated_all"
  on public.cash_log for all to authenticated
  using (true) with check (true);
