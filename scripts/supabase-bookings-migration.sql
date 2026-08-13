-- Run this in Supabase → SQL Editor (fixes "customer_email column not found" on live bookings)
-- Safe to run multiple times (IF NOT EXISTS on table + columns).

create table if not exists bookings (
  id text primary key,
  booking_ref text,
  booking_type text default 'tour',
  tour_package_id text default '',
  tour_package_name text default '',
  vehicle_id text,
  vehicle_name text,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text default '',
  start_date text,
  end_date text,
  guests int not null default 1,
  total_price numeric,
  status text not null default 'pending',
  special_requests text default '',
  payment_status text default 'pending',
  payment_method text,
  payment_id text,
  pickup_city_id text,
  pickup_city_name text,
  dropoff_city_id text,
  dropoff_city_name text,
  route_km numeric,
  base_rent numeric,
  extra_km_charge numeric,
  one_way_fee numeric,
  additional_charges jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add columns when table already exists with an older/partial schema
alter table bookings add column if not exists booking_ref text;
alter table bookings add column if not exists booking_type text default 'tour';
alter table bookings add column if not exists tour_package_id text default '';
alter table bookings add column if not exists tour_package_name text default '';
alter table bookings add column if not exists vehicle_id text;
alter table bookings add column if not exists vehicle_name text;
alter table bookings add column if not exists customer_name text default '';
alter table bookings add column if not exists customer_email text default '';
alter table bookings add column if not exists customer_phone text default '';
alter table bookings add column if not exists start_date text;
alter table bookings add column if not exists end_date text;
alter table bookings add column if not exists guests int default 1;
alter table bookings add column if not exists total_price numeric;
alter table bookings add column if not exists status text default 'pending';
alter table bookings add column if not exists special_requests text default '';
alter table bookings add column if not exists payment_status text default 'pending';
alter table bookings add column if not exists payment_method text;
alter table bookings add column if not exists payment_id text;
alter table bookings add column if not exists pickup_city_id text;
alter table bookings add column if not exists pickup_city_name text;
alter table bookings add column if not exists dropoff_city_id text;
alter table bookings add column if not exists dropoff_city_name text;
alter table bookings add column if not exists route_km numeric;
alter table bookings add column if not exists base_rent numeric;
alter table bookings add column if not exists extra_km_charge numeric;
alter table bookings add column if not exists one_way_fee numeric;
alter table bookings add column if not exists additional_charges jsonb;
alter table bookings add column if not exists created_at timestamptz default now();
alter table bookings add column if not exists updated_at timestamptz default now();

alter table bookings add column if not exists updated_at timestamptz default now();

-- Legacy columns used by older Supabase schemas
alter table bookings add column if not exists tour_id text;
alter table bookings add column if not exists tour_name text;

-- Drop tour FKs so car rentals + custom trips can save without a tours row
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.bookings'::regclass
      and con.contype = 'f'
      and pg_get_constraintdef(con.oid) ~* '(tour_id|tour_package_id)'
  loop
    execute format('alter table bookings drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table bookings drop constraint if exists bookings_tour_id_fkey;
alter table bookings drop constraint if exists bookings_tour_package_id_fkey;

-- Relax NOT NULL on tour_id so custom trips / rentals without a tour still save
alter table bookings alter column tour_id drop not null;
alter table bookings alter column tour_id drop default;

update bookings
set tour_id = coalesce(nullif(tour_id, ''), nullif(tour_package_id, ''), 'custom-trip')
where tour_id is null or tour_id = '';

update bookings
set tour_name = coalesce(nullif(tour_name, ''), nullif(tour_package_name, ''), 'Custom trip')
where tour_name is null or tour_name = '';

create index if not exists bookings_booking_ref_idx on bookings(booking_ref);
create index if not exists bookings_customer_email_idx on bookings(customer_email);
create index if not exists bookings_created_at_idx on bookings(created_at desc);

-- If id was uuid type, booking_ref still works for checkout URLs (B001, B002, …)
-- Optional: notify PostgREST to reload schema (Supabase usually picks this up within ~1 min)
