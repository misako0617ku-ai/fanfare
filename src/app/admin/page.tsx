import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/home");

  const [
    { data: reviewQueue },
    { data: reports },
    { data: ngWords },
    { data: settings },
    { data: scrapeTargets },
  ] = await Promise.all([
    supabase.from("posts").select("id, body, ai_score, ai_reason, created_at, users(nickname)").eq("review_flag", true).eq("status", "published").order("created_at", { ascending: false }).limit(20),
    supabase.from("reports").select("id, target_type, target_id, reason_code, status, created_at, users(nickname)").eq("status", "pending").order("created_at", { ascending: false }).limit(20),
    supabase.from("ng_words").select("id, word").order("word"),
    supabase.from("app_settings").select("key, value").order("key"),
    supabase.from("scrape_targets").select("id, site_name, is_enabled, last_success_at, consecutive_failures").order("site_name"),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">管理画面</h1>

      {/* Review queue */}
      <section className="mb-8">
        <h2 className="text-base font-bold mb-3">
          確認キュー ({reviewQueue?.length ?? 0}件)
        </h2>
        {(reviewQueue ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ff-muted)" }}>確認待ちの投稿はありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(reviewQueue ?? []).map((p: any) => (
              <AdminPostRow key={p.id} post={p} supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!} />
            ))}
          </div>
        )}
      </section>

      {/* Reports */}
      <section className="mb-8">
        <h2 className="text-base font-bold mb-3">
          通報 ({reports?.length ?? 0}件)
        </h2>
        {(reports ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ff-muted)" }}>未対応の通報はありません</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(reports ?? []).map((r: any) => (
              <div key={r.id} className="p-3 border rounded-lg text-sm" style={{ borderColor: "var(--ff-border)" }}>
                <p>{r.reason_code} / {r.target_type}: {r.target_id}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Settings */}
      <section className="mb-8">
        <h2 className="text-base font-bold mb-3">設定値</h2>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--ff-border)" }}>
          <table className="w-full text-sm">
            <tbody>
              {(settings ?? []).map((s) => (
                <tr key={s.key} style={{ borderBottom: "1px solid var(--ff-border)" }}>
                  <td className="px-3 py-2 font-mono text-xs" style={{ color: "var(--ff-muted)" }}>{s.key}</td>
                  <td className="px-3 py-2">{s.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-1" style={{ color: "var(--ff-muted)" }}>
          値の変更はSupabaseダッシュボードから行ってください
        </p>
      </section>

      {/* Scrape targets */}
      <section className="mb-8">
        <h2 className="text-base font-bold mb-3">スクレイプ対象</h2>
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--ff-border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--ff-border)" }}>
                <th className="px-3 py-2 text-left text-xs font-medium">サイト</th>
                <th className="px-3 py-2 text-left text-xs font-medium">状態</th>
                <th className="px-3 py-2 text-left text-xs font-medium">最終成功</th>
                <th className="px-3 py-2 text-left text-xs font-medium">連続失敗</th>
              </tr>
            </thead>
            <tbody>
              {(scrapeTargets ?? []).map((t: any) => (
                <tr key={t.id} style={{ borderTop: "1px solid var(--ff-border)" }}>
                  <td className="px-3 py-2">{t.site_name}</td>
                  <td className="px-3 py-2">
                    <span style={{ color: t.is_enabled ? "green" : "var(--ff-muted)" }}>
                      {t.is_enabled ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs" style={{ color: "var(--ff-muted)" }}>
                    {t.last_success_at ? new Date(t.last_success_at).toLocaleDateString("ja-JP") : "−"}
                  </td>
                  <td className="px-3 py-2">
                    <span style={{ color: t.consecutive_failures > 2 ? "#E53E3E" : "var(--ff-fg)" }}>
                      {t.consecutive_failures}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* NG words */}
      <section>
        <h2 className="text-base font-bold mb-3">NGワード ({ngWords?.length ?? 0}語)</h2>
        <div className="flex flex-wrap gap-1.5">
          {(ngWords ?? []).map((w) => (
            <span key={w.id} className="px-2 py-0.5 text-xs rounded" style={{ background: "var(--ff-border)" }}>
              {w.word}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function AdminPostRow({ post }: { post: any; supabaseUrl: string }) {
  return (
    <div className="p-3 border rounded-lg text-sm" style={{ borderColor: "#FFC24B" }}>
      <div className="flex justify-between items-start mb-1">
        <span className="font-medium">{post.users?.nickname ?? "−"}</span>
        <span className="text-xs" style={{ color: "var(--ff-muted)" }}>
          スコア: {post.ai_score ?? "−"}
        </span>
      </div>
      <p className="text-sm" style={{ color: "var(--ff-fg)" }}>{post.body}</p>
      {post.ai_reason && (
        <p className="text-xs mt-1" style={{ color: "var(--ff-muted)" }}>{post.ai_reason}</p>
      )}
    </div>
  );
}
