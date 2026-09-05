import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
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

  const { data: memberRow } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", id)
    .eq("user_id", user!.id)
    .single();

  const isMember = !!memberRow;
  const isModOrOwner = memberRow?.role === "moderator" || (community as any).owner_id === user!.id;

  const { data: posts } = await supabase
    .from("posts")
    .select("*, users(id, nickname, icon_url), post_artists(artists(id, name)), post_stamps(stamp_id, user_id)")
    .eq("community_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);

  const { count: memberCount } = await supabase
    .from("community_members")
    .select("*", { count: "exact", head: true })
    .eq("community_id", id);

  const postsWithCounts = (posts ?? []).map((p: any) => {
    const stamps: Record<string, number> = {};
    const myStamps: string[] = [];
    for (const ps of p.post_stamps ?? []) {
      stamps[ps.stamp_id] = (stamps[ps.stamp_id] ?? 0) + 1;
      if (ps.user_id === user!.id) myStamps.push(ps.stamp_id);
    }
    return { ...p, stamp_counts: stamps, my_stamps: myStamps };
  });

  return (
    <CommunityView
      community={community as any}
      posts={postsWithCounts}
      memberCount={memberCount ?? 0}
      isMember={isMember}
      isModOrOwner={isModOrOwner}
      currentUserId={user!.id}
    />
  );
}
