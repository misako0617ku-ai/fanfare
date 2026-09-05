import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: communities } = await supabase
    .from("communities")
    .select("*, artists(name), community_members(count)")
    .order("created_at", { ascending: false });

  const { data: joined } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", user!.id);

  const joinedIds = new Set((joined ?? []).map((j) => j.community_id));

  return (
    <div>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--ff-border)" }}>
        <h1 className="text-base font-bold">コミュニティ</h1>
        <Link
          href="/communities/join"
          className="text-sm px-3 py-1.5 rounded-full"
          style={{ color: "var(--ff-muted)", border: "1px solid var(--ff-border)" }}
        >
          IDで参加
        </Link>
      </div>

      {(!communities || communities.length === 0) ? (
        <div className="flex flex-col items-center py-24 gap-4 text-center">
          <p className="text-sm" style={{ color: "var(--ff-muted)" }}>
            最初のコミュニティを作りませんか
          </p>
          <Link
            href="/communities/new"
            className="px-5 py-2 text-sm font-medium text-white rounded-full"
            style={{ background: "var(--ff-accent)" }}
          >
            コミュニティを作成する
          </Link>
        </div>
      ) : (
        <div>
          {(communities ?? []).map((c: any) => (
            <Link
              key={c.id}
              href={`/communities/${c.id}`}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid var(--ff-border)" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
              >
                {c.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  {joinedIds.has(c.id) && (
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--ff-border)", color: "var(--ff-muted)" }}>
                      参加中
                    </span>
                  )}
                </div>
                {c.artists && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--ff-muted)" }}>
                    {c.artists.name}
                  </p>
                )}
                {c.description && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--ff-muted)" }}>
                    {c.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
