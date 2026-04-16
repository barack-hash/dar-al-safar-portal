-- Allow SUPER_ADMIN in DB (normalized to SUPERADMIN in the app via `normalizeAccessRole`).
-- Link each profile to auth.users.id for RLS-friendly lookups.

alter table public.profiles drop constraint if exists profiles_access_role_check;

alter table public.profiles
  add constraint profiles_access_role_check
  check (access_role in ('SUPERADMIN', 'SUPER_ADMIN', 'MANAGER', 'AGENT'));

comment on column public.profiles.access_role is 'SUPER_ADMIN and SUPERADMIN are both treated as super admin in the app.';

-- After creating the user in Authentication (e.g. emanidriss12@gmail.com), link the profile:
-- insert into public.profiles (user_id, email, full_name, access_role, permissions)
-- values (
--   '<uuid-from-auth.users>',
--   'emanidriss12@gmail.com',
--   'Your Name',
--   'SUPER_ADMIN',
--   '[]'::jsonb
-- )
-- on conflict (email) do update set user_id = excluded.user_id, access_role = excluded.access_role;
