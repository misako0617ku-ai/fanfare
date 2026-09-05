"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Artist { id: string; name: string; agency: string | null }

export default function CreateCommunityForm({ artists }: { artists: Artist[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [artistId, setArtistId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("コミュニティ名を入力してください"); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error: err } = await supabase
      .from("communities")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        artist_id: artistId || null,
        owner_id: user.id,
      })
      .select()
      .single();

    if (err || !data) { setError("作成に失敗しました"); setLoading(false); return; }

    // Join as moderator
    await supabase.from("community_members").insert({
      community_id: data.id,
      user_id: user.id,
      role: "moderator",
    });

    router.push(`/communities/${data.id}`);
    router.refresh();
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-base font-bold mb-4">コミュニティを作成</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">コミュニティ名</label>
          <input
            type="text"
            required
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
            style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
            placeholder="例: Snow Man 語り部"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">関連アーティスト（任意）</label>
          <select
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
            style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
          >
            <option value="">選択しない</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">説明（任意）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded-lg outline-none resize-none focus:ring-2 focus:ring-[var(--ff-accent)]"
            style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
            placeholder="どんなコミュニティか一言で..."
          />
        </div>

        {error && <p className="text-sm" style={{ color: "#E53E3E" }}>{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 text-sm font-medium text-white rounded-full disabled:opacity-50"
          style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
        >
          {loading ? "作成中..." : "作成する"}
        </button>
      </form>
    </div>
  );
}
