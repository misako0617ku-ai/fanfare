-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  nickname    text not null,
  icon_url    text,
  birth_year  integer not null,
  role        text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  reporter_score numeric(4,2) not null default 1.0,
  created_at  timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "users: read own or public profile"
  on public.users for select
  using (true);

create policy "users: insert own row"
  on public.users for insert
  with check (auth.uid() = id);

create policy "users: update own row"
  on public.users for update
  using (auth.uid() = id);

-- Auto-create user row on auth signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, nickname, birth_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nickname', '名無し'),
    coalesce((new.raw_user_meta_data->>'birth_year')::integer, 2000)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- ARTISTS
-- ============================================================
create table public.artists (
  id                 uuid primary key default uuid_generate_v4(),
  name               text not null,
  agency             text,
  starto_artist_id   integer,
  youtube_channel_id text,
  official_urls      jsonb not null default '{}',
  created_at         timestamptz not null default now()
);

alter table public.artists enable row level security;
create policy "artists: public read" on public.artists for select using (true);
create policy "artists: admin write" on public.artists for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ============================================================
-- USER OSHI (推し)
-- ============================================================
create table public.user_oshi (
  user_id   uuid not null references public.users(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  primary key (user_id, artist_id)
);

alter table public.user_oshi enable row level security;
create policy "user_oshi: public read" on public.user_oshi for select using (true);
create policy "user_oshi: own write" on public.user_oshi for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- FOLLOWS & BLOCKS
-- ============================================================
create table public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  followee_id uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

alter table public.follows enable row level security;
create policy "follows: public read" on public.follows for select using (true);
create policy "follows: own write" on public.follows for all
  using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

create table public.blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;
create policy "blocks: own read" on public.blocks for select
  using (auth.uid() = blocker_id);
create policy "blocks: own write" on public.blocks for all
  using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

-- ============================================================
-- COMMUNITIES
-- ============================================================
create table public.communities (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  artist_id   uuid references public.artists(id) on delete set null,
  owner_id    uuid not null references public.users(id) on delete cascade,
  description text,
  created_at  timestamptz not null default now()
);

alter table public.communities enable row level security;
create policy "communities: public read" on public.communities for select using (true);
create policy "communities: owner write" on public.communities for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create table public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id      uuid not null references public.users(id) on delete cascade,
  role         text not null default 'member' check (role in ('member', 'moderator')),
  joined_at    timestamptz not null default now(),
  primary key (community_id, user_id)
);

alter table public.community_members enable row level security;
create policy "community_members: public read" on public.community_members for select using (true);
create policy "community_members: own write" on public.community_members for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- POSTS
-- ============================================================
create table public.posts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  body         text not null,
  scope        text not null default 'home' check (scope in ('home', 'community')),
  community_id uuid references public.communities(id) on delete cascade,
  status       text not null default 'published' check (status in ('published', 'hidden', 'under_review')),
  review_flag  boolean not null default false,
  ai_score     integer,
  ai_reason    text,
  created_at   timestamptz not null default now()
);

alter table public.posts enable row level security;

-- Posts are visible if: published + not in a community the user can't see + not from blocked user
create policy "posts: select published"
  on public.posts for select
  using (
    status = 'published'
    and not exists (
      select 1 from public.blocks
      where blocker_id = auth.uid() and blocked_id = user_id
    )
    and not exists (
      select 1 from public.blocks
      where blocker_id = user_id and blocked_id = auth.uid()
    )
    and (
      scope = 'home'
      or (
        scope = 'community'
        and exists (
          select 1 from public.community_members
          where community_id = posts.community_id and user_id = auth.uid()
        )
      )
    )
  );

create policy "posts: own all"
  on public.posts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "posts: admin all"
  on public.posts for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create table public.post_artists (
  post_id   uuid not null references public.posts(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  primary key (post_id, artist_id)
);

alter table public.post_artists enable row level security;
create policy "post_artists: public read" on public.post_artists for select using (true);
create policy "post_artists: own write" on public.post_artists for all
  using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

create table public.post_media (
  id      uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.posts(id) on delete cascade,
  type    text not null check (type in ('image', 'video')),
  r2_key  text not null,
  "order" integer not null default 0
);

alter table public.post_media enable row level security;
create policy "post_media: public read" on public.post_media for select using (true);
create policy "post_media: own write" on public.post_media for all
  using (exists (select 1 from public.posts where id = post_id and user_id = auth.uid()));

-- ============================================================
-- STAMPS
-- ============================================================
create table public.stamps (
  id         uuid primary key default uuid_generate_v4(),
  label      text not null,
  emoji      text not null,
  category   text not null default 'normal' check (category in ('normal', 'info')),
  sort_order integer not null default 0
);

alter table public.stamps enable row level security;
create policy "stamps: public read" on public.stamps for select using (true);
create policy "stamps: admin write" on public.stamps for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create table public.post_stamps (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  stamp_id   uuid not null references public.stamps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, stamp_id)
);

