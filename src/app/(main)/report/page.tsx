"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASON_CODES = [
  { code: "sexual", label: "性的な投稿" },
  { code: "attack", label: "攻撃的な言葉" },
  { code: "sexual_criticism", label: "セクシャルな内容への批判" },
  { code: "copyright", label: "著作権侵害" },
  { code: "misinformation", label: "誤情報" },
];

function ReportForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetType = searchParams.get("target_type") ?? "post";
  const targetId = searchParams.get("target_id") ?? "";

  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit() {
    if (!selectedCode || !targetId) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType as "post" | "event",
      target_id: targetId,
      reason_code: selectedCode,
    });

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-base font-medium">受け付けました。確認します。</p>
        <button
          onClick={() => router.back()}
          className="text-sm"
          style={{ color: "var(--ff-accent)" }}
        >
          戻る
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-base font-bold mb-4">通報</h2>
      <p className="text-sm mb-4" style={{ color: "var(--ff-muted)" }}>
        該当する理由を選択してください
      </p>

      <div className="flex flex-col gap-2 mb-6">
        {REASON_CODES.map((r) => (
          <button
            key={r.code}
            onClick={() => setSelectedCode(r.code)}
            className="flex items-center gap-3 px-4 py-3 text-sm border rounded-lg text-left"
            style={{
              borderColor: selectedCode === r.code ? "var(--ff-accent)" : "var(--ff-border)",
              color: "var(--ff-fg)",
            }}
          >
            <span
              className="w-4 h-4 rounded-full border-2 flex-shrink-0"
              style={{
                borderColor: selectedCode === r.code ? "var(--ff-accent)" : "var(--ff-border)",
                background: selectedCode === r.code ? "var(--ff-accent)" : "transparent",
              }}
            />
            {r.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedCode || loading}
        className="w-full py-2.5 text-sm font-medium text-white rounded-full disabled:opacity-50"
        style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
      >
        {loading ? "送信中..." : "通報する"}
      </button>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportForm />
    </Suspense>
  );
}
