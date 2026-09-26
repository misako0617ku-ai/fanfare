-- Add K-POP scrape targets (artists already exist in DB)
insert into public.scrape_targets (site_name, url, is_enabled) values
  ('TWICE_NEWS',      'https://www.twicejapan.com/news/',         true),
  ('ENHYPEN_NEWS',    'https://enhypen-jp.weverse.io/news/',      true),
  ('TWS_NEWS',        'https://tws-official.jp/news/',            true),
  ('BOYNEXTDOOR_NEWS','https://boynextdoor-official.jp/news/',    true);
