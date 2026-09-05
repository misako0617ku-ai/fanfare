"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PostCard from "@/components/post/PostCard";
import NewCommunityPost from "./NewCommunityPost";

interface Community {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  artists: { id: string; name: string } | null;
}

export default function CommunityView({
  community,
  posts,
  memberCount,
  isMember: initialMember,
  isModOrOwner,
  currentUserId,
}: {
  community: Community;
  posts: any[];
  memberCount: number;
  isMember: boolean;
  isModOrOwner: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isMember, setIsMember] = useState(initialMember);
  const [count, setCount] = useState(memberCount);
  const [showPost, setShowPost] = useState(false);
  const [localPosts, setLocalPosts] = useState(posts);

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
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--ff-border)" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-bold">{community.name}</h1>
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
            onPosted={() => { setShowPost(false); router.refresh(); }}
          />
        </div>
      )}

      {/* Posts */}
      {localPosts.length === 0 ? (
        <div className="flex justify-center py-16">
          <p className="text-sm" style={{ color: "var(--ff-muted)" }}>
            まだ投稿がありません
          </p>
        </div>
      ) : (
        <div>
          {localPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              onStampToggle={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}
