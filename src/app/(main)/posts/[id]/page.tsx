import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PostCard from "@/components/post/PostCard";
import Link from "next/link";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from("posts")
    .select("*, users(id, nickname, icon_url), post_artists(artists(id, name)), post_media(id, type, r2_key, order), post_stamps(stamp_id, user_id)")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!post) notFound();

  const stamps: Record<string, number> = {};
  const myStamps: string[] = [];
  for (const ps of (post as any).post_stamps ?? []) {
    stamps[ps.stamp_id] = (stamps[ps.stamp_id] ?? 0) + 1;
    if (user && ps.user_id === user.id) myStamps.push(ps.stamp_id);
  }

  const postWithCounts = { ...(post as object), stamp_counts: stamps, my_stamps: myStamps };

  return (
    <div>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--ff-border)" }}>
        <Link href="/home" className="text-sm" style={{ color: "var(--ff-muted)" }}>
          ← 戻る
        </Link>
      </div>
      <PostCard
        post={postWithCounts as any}
        currentUserId={user?.id ?? ""}
        onStampToggle={() => {}}
      />
    </div>
  );
}
