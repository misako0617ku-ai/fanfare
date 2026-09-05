"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PostCard from "./PostCard";
import type { Tables } from "@/types/database";

type Tab = "oshi" | "follow" | "discover";

interface PostWithUser extends Tables<"posts"> {
  users: Pick<Tables<"users">, "id" | "nickname" | "icon_url">;
  post_artists: Array<{ artists: Pick<Tables<"artists">, "id" | "name"> }>;
  stamp_counts: Record<string, number>;
  my_stamps: string[];
}

export default function HomeFeed({
  userId,
  activeTab,
}: {
  userId: string;
  activeTab: Tab;
}) {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, [activeTab]);

  async function loadPosts() {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("posts")
      .select(
        `*, users(id, nickname, icon_url), post_artists(artists(id, name)), post_stamps(stamp_id, user_id)`
      )
      .eq("status", "published")
      .eq("scope", "home")
      .order("created_at", { ascending: false })
      .limit(30);

    if (activeTab === "oshi") {
      const { data: oshi } = await supabase
        .from("user_oshi")
        .select("artist_id")
        .eq("user_id", userId);
      const artistIds = (oshi ?? []).map((o) => o.artist_id);
      if (artistIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      const { data: postIds } = await supabase
        .from("post_artists")
        .select("post_id")
        .in("artist_id", artistIds);
      const ids = (postIds ?? []).map((p) => p.post_id);
      if (ids.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      query = query.in("id", ids);
    } else if (activeTab === "follow") {
      const { data: follows } = await supabase
        .from("follows")
        .select("followee_id")
        .eq("follower_id", userId);
      const followeeIds = (follows ?? []).map((f) => f.followee_id);
      if (followeeIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }
      query = query.in("user_id", followeeIds);
    } else if (activeTab === "discover") {
      // Use the discover_feed SQL function for equal artist distribution
      const { data: discoverData } = await (supabase as any).rpc("discover_feed", {
        p_user_id: userId,
        p_limit_per_artist: 3,
        p_days: 14,
      });
      if (!discoverData) { setLoading(false); return; }
      // Fetch stamps for discover posts
      const discoverIds = (discoverData as any[]).map((p: any) => p.id);
      const { data: stamps } = await supabase
        .from("post_stamps")
        .select("post_id, stamp_id, user_id")
        .in("post_id", discoverIds);
      const { data: fullPosts } = await supabase
        .from("posts")
        .select("*, users(id, nickname, icon_url), post_artists(artists(id, name))")
        .in("id", discoverIds);
      const stampMap: Record<string, { counts: Record<string, number>; mine: string[] }> = {};
      for (const ps of stamps ?? []) {
        if (!stampMap[ps.post_id]) stampMap[ps.post_id] = { counts: {}, mine: [] };
        stampMap[ps.post_id].counts[ps.stamp_id] = (stampMap[ps.post_id].counts[ps.stamp_id] ?? 0) + 1;
        if (ps.user_id === userId) stampMap[ps.post_id].mine.push(ps.stamp_id);
      }
      const withCounts = (fullPosts ?? []).map((p: any) => ({
        ...p,
        stamp_counts: stampMap[p.id]?.counts ?? {},
        my_stamps: stampMap[p.id]?.mine ?? [],
      }));
      setPosts(withCounts);
      setLoading(false);
      return;
    }

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    const withCounts = data.map((p: any) => {
      const stamps: Record<string, number> = {};
      const myStamps: string[] = [];
      for (const ps of p.post_stamps ?? []) {
        stamps[ps.stamp_id] = (stamps[ps.stamp_id] ?? 0) + 1;
        if (ps.user_id === userId) myStamps.push(ps.stamp_id);
      }
      return { ...p, stamp_counts: stamps, my_stamps: myStamps };
    });

    setPosts(withCounts);
    setLoading(false);
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "oshi", label: "推し" },
    { key: "follow", label: "フォロー中" },
    { key: "discover", label: "みつける" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div
        className="sticky top-12 z-30 flex border-b"
        style={{ background: "var(--ff-bg)", borderColor: "var(--ff-border)" }}
      >
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/home?tab=${t.key}`}
            className="flex-1 text-center py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === t.key ? "var(--ff-accent)" : "var(--ff-muted)",
              borderBottom: activeTab === t.key ? "2px solid var(--ff-accent)" : "2px solid transparent",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span style={{ color: "var(--ff-muted)" }} className="text-sm">
            読み込み中...
          </span>
        </div>
      ) : posts.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              onStampToggle={loadPosts}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, string> = {
    oshi: "推しを登録すると、ここに情報が集まります",
    follow: "フォローしているユーザーの投稿がここに表示されます",
    discover: "最初のファンファーレを鳴らしてみませんか",
  };
  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center gap-4">
      <p style={{ color: "var(--ff-muted)" }} className="text-sm">
        {messages[tab]}
      </p>
      {tab !== "follow" && (
        <Link
          href="/post/new"
          className="px-5 py-2 text-sm font-medium text-white rounded-full"
          style={{ background: "var(--ff-accent)" }}
        >
          投稿する
        </Link>
      )}
    </div>
  );
}
