-- Cash Log clarity upgrade: counterparty/lender and purpose tracking.
-- Safe to re-run due to IF NOT EXISTS guards.

alter table public.cash_log
  add column if not exists counterparty_name text,
  add column if not exists purpose text;

create index if not exists cash_log_counterparty_name_idx
  on public.cash_log (counterparty_name);

create index if not exists cash_log_purpose_idx
  on public.cash_log (purpose);

comment on column public.cash_log.counterparty_name is
  'Optional free-text name of lender/counterparty (e.g., Uncle Ibrahim, Abyssinia Bank).';

comment on column public.cash_log.purpose is
  'Optional reason/category for the entry (e.g., Emergency Float, Office Supplies, Visa Deposit).';
