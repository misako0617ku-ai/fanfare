import { createClient } from "@/lib/supabase/server";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export default async function ProfileEditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("nickname, icon_url")
    .eq("id", user!.id)
    .single();

  const { data: oshi } = await supabase
    .from("user_oshi")
    .select("artist_id")
    .eq("user_id", user!.id);

  const { data: allArtists } = await supabase
    .from("artists")
    .select("id, name, agency")
    .order("agency", { ascending: true })
    .order("name", { ascending: true });

  return (
    <ProfileEditForm
      userId={user!.id}
      initialNickname={profile?.nickname ?? ""}
      initialIconUrl={profile?.icon_url ?? null}
      initialOshiIds={(oshi ?? []).map((o) => o.artist_id)}
      allArtists={allArtists ?? []}
    />
  );
}
