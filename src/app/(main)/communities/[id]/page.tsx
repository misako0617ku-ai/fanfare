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
