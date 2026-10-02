import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import CommunityView from "@/components/community/CommunityView";

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: community } = await supabase
    .from("communities")
    .select("*, artists(id, name), users!communities_owner_id_fkey(nickname)")
    .eq("id", id)
    .single();

  if (!community) notFound();

  // 推しゲート：コミュニティにアーティストが紐づいている場合、推しに入っているか確認
  if (community.artists?.id && user) {
    const { data: oshiRow } = await supabase
      .from("user_oshi")
      .select("artist_id")
      .eq("user_id", user.id)
      .eq("artist_id", (community as any).artists.id)
      .single();

    if (!oshiRow) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
          <div className="text-4xl">🔒</div>
          <h2 className="text-lg font-bold" style={{ color: "var(--ff-fg)" }}>
            {(community as any).artists.name}の推しのみ入れるコミュニティです
          </h2>
          <p className="text-sm" style={{ color: "var(--ff-muted)" }}>
            プロフィールで推しに追加すると入れるようになります
          </p>
          <Link
            href="/profile/edit"
            className="px-4 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "var(--ff-accent)" }}
          >
            推しを追加する
          </Link>
        </div>
      );
    }
  }

  const { data: memberRow } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", id)
    .eq("user_id", user!.id)
    .single();

  const isMember = !!memberRow;
  const isModOrOwner = memberRow?.role === "moderator" || (community as any).owner_id === user!.id;

  const { count: memberCount } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", id);

  return (
    <CommunityView
      community={community as any}
      memberCount={memberCount ?? 0}
      isMember={isMember}
      isModOrOwner={isModOrOwner}
      currentUserId={user!.id}
    />
  );
}
