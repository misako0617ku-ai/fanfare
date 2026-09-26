-- Add EBiDAN artists
insert into public.artists (name, agency) values
  ('超特急',         'EBiDAN'),
  ('M!LK',          'EBiDAN'),
  ('SUPER★DRAGON',  'EBiDAN'),
  ('Sakurashimeji', 'EBiDAN'),
  ('ONE N'' ONLY',  'EBiDAN'),
  ('原因は自分にある。', 'EBiDAN'),
  ('BUDDiiS',       'EBiDAN'),
  ('ICEx',          'EBiDAN'),
  ('Lienel',        'EBiDAN'),
  ('iiONDO',        'EBiDAN');

-- Add EBiDAN scrape target
insert into public.scrape_targets (site_name, url, is_enabled) values
  ('EBIDAN_NEWS', 'https://ebidan.jp/news/', true);
