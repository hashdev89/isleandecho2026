-- Super Admin dashboard section visibility per role.
-- Safe to re-run. Dashboard: Super Admin → Access control.

alter table settings
  add column if not exists dashboard_access jsonb default '{}'::jsonb;

comment on column settings.dashboard_access is
  'Which dashboard sections admin/staff/customer can see. Super Admin always has all sections.';
