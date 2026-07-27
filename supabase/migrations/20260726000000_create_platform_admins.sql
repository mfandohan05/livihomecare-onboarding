-- Studio: platform-wide admin tool, separate access path from admin_users.
--
-- platform_admins is intentionally isolated from admin_users: no shared columns, no FKs
-- between them, and no RLS policies granted to `anon`/`authenticated`. The only way to
-- read or write this table is the service-role client inside a Studio Edge Function,
-- which verifies auth.uid() is present here before doing anything else. Studio's
-- frontend never queries this table directly.
create table if not exists public.platform_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- Companion "save" function for company_data.company_ein, mirroring the existing
-- get_company_ein(p_company_id, p_encryption_key) read function's encryption scheme
-- (pgp_sym_encrypt/pgp_sym_decrypt, keyed by the COMPANY_ENCRYPTION_KEY secret).
-- No such "save" function existed before now — get_company_ein only ever read it.
create or replace function public.save_company_ein_encrypted(
  p_company_id uuid,
  p_ein text,
  p_encryption_key text
)
returns void
language plpgsql
security definer
as $function$
begin
  update company_data
  set company_ein = pgp_sym_encrypt(p_ein, p_encryption_key)::text
  where company_id = p_company_id;
end;
$function$;

-- Bootstrap: grant yourself Studio access. Add more rows the same way for
-- any additional platform admins later.
insert into public.platform_admins (id)
select id from auth.users where email = 'mfandohan23@gmail.com'
on conflict (id) do nothing;
