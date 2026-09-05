"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PostCard from "@/components/post/PostCard";

interface ProfileViewProps {
  profile: { id: string; nickname: string; icon_url: string | null; created_at: string };
  oshiArtists: Array<{ id: string; name: string }>;
  posts: any[];
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwn: boolean;
  currentUserId: string;
}

export default function ProfileView({
  profile,
  oshiArtists,
  posts,
  followerCount,
  followingCount,
  isFollowing: initialFollowing,
  isOwn,
  currentUserId,
}: ProfileViewProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(followerCount);
  const [postList, setPostList] = useState(posts);

  async function toggleFollow() {
    const supabase = createClient();
    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("followee_id", profile.id);
      setFollowing(false);
      setFollowers((n) => n - 1);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, followee_id: profile.id });
      setFollowing(true);
      setFollowers((n) => n + 1);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="px-4 py-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
          >
            {profile.icon_url ? (
              <img
                src={profile.icon_url}
                alt={profile.nickname}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              profile.nickname[0]
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{profile.nickname}</h1>

            {/* Stats */}
            <div className="flex gap-4 mt-1">
              <div className="text-sm" style={{ color: "var(--ff-muted)" }}>
                フォロワー <strong style={{ color: "var(--ff-fg)" }}>{followers}</strong>
              </div>
              <div className="text-sm" style={{ color: "var(--ff-muted)" }}>
                フォロー中 <strong style={{ color: "var(--ff-fg)" }}>{followingCount}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-2">
              {isOwn ? (
                <Link
                  href="/profile/edit"
                  className="px-4 py-1.5 text-xs font-medium border rounded-full"
                  style={{ borderColor: "var(--ff-border)", color: "var(--ff-fg)" }}
                >
                  プロフィールを編集
                </Link>
              ) : (
                <>
                  <button
                    onClick={toggleFollow}
                    className="px-4 py-1.5 text-xs font-medium rounded-full transition-colors"
                    style={{
                      borderRadius: "9999px",
                      background: following ? "var(--ff-border)" : "var(--ff-accent)",
                      color: following ? "var(--ff-fg)" : "#fff",
                    }}
                  >
                    {following ? "フォロー中" : "フォローする"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Oshi artists */}
        {oshiArtists.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--ff-muted)" }}>
              推し
            </p>
            <div className="flex flex-wrap gap-1.5">
              {oshiArtists.map((a) => (
                <span
                  key={a.id}
                  className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "var(--ff-border)", color: "var(--ff-fg)" }}
                >
                  {a.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: "1px", background: "var(--ff-border)" }} />

      {/* Posts */}
      {postList.length === 0 ? (
        <div className="flex justify-center py-16">
          <p className="text-sm" style={{ color: "var(--ff-muted)" }}>
            まだ投稿がありません
          </p>
        </div>
      ) : (
        <div>
          {postList.map((post) => (
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
