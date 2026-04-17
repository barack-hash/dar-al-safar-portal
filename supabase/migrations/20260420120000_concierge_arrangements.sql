-- Concierge arrangements: persistent luxury bookings (hotels, tours, transfers, flights, VIP).
-- Apply in Supabase SQL Editor or via `supabase db push`.
-- Run after prior migrations (clients, profiles).

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table public.concierge_arrangements (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  assigned_staff_id uuid references public.profiles (user_id) on delete set null,
  title text not null,
  category text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'PLANNING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint concierge_arrangements_category_check
    check (
      category in ('HOTEL', 'TOUR', 'TRANSFER', 'FLIGHT', 'VIP_ACCESS')
    ),
  constraint concierge_arrangements_status_check
    check (
      status in (
        'PLANNING',
        'AWAITING_PAYMENT',
        'CONFIRMED',
        'COMPLETED',
        'CANCELLED'
      )
    ),
  constraint concierge_arrangements_date_range_check
    check (end_date >= start_date)
);

comment on table public.concierge_arrangements is
  'Luxury concierge bookings linked to CRM clients and optional staff owner.';
comment on column public.concierge_arrangements.assigned_staff_id is
  'Staff member (profiles.user_id) owning this arrangement.';
comment on column public.concierge_arrangements.category is
  'HOTEL, TOUR, TRANSFER, FLIGHT, or VIP_ACCESS.';
comment on column public.concierge_arrangements.status is
  'Pipeline: PLANNING → AWAITING_PAYMENT → CONFIRMED → COMPLETED; CANCELLED terminal.';

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

create index concierge_arrangements_client_id_idx
  on public.concierge_arrangements (client_id);

create index concierge_arrangements_status_idx
  on public.concierge_arrangements (status);

create index concierge_arrangements_assigned_staff_id_idx
  on public.concierge_arrangements (assigned_staff_id);

create index concierge_arrangements_start_date_idx
  on public.concierge_arrangements (start_date);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security (match visas: authenticated full CRUD)
-- ---------------------------------------------------------------------------

alter table public.concierge_arrangements enable row level security;

create policy "concierge_arrangements_authenticated_all"
  on public.concierge_arrangements for all to authenticated
  using (true) with check (true);
