-- Add STARTO EVENT and CONCERT category scrape targets
insert into public.scrape_targets (site_name, url, is_enabled) values
  ('STARTO_EVENT',   'https://starto.jp/s/p/news/list?ct=event',   true),
  ('STARTO_CONCERT', 'https://starto.jp/s/p/news/list?ct=concert', true);