alter table public.post_stamps enable row level security;
create policy "post_stamps: public read" on public.post_stamps for select using (true);
create policy "post_stamps: own write" on public.post_stamps for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- EVENTS (推し情報)
-- ============================================================
create table public.events (
  id             uuid primary key default uuid_generate_v4(),
  artist_id      uuid not null references public.artists(id) on delete cascade,
  type           text not null check (type in ('live', 'tv', 'release', 'other')),
  event_date     date not null,
  title          text not null,
  source_url     text,
  source         text not null check (source in ('itunes', 'youtube', 'scrape', 'user')),
  created_by     uuid references public.users(id) on delete set null,
  verified_count integer not null default 0,
  status         text not null default 'published' check (status in ('published', 'hidden')),
  created_at     timestamptz not null default now()
);

alter table public.events enable row level security;
create policy "events: public read" on public.events for select using (status = 'published');
create policy "events: user insert" on public.events for insert
  with check (auth.uid() = created_by and source = 'user');
create policy "events: admin all" on public.events for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create table public.event_corrections (
  id             uuid primary key default uuid_generate_v4(),
  event_id       uuid not null references public.events(id) on delete cascade,
  user_id        uuid not null references public.users(id) on delete cascade,
  corrected_text text not null,
  created_at     timestamptz not null default now()
);

alter table public.event_corrections enable row level security;
create policy "event_corrections: own read" on public.event_corrections for select
  using (auth.uid() = user_id);
create policy "event_corrections: own insert" on public.event_corrections for insert
  with check (auth.uid() = user_id);

-- ============================================================
-- REPORTS
-- ============================================================
create table public.reports (
  id            uuid primary key default uuid_generate_v4(),
  reporter_id   uuid not null references public.users(id) on delete cascade,
  target_type   text not null check (target_type in ('post', 'event')),
  target_id     uuid not null,
  reason_code   text not null,
  ai_verdict    text,
  ai_confidence numeric(3,2),
  status        text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  created_at    timestamptz not null default now()
);

alter table public.reports enable row level security;
create policy "reports: own insert" on public.reports for insert
  with check (auth.uid() = reporter_id);
create policy "reports: admin all" on public.reports for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ============================================================
-- NG WORDS
-- ============================================================
create table public.ng_words (
  id         uuid primary key default uuid_generate_v4(),
  word       text not null unique,
  created_at timestamptz not null default now()
);

alter table public.ng_words enable row level security;
create policy "ng_words: admin all" on public.ng_words for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
-- Service role reads for moderation (via server-side only)

-- ============================================================
-- APP SETTINGS (管理画面から変更可能な閾値)
-- ============================================================
create table public.app_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
create policy "app_settings: public read" on public.app_settings for select using (true);
create policy "app_settings: admin write" on public.app_settings for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ============================================================
-- SCRAPE TARGETS
-- ============================================================
create table public.scrape_targets (
  id                  uuid primary key default uuid_generate_v4(),
  site_name           text not null,
  url                 text not null,
  is_enabled          boolean not null default true,
  last_etag           text,
  last_content_hash   text,
  last_item_date      date,
  last_success_at     timestamptz,
  consecutive_failures integer not null default 0
);

alter table public.scrape_targets enable row level security;
create policy "scrape_targets: admin all" on public.scrape_targets for all
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ============================================================
-- SEED: STAMPS
-- ============================================================
insert into public.stamps (label, emoji, category, sort_order) values
  ('尊い',     '🙏', 'normal', 1),
  ('しんどい',  '😭', 'normal', 2),
  ('ブラボー',  '👏', 'normal', 3),
  ('好き',     '💗', 'normal', 4),
  ('かわいい',  '🎀', 'normal', 5),
  ('かっこいい','✨', 'normal', 6),
  ('わかる',   '🙌', 'normal', 7),
  ('おめでとう','🎉', 'normal', 8),
  ('知ってる',  '✅', 'info',   1),
  ('行く',     '🙌', 'info',   2),
  ('ちがうかも','❓', 'info',   3);

