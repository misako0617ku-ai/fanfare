"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Artist {
  id: string;
  name: string;
  agency: string | null;
}

export default function ProfileEditForm({
  userId,
  initialNickname,
  initialIconUrl,
  initialOshiIds,
  allArtists,
}: {
  userId: string;
  initialNickname: string;
  initialIconUrl: string | null;
  initialOshiIds: string[];
  allArtists: Artist[];
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(initialNickname);
  const [oshiIds, setOshiIds] = useState<string[]>(initialOshiIds);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const agencies = Array.from(new Set(allArtists.map((a) => a.agency ?? "その他")));
  const filtered = query
    ? allArtists.filter((a) => a.name.includes(query) || (a.agency ?? "").includes(query))
    : allArtists;

  function toggleOshi(id: string) {
    setOshiIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!nickname.trim()) { setError("ニックネームを入力してください"); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const { error: nickError } = await supabase
      .from("users")
      .update({ nickname: nickname.trim() })
      .eq("id", userId);

    if (nickError) { setError("保存に失敗しました"); setLoading(false); return; }

    // Replace oshi
    await supabase.from("user_oshi").delete().eq("user_id", userId);
    if (oshiIds.length > 0) {
      await supabase.from("user_oshi").insert(
        oshiIds.map((artist_id) => ({ user_id: userId, artist_id }))
      );
    }

    router.push(`/profile/${userId}`);
    router.refresh();
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-base font-bold mb-4">プロフィールを編集</h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium block mb-1">ニックネーム</label>
          <input
            type="text"
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
            style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">推しを選択</label>
          <input
            type="text"
            placeholder="アーティスト名で検索..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)] mb-2"
            style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
          />
          <div
            className="border rounded-lg max-h-64 overflow-y-auto"
            style={{ borderColor: "var(--ff-border)" }}
          >
            {agencies.map((agency) => {
              const agencyArtists = filtered.filter(
                (a) => (a.agency ?? "その他") === agency
              );
              if (agencyArtists.length === 0) return null;
              return (
                <div key={agency}>
                  <div
                    className="px-3 py-1.5 text-xs font-medium"
                    style={{ background: "var(--ff-border)", color: "var(--ff-muted)" }}
                  >
                    {agency}
                  </div>
                  {agencyArtists.map((a) => (
                    <label
                      key={a.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--ff-border)]"
                    >
                      <input
                        type="checkbox"
                        checked={oshiIds.includes(a.id)}
                        onChange={() => toggleOshi(a.id)}
                        className="accent-[var(--ff-accent)]"
                      />
                      <span className="text-sm">{a.name}</span>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--ff-muted)" }}>
            {oshiIds.length}件選択中（上限なし）
          </p>
        </div>

        {error && <p className="text-sm" style={{ color: "#E53E3E" }}>{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-2.5 text-sm font-medium text-white rounded-full disabled:opacity-50"
          style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
        >
          {loading ? "保存中..." : "保存する"}
        </button>
      </div>
    </div>
  );
}
