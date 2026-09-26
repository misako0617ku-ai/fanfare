-- Allow scraper to insert events with source='scrape' (no user auth required)
create policy "events: scrape insert" on public.events
  for insert with check (source = 'scrape' and created_by is null);
