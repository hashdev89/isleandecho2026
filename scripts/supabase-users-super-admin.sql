-- Allow Super Admin on users.role
-- Run in Supabase → SQL Editor. Safe to run more than once.

-- Convert enum/varchar role columns to text so super_admin can be stored
alter table users
  alter column role type text using role::text;

-- Drop any CHECK constraints that still limit role to admin/staff/customer
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.users'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%role%'
  loop
    execute format('alter table users drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check
  check (role is null or role in ('super_admin', 'admin', 'staff', 'customer'));
