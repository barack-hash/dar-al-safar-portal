-- Formal General Ledger: professional ledger rows with tax fields and source traceability.
-- Apply in Supabase SQL Editor or via `supabase db push`.
-- Run after prior migrations (profiles, clients, etc.).

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table public.formal_ledger (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  description text not null default '',
  category text not null
    check (category in ('Income', 'Expense', 'Tax', 'Transfer')),
  currency text not null
    check (currency in ('ETB', 'USD', 'SAR')),
  gross_amount numeric(14, 2) not null,
  vat_amount numeric(14, 2) not null default 0,
  wht_amount numeric(14, 2) not null default 0,
  net_amount numeric(14, 2) not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'VERIFIED')),
  source_type text not null
    check (source_type in ('TICKETING', 'CASH_LOG', 'MANUAL')),
  source_id text
);

comment on table public.formal_ledger is
  'Formal accounting ledger: gross/VAT/WHT/net with operational source linkage.';
comment on column public.formal_ledger.source_id is
  'Optional FK to originating record (text to support mixed PK types, e.g. ticketing id vs cash_log uuid).';
comment on column public.formal_ledger.net_amount is
  'Net after tax treatment as defined by the posting logic (store explicitly; do not rely on UI-only math).';

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

-- Prevent double-posting from the same operational source while row is active.
create unique index formal_ledger_source_dedupe_idx
  on public.formal_ledger (source_type, source_id)
  where source_id is not null
    and status in ('PENDING', 'VERIFIED');

create index formal_ledger_status_created_at_idx
  on public.formal_ledger (status, created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.formal_ledger enable row level security;

create policy "formal_ledger_authenticated_all"
  on public.formal_ledger for all to authenticated
  using (true) with check (true);
