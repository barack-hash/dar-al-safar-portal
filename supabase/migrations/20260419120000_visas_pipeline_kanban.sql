-- Visa Kanban pipeline (V1): assignment, external tracking, processing center, expected approval ETA.
-- Status enum aligned with Kanban columns: GATHERING_DOCS, READY_TO_SUBMIT, IN_PROCESSING,
-- ACTION_REQUIRED, APPROVED, REJECTED.
--
-- Apply in Supabase SQL Editor or via `supabase db push`.
-- Run after prior migrations (clients, profiles, visas).

-- ---------------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------------

alter table public.visas
  add column if not exists assigned_staff_id uuid references public.profiles (user_id) on delete set null,
  add column if not exists external_tracking_id text,
  add column if not exists processing_center text,
  add column if not exists expected_approval_date date;

comment on column public.visas.assigned_staff_id is 'Staff member (profiles.user_id) owning this application.';
comment on column public.visas.external_tracking_id is 'Reference from VFS, TLS, embassy, etc., for live tracking.';
comment on column public.visas.processing_center is 'e.g. VFS, TLS, EMBASSY, OTHER.';
comment on column public.visas.expected_approval_date is 'Estimated approval date (business days / holidays logic in app).';

-- Optional: constrain processing_center to known values (extend as needed)
alter table public.visas
  drop constraint if exists visas_processing_center_check;

alter table public.visas
  add constraint visas_processing_center_check
  check (
    processing_center is null
    or trim(processing_center) = ''
    or upper(trim(processing_center)) in ('VFS', 'TLS', 'EMBASSY', 'OTHER')
  );

create index if not exists visas_status_idx on public.visas (status);
create index if not exists visas_assigned_staff_id_idx on public.visas (assigned_staff_id);
create index if not exists visas_external_tracking_id_idx on public.visas (external_tracking_id)
  where external_tracking_id is not null and trim(external_tracking_id) <> '';

-- ---------------------------------------------------------------------------
-- 2. Migrate legacy status values → new pipeline tokens
--    (App previously used COLLECTING_DOCS, APPOINTMENT_BOOKED, PROCESSING, APPROVED, REJECTED.)
-- ---------------------------------------------------------------------------

update public.visas
set status = case upper(trim(status))
  when 'COLLECTING_DOCS' then 'GATHERING_DOCS'
  when 'APPOINTMENT_BOOKED' then 'READY_TO_SUBMIT'
  when 'PROCESSING' then 'IN_PROCESSING'
  when 'GATHERING_DOCS' then 'GATHERING_DOCS'
  when 'READY_TO_SUBMIT' then 'READY_TO_SUBMIT'
  when 'IN_PROCESSING' then 'IN_PROCESSING'
  when 'ACTION_REQUIRED' then 'ACTION_REQUIRED'
  when 'APPROVED' then 'APPROVED'
  when 'REJECTED' then 'REJECTED'
  else 'GATHERING_DOCS'
end
where true;

-- ---------------------------------------------------------------------------
-- 3. CHECK constraint on status (drop first if re-running migration in dev)
-- ---------------------------------------------------------------------------

alter table public.visas
  drop constraint if exists visas_status_pipeline_check;

alter table public.visas
  add constraint visas_status_pipeline_check
  check (
    status in (
      'GATHERING_DOCS',
      'READY_TO_SUBMIT',
      'IN_PROCESSING',
      'ACTION_REQUIRED',
      'APPROVED',
      'REJECTED'
    )
  );