-- ============================================================
-- SEED: APP SETTINGS (初期閾値)
-- ============================================================
insert into public.app_settings (key, value) values
  ('report_score_threshold', '3.0'),
  ('report_score_per_correct', '0.1'),
  ('report_score_per_wrong', '-0.2'),
  ('report_score_max', '2.0'),
  ('report_score_min', '0.1'),
  ('chigaukaimo_queue_threshold', '5'),
  ('shitteru_badge_threshold', '10'),
  ('moderation_review_queue_limit', '50');

-- ============================================================
-- SEED: NG WORDS (Tier 1 初期リスト)
-- ============================================================
insert into public.ng_words (word) values
  ('ブス'), ('ブサイク'), ('デブ'), ('ハゲ'), ('整形失敗'),
  ('クズ'), ('ゴミ'), ('消えろ'), ('死ね'), ('殺す'),
  ('うせろ'), ('最悪'), ('キモい'), ('気持ち悪い'), ('最低'),
  ('バカ'), ('アホ'), ('馬鹿'), ('阿呆'), ('ボケ');

-- ============================================================
-- SEED: STARTO ARTISTS
-- ============================================================
insert into public.artists (name, agency, starto_artist_id) values
  ('NEWS',         'STARTO', 12),
  ('SUPER EIGHT',  'STARTO', 13),
  ('Hey! Say! JUMP','STARTO', 15),
  ('Kis-My-Ft2',   'STARTO', 17),
  ('timelesz',     'STARTO', 24),
  ('A.B.C-Z',      'STARTO', 26),
  ('WEST.',        'STARTO', 29),
  ('King & Prince','STARTO', 41),
  ('SixTONES',     'STARTO', 42),
  ('Snow Man',     'STARTO', 43),
  ('なにわ男子',   'STARTO', 56),
  ('20th Century', 'STARTO', 57),
  ('Travis Japan', 'STARTO', 60),
  ('Aぇ! group',   'STARTO', 157),
  -- BMSG
  ('BE:FIRST',     'BMSG',   null),
  ('MAZZEL',       'BMSG',   null),
  -- K-POP
  ('BTS',          'HYBE',   null),
  ('ENHYPEN',      'HYBE',   null),
  ('BOYNEXTDOOR',  'HYBE',   null),
  ('TWS',          'HYBE',   null),
  ('SEVENTEEN',    'PLEDIS', null),
  ('TWICE',        'JYP',    null),
  ('aespa',        'SM',     null),
  ('IVE',          'Starship', null),
  ('BLACKPINK',    'YG',     null),
  ('BABYMONSTER',  'YG',     null);

-- ============================================================
-- SCRAPE TARGETS SEED
-- ============================================================
insert into public.scrape_targets (site_name, url, is_enabled) values
  ('STARTO_NEWS',       'https://starto.jp/s/p/news/list',            true),
  ('STARTO_MEDIA',      'https://starto.jp/s/p/media/list',           true),
  ('STARTO_LIVE',       'https://starto.jp/s/p/live',                 true),
  ('STARTO_DISCOGRAPHY','https://starto.jp/s/p/search/discography',   true),
  ('BMSG',              'https://bmsg.tokyo',                         false),
  ('BTS',               'https://bts-official.jp/schedule',           false),
  ('SEVENTEEN',         'https://www.seventeen-17.jp',                false),
  ('ENHYPEN',           'https://enhypen-jp.weverse.io',              false),
  ('BOYNEXTDOOR',       'https://boynextdoor-official.jp',            false),
  ('TWS',               'https://tws-official.jp',                    false),
  ('TWICE',             'https://www.twicejapan.com/schedule/',       false),
  ('aespa',             'https://aespa-official.jp',                  false),
  ('IVE',               'https://ive-official.jp',                    false),
  ('BLACKPINK',         'https://blackpink-official.jp',              false),
  ('BABYMONSTER',       'https://yg-babymonster-official.jp/schedule/live-event/', false);
