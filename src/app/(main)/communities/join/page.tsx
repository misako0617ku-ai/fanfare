"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function JoinForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [id, setId] = useState(searchParams.get("id") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!id.trim()) { setError("コミュニティIDを入力してください"); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: community } = await supabase
      .from("communities")
      .select("id, name")
      .eq("id", id.trim())
      .single();

    if (!community) {
      setError("コミュニティが見つかりません");
      setLoading(false);
      return;
    }

    router.push(`/communities/${community.id}`);
  }

  return (
    <div className="px-4 py-8">
      <h2 className="text-base font-bold mb-2">コミュニティに参加</h2>
      <p className="text-sm mb-4" style={{ color: "var(--ff-muted)" }}>
        招待されたコミュニティのIDまたはURLを入力してください
      </p>
      <input
        type="text"
        value={id}
        onChange={(e) => setId(e.target.value)}
        placeholder="コミュニティID"
        className="w-full px-3 py-2 text-sm border rounded-lg outline-none mb-3 focus:ring-2 focus:ring-[var(--ff-accent)]"
        style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
      />
      {error && <p className="text-sm mb-2" style={{ color: "#E53E3E" }}>{error}</p>}
      <button
        onClick={handleJoin}
        disabled={loading}
        className="w-full py-2.5 text-sm font-medium text-white rounded-full disabled:opacity-50"
        style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
      >
        {loading ? "検索中..." : "参加する"}
      </button>
    </div>
  );
}

export default function JoinPage() {
  return <Suspense><JoinForm /></Suspense>;
}
