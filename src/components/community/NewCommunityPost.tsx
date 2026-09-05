"use client";

import { useState } from "react";

export default function NewCommunityPost({
  communityId,
  onPosted,
}: {
  communityId: string;
  onPosted: () => void;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, communityId, artistIds: [], mediaKeys: [] }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "投稿に失敗しました"); setLoading(false); return; }

    setBody("");
    onPosted();
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="コミュニティに投稿する..."
        className="w-full px-3 py-2 text-sm border rounded-lg resize-none outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
        style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
      />
      {error && <p className="text-xs" style={{ color: "#E53E3E" }}>{error}</p>}
      <button
        type="submit"
        disabled={loading || !body.trim()}
        className="self-end px-4 py-1.5 text-sm font-medium text-white rounded-full disabled:opacity-50"
        style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
      >
        {loading ? "投稿中..." : "投稿する"}
      </button>
    </form>
  );
}
