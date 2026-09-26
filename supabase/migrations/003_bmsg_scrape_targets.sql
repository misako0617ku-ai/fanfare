-- Add BMSG artist-specific scrape targets
insert into public.scrape_targets (site_name, url, is_enabled) values
  ('BEFIRST_NEWS', 'https://befirst.tokyo/news/', true),
  ('MAZZEL_NEWS',  'https://mazzel.tokyo/news/',  true);
