-- Client CRM: travel documents, structured phone, family grouping, frequent flyer data.
-- Storage: private bucket `client-documents` for passport / ID / birth certificate scans.
--
-- Apply in Supabase SQL Editor or via `supabase db push`.
-- Recommended object paths: {client_id}/{doc_type}/{uuid}_{filename}

-- ---------------------------------------------------------------------------
-- 1. public.clients — new columns (existing passport_id + expiry_date unchanged)
-- ---------------------------------------------------------------------------

alter table public.clients
  add column if not exists date_of_birth date,
  add column if not exists phone_e164 text,
  add column if not exists ethiopian_national_id text,
  add column if not exists passport_scan_url text,
  add column if not exists national_id_scan_url text,
  add column if not exists birth_certificate_url text,
  add column if not exists family_group_id uuid,
  add column if not exists frequent_flyer_numbers jsonb not null default '[]'::jsonb;

comment on column public.clients.date_of_birth is 'Traveler date of birth.';
comment on column public.clients.phone_e164 is 'Primary phone in E.164 format (e.g. +251912345678).';
comment on column public.clients.ethiopian_national_id is 'Fayda / national ID when applicable.';
comment on column public.clients.passport_scan_url is 'Storage object path in bucket client-documents (not a public URL).';
comment on column public.clients.national_id_scan_url is 'Storage object path for national ID scan.';
comment on column public.clients.birth_certificate_url is 'Storage object path for birth certificate (minors / family visas).';
comment on column public.clients.family_group_id is 'Shared UUID linking spouse/children in the same household.';
comment on column public.clients.frequent_flyer_numbers is 'JSON array of {airline, number} objects.';

-- Optional strict E.164 check (nullable column: only validate when non-empty)
alter table public.clients
  drop constraint if exists clients_phone_e164_e164_check;

alter table public.clients
  add constraint clients_phone_e164_e164_check
  check (
    phone_e164 is null
    or phone_e164 = ''
    or phone_e164 ~ '^\+[1-9]\d{1,14}$'
  );

alter table public.clients
  drop constraint if exists clients_frequent_flyer_numbers_is_array;

alter table public.clients
  add constraint clients_frequent_flyer_numbers_is_array
  check (jsonb_typeof(frequent_flyer_numbers) = 'array');

-- ---------------------------------------------------------------------------
-- 2. Storage bucket: client-documents (private)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-documents',
  'client-documents',
  false,
  52428800, -- 50 MiB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 3. Storage RLS policies (authenticated staff only)
-- ---------------------------------------------------------------------------

-- Remove old policies if re-running migration in a dev branch
drop policy if exists "client_documents_authenticated_select" on storage.objects;
drop policy if exists "client_documents_authenticated_insert" on storage.objects;
drop policy if exists "client_documents_authenticated_update" on storage.objects;
drop policy if exists "client_documents_authenticated_delete" on storage.objects;

create policy "client_documents_authenticated_select"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'client-documents');

create policy "client_documents_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'client-documents');

create policy "client_documents_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'client-documents')
  with check (bucket_id = 'client-documents');

create policy "client_documents_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'client-documents');
