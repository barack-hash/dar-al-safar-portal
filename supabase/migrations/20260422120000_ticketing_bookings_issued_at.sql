-- Record when a PNR was ticketed (for stats and e-ticket display).
-- Apply after ticketing_bookings base migration.

alter table public.ticketing_bookings
  add column if not exists issued_at timestamptz;

comment on column public.ticketing_bookings.issued_at is
  'Set when status becomes TICKETED and ticket_number is recorded.';
