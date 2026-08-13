-- SEO + Google Search Console fields on the existing settings row.
-- Safe to re-run. Dashboard: Admin → Settings → SEO & Google.

alter table settings
  add column if not exists seo jsonb default '{}'::jsonb;

comment on column settings.seo is
  'SEO + Google Search Console / Analytics IDs used by the public site head, robots, and sitemap.';
