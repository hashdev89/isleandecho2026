-- Booking table helpers for production (run in Supabase SQL editor if needed)

-- Human-readable order number used in checkout URLs (B001, B002, ...)
alter table bookings add column if not exists booking_ref text;
create index if not exists bookings_booking_ref_idx on bookings(booking_ref);

-- Optional columns used by tour / rent-car / custom trip bookings
alter table bookings add column if not exists booking_type text default 'tour';
alter table bookings add column if not exists vehicle_id text;
alter table bookings add column if not exists vehicle_name text;
alter table bookings add column if not exists pickup_city_id text;
alter table bookings add column if not exists pickup_city_name text;
alter table bookings add column if not exists dropoff_city_id text;
alter table bookings add column if not exists dropoff_city_name text;
alter table bookings add column if not exists route_km numeric;
alter table bookings add column if not exists base_rent numeric;
alter table bookings add column if not exists extra_km_charge numeric;
alter table bookings add column if not exists one_way_fee numeric;
alter table bookings add column if not exists additional_charges jsonb;
alter table bookings add column if not exists payment_method text;
alter table bookings add column if not exists payment_id text;
alter table bookings add column if not exists updated_at timestamptz default now();
