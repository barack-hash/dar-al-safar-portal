-- Ticketing Command Center: GDS PNR holds, issuance, and itinerary (app sync).
-- Apply in Supabase SQL Editor or via `supabase db push`.
-- Run after prior migrations (clients, profiles).

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------

create table public.ticketing_bookings (
  id text primary key,
  client_id text not null references public.clients (id) on delete cascade,
  assigned_staff_id uuid references public.profiles (user_id) on delete set null,
  pnr_code text not null,
  airline_code text not null,
  ticket_number text,
  itinerary_summary text not null,
  departure_date date not null,
  arrival_date date not null,
  time_to_limit timestamptz not null,
  status text not null default 'ON_HOLD',
  pricing jsonb not null,
  itinerary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ticketing_bookings_status_check
    check (
      status in ('ON_HOLD', 'TICKETED', 'VOIDED', 'CANCELLED')
    ),
  constraint ticketing_bookings_date_range_check
    check (arrival_date >= departure_date)
);

comment on table public.ticketing_bookings is
  'Flight PNR / ticketing records: GDS metadata, TTL, pricing and segment JSON for the app.';
comment on column public.ticketing_bookings.assigned_staff_id is
  'Staff member (profiles.user_id) owning this booking.';
comment on column public.ticketing_bookings.time_to_limit is
  'When the airline/GDS hold expires; used for countdown and urgency UI.';
comment on column public.ticketing_bookings.pricing is
  'JSON: netFare, taxes, markup, grossTotal, currency (BookingRecord.pricing).';
comment on column public.ticketing_bookings.itinerary is
  'JSON array of flight segments (FlightSegment[]).';

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

create index ticketing_bookings_time_to_limit_idx
  on public.ticketing_bookings (time_to_limit);

create index ticketing_bookings_client_id_idx
  on public.ticketing_bookings (client_id);

create index ticketing_bookings_status_idx
  on public.ticketing_bookings (status);

create index ticketing_bookings_pnr_code_idx
  on public.ticketing_bookings (pnr_code);

create index ticketing_bookings_assigned_staff_id_idx
  on public.ticketing_bookings (assigned_staff_id);

-- ---------------------------------------------------------------------------
-- 3. Row Level Security (match visas / concierge_arrangements)
-- ---------------------------------------------------------------------------

alter table public.ticketing_bookings enable row level security;

create policy "ticketing_bookings_authenticated_all"
  on public.ticketing_bookings for all to authenticated
  using (true) with check (true);
