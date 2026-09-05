"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PostCard from "@/components/post/PostCard";
import NewCommunityPost from "./NewCommunityPost";
import CommunityInvite from "./CommunityInvite";

interface Community {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  artists: { id: string; name: string } | null;
}

export default function CommunityView({
  community,
  memberCount,
  isMember: initialMember,
  isModOrOwner,
  currentUserId,
}: {
  community: Community;
  memberCount: number;
  isMember: boolean;
  isModOrOwner: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialMember);
  const [count, setCount] = useState(memberCount);
  const [showPost, setShowPost] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("posts")
      .select("*, users!posts_user_id_fkey(id, nickname, icon_url), post_artists(artists(id, name)), post_stamps(stamp_id, user_id)")
      .eq("community_id", community.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(30);

    const withCounts = (data ?? []).map((p: any) => {
      const stamps: Record<string, number> = {};
      const myStamps: string[] = [];
      for (const ps of p.post_stamps ?? []) {
        stamps[ps.stamp_id] = (stamps[ps.stamp_id] ?? 0) + 1;
        if (ps.user_id === currentUserId) myStamps.push(ps.stamp_id);
      }
      return { ...p, stamp_counts: stamps, my_stamps: myStamps };
    });
    setPosts(withCounts);
    setLoading(false);
  }

  async function toggleMember() {
    const supabase = createClient();
    if (isMember) {
      await supabase
        .from("community_members")
        .delete()
        .eq("community_id", community.id)
        .eq("user_id", currentUserId);
      setIsMember(false);
      setCount((n) => n - 1);
    } else {
      await supabase.from("community_members").insert({
        community_id: community.id,
        user_id: currentUserId,
        role: "member",
      });
      setIsMember(true);
      setCount((n) => n + 1);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--ff-border)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold">{community.name}</h1>
              <CommunityInvite communityId={community.id} />
            </div>
            {community.artists && (
              <p className="text-xs mt-0.5" style={{ color: "var(--ff-muted)" }}>
                {community.artists.name}
              </p>
            )}
            {community.description && (
              <p className="text-sm mt-1" style={{ color: "var(--ff-fg)" }}>
                {community.description}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: "var(--ff-muted)" }}>
              メンバー {count}人
            </p>
          </div>
          <button
            onClick={toggleMember}
            className="flex-shrink-0 px-4 py-1.5 text-xs font-medium rounded-full"
            style={{
              borderRadius: "9999px",
              background: isMember ? "var(--ff-border)" : "var(--ff-accent)",
              color: isMember ? "var(--ff-fg)" : "#fff",
            }}
          >
            {isMember ? "参加中" : "参加する"}
          </button>
        </div>

        {isMember && (
          <button
            onClick={() => setShowPost((p) => !p)}
            className="mt-3 w-full text-left px-3 py-2 text-sm border rounded-lg"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-muted)" }}
          >
            このコミュニティに投稿する...
          </button>
        )}
      </div>

      {showPost && (
        <div style={{ borderBottom: "1px solid var(--ff-border)" }}>
          <NewCommunityPost
            communityId={community.id}
            onPosted={() => { setShowPost(false); loadPosts(); }}
          />
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="text-sm" style={{ color: "var(--ff-muted)" }}>読み込み中...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex justify-center py-16">
          <p className="text-sm" style={{ color: "var(--ff-muted)" }}>まだ投稿がありません</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onStampToggle={loadPosts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
