"use client";

import { useState } from "react";

interface ReviewPost {
  id: string;
  body: string;
  ai_score: number | null;
  ai_reason: string | null;
  created_at: string;
  users: { nickname: string } | null;
}

export default function ReviewQueue({ initialPosts }: { initialPosts: ReviewPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState<string | null>(null);

  async function act(postId: string, action: "approve" | "hide") {
    setLoading(postId);
    await fetch(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setLoading(null);
  }

  if (posts.length === 0) {
    return <p className="text-sm" style={{ color: "var(--ff-muted)" }}>確認待ちの投稿はありません ✓</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {posts.map((p) => (
        <div
          key={p.id}
          className="p-3 border rounded-lg"
          style={{ borderColor: "#FFC24B", background: "rgba(255, 194, 75, 0.05)" }}
        >
          <div className="flex justify-between items-start mb-1">
            <span className="text-sm font-medium">{p.users?.nickname ?? "−"}</span>
            <span className="text-xs" style={{ color: "var(--ff-muted)" }}>
              スコア: {p.ai_score ?? "−"}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap mb-1">{p.body}</p>
          {p.ai_reason && (
            <p className="text-xs mb-2" style={{ color: "var(--ff-muted)" }}>
              AI判定: {p.ai_reason}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => act(p.id, "approve")}
              disabled={loading === p.id}
              className="px-3 py-1 text-xs font-medium text-white rounded-full disabled:opacity-50"
              style={{ background: "#38A169" }}
            >
              公開を維持
            </button>
            <button
              onClick={() => act(p.id, "hide")}
              disabled={loading === p.id}
              className="px-3 py-1 text-xs font-medium text-white rounded-full disabled:opacity-50"
              style={{ background: "#E53E3E" }}
            >
              非公開にする
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
