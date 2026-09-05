-- 「みつける」タブ用: アーティストごとに均等配分してサンプリングする関数
create or replace function public.discover_feed(
  p_user_id uuid,
  p_limit_per_artist integer default 3,
  p_days integer default 14
)
returns table (
  id uuid,
  user_id uuid,
  body text,
  scope text,
  community_id uuid,
  status text,
  review_flag boolean,
  ai_score integer,
  ai_reason text,
  created_at timestamptz
)
language sql
security invoker
stable
as $$
  select
    p.id, p.user_id, p.body, p.scope, p.community_id,
    p.status, p.review_flag, p.ai_score, p.ai_reason, p.created_at
  from (
    select
      p.*,
      row_number() over (
        partition by pa.artist_id
        order by
          (select count(*) from public.post_stamps ps where ps.post_id = p.id) desc,
          p.created_at desc
      ) as rn
    from public.posts p
    join public.post_artists pa on pa.post_id = p.id
    where
      p.status = 'published'
      and p.scope = 'home'
      and p.created_at > now() - (p_days || ' days')::interval
      -- ブロック除外
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = p_user_id and b.blocked_id = p.user_id)
           or (b.blocker_id = p.user_id and b.blocked_id = p_user_id)
      )
  ) ranked
  where rn <= p_limit_per_artist
  order by random()
$$;
