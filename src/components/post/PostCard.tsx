"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import StampRow from "@/components/stamp/StampRow";

interface Post {
  id: string;
  body: string;
  created_at: string;
  users: { id: string; nickname: string; icon_url: string | null };
  post_artists: Array<{ artists: { id: string; name: string } }>;
  stamp_counts: Record<string, number>;
  my_stamps: string[];
}

export default function PostCard({
  post,
  currentUserId,
  onStampToggle,
}: {
  post: Post;
  currentUserId: string;
  onStampToggle: () => void;
}) {
  const user = post.users ?? { id: "", nickname: "不明", icon_url: null };
  const artists = post.post_artists.map((pa) => pa.artists);

  return (
    <article
      className="px-4 py-4"
      style={{ borderBottom: "1px solid var(--ff-border)" }}
    >
      {/* Author */}
      <div className="flex items-center gap-2 mb-2">
        <Link href={`/profile/${user.id}`}>
          <Avatar nickname={user.nickname} iconUrl={user.icon_url} />
        </Link>
        <div className="flex flex-col min-w-0">
          <Link
            href={`/profile/${user.id}`}
            className="text-sm font-medium truncate"
            style={{ color: "var(--ff-fg)" }}
          >
            {user.nickname}
          </Link>
          <span className="text-xs" style={{ color: "var(--ff-muted)" }}>
            {formatRelativeTime(post.created_at)}
          </span>
        </div>
      </div>

      {/* Artists tags */}
      {artists.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {artists.map((a) => (
            <span
              key={a.id}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--ff-border)", color: "var(--ff-muted)" }}
            >
              {a.name}
            </span>
          ))}
        </div>
      )}

      {/* Body */}
      <p
        className="text-sm leading-relaxed whitespace-pre-wrap break-words mb-3"
        style={{ color: "var(--ff-fg)" }}
      >
        {post.body}
      </p>

      {/* Stamps */}
      <StampRow
        postId={post.id}
        stampCounts={post.stamp_counts}
        myStamps={post.my_stamps}
        currentUserId={currentUserId}
        onToggle={onStampToggle}
      />

      {/* Report */}
      <div className="flex justify-end mt-1">
        <Link
          href={`/report?target_type=post&target_id=${post.id}`}
          className="text-xs"
          style={{ color: "var(--ff-border)" }}
        >
          通報
        </Link>
      </div>
    </article>
  );
}

function Avatar({ nickname, iconUrl }: { nickname: string; iconUrl: string | null }) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={nickname}
        className="w-8 h-8 rounded-full object-cover"
        style={{ borderRadius: "9999px" }}
      />
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
      style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
    >
      {nickname[0]}
    </div>
  );
}
