import { createClient } from "@/lib/supabase/server";
import NewPostForm from "@/components/post/NewPostForm";

export default async function NewPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: oshi } = await supabase
    .from("user_oshi")
    .select("artists(id, name)")
    .eq("user_id", user!.id);

  const artists = (oshi ?? []).flatMap((o: any) => o.artists ? [o.artists] : []);

  return <NewPostForm artists={artists} />;
}
