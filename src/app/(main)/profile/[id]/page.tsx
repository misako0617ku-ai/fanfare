import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ProfileView from "@/components/profile/ProfileView";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("id, nickname, icon_url, created_at")
    .eq("id", id)
    .single();

  if (!profile) notFound();

  const { data: oshi } = await supabase
    .from("user_oshi")
    .select("artists(id, name)")
    .eq("user_id", id);

  const { data: posts } = await supabase
    .from("posts")
    .select("*, post_artists(artists(id, name)), post_stamps(stamp_id, user_id)")
    .eq("user_id", id)
    .eq("status", "published")
    .eq("scope", "home")
    .order("created_at", { ascending: false })
    .limit(20);

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("followee_id", id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", id);

  let isFollowing = false;
  if (currentUser && currentUser.id !== id) {
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUser.id)
      .eq("followee_id", id)
      .single();
    isFollowing = !!data;
  }

  const artists = (oshi ?? []).flatMap((o: any) => o.artists ? [o.artists] : []);
  const postsWithCounts = (posts ?? []).map((p: any) => {
    const stamps: Record<string, number> = {};
    // profileページはuser情報をprofileから補完する
    const myStamps: string[] = [];
    for (const ps of p.post_stamps ?? []) {
      stamps[ps.stamp_id] = (stamps[ps.stamp_id] ?? 0) + 1;
      if (currentUser && ps.user_id === currentUser.id) myStamps.push(ps.stamp_id);
    }
    return { ...p, users: profile, stamp_counts: stamps, my_stamps: myStamps };
  });

  return (
    <ProfileView
      profile={profile}
      oshiArtists={artists}
      posts={postsWithCounts}
      followerCount={followerCount ?? 0}
      followingCount={followingCount ?? 0}
      isFollowing={isFollowing}
      isOwn={currentUser?.id === id}
      currentUserId={currentUser?.id ?? ""}
    />
  );
}
