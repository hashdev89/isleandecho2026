-- Optional: dedicated rating/reviews columns for tour packages.
-- Email Center / tour editor also store these in important_info JSONB as a fallback.

alter table tours add column if not exists rating numeric default 0;
alter table tours add column if not exists reviews int default 0;
