-- Dar Al Safar — initial schema for app sync (clients, visas, cash log, profiles).
-- Apply in Supabase SQL Editor or via `supabase db push` when using the Supabase CLI.
--
-- After applying:
-- 1. Create staff users under Authentication → Users; set each profile.user_id = auth.users.id.
-- 2. Tighten RLS policies below from broad `authenticated` access to per-role / per-tenant rules.
-- 3. Apply `20260417100000_profiles_super_admin_alias.sql` if you store SUPER_ADMIN in access_role.

create extension if not exists pgcrypto;

-- Staff / admin (permissions loaded on login)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  access_role text not null default 'AGENT'
    check (access_role in ('SUPERADMIN', 'MANAGER', 'AGENT')),
  legacy_role text check (legacy_role in ('ADMIN', 'AGENT', 'VIEWER')),
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Staff directory + access; permissions is a JSON array of strings like "clients:view".';

create table public.clients (
  id text primary key,
  name text not null,
  email text not null,
  passport_id text not null,
  nationality text not null,
  expiry_date date,
  contact text not null,
  source text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invoices (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  client_name text not null,
  passport_id text not null,
  contact text not null,
  date date not null,
  due_date date not null,
  status text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null,
  concierge_fee numeric not null,
  total numeric not null,
  currency text not null check (currency in ('ETB', 'USD', 'SAR'))
);

create table public.visas (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  destination_country text not null,
  visa_type text not null,
  status text not null,
  submission_date date not null,
  appointment_date date,
  document_deadline date not null,
  passport_required boolean not null default true,
  documents jsonb not null default '[]'::jsonb,
  point_of_entry text not null default '',
  yellow_fever_required boolean not null default false,
  intended_entry_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cash log only (not the accounting ledger Transaction type in the app).
create table public.transactions (
  id text primary key,
  date date not null,
  client_entity text not null default '',
  service text not null default '',
  description text not null default '',
  money_in numeric not null default 0,
  money_out numeric not null default 0,
  currency text not null check (currency in ('ETB', 'USD', 'SAR')),
  method text not null check (method in ('Bank', 'Cash')),
  staff text not null default '',
  notes text not null default '',
  status text not null check (status in ('Cleared', 'Pending', 'Overdue')),
  category text not null check (category in ('Income', 'Expense')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transactions is 'Cash log entries (CashLogEntry). Accounting ledger remains local until migrated.';

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.visas enable row level security;
alter table public.transactions enable row level security;

-- Single-tenant internal tool: any authenticated user can CRUD.
-- Replace with finer policies (e.g. auth.uid() = user_id on profiles) for production.
create policy "profiles_authenticated_all"
  on public.profiles for all to authenticated
  using (true) with check (true);

create policy "clients_authenticated_all"
  on public.clients for all to authenticated
  using (true) with check (true);

create policy "invoices_authenticated_all"
  on public.invoices for all to authenticated
  using (true) with check (true);

create policy "visas_authenticated_all"
  on public.visas for all to authenticated
  using (true) with check (true);

create policy "transactions_authenticated_all"
  on public.transactions for all to authenticated
  using (true) with check (true);

-- Example profile seed (adjust email / permissions after you create auth users):
-- insert into public.profiles (email, full_name, access_role, legacy_role, permissions)
-- values (
--   'admin@darsafar.com',
--   'DASA Administrator',
--   'SUPERADMIN',
--   'ADMIN',
--   '[]'::jsonb
-- );
