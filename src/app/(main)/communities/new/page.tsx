import { createClient } from "@/lib/supabase/server";
import CreateCommunityForm from "@/components/community/CreateCommunityForm";

export default async function NewCommunityPage() {
  const supabase = await createClient();
  const { data: artists } = await supabase
    .from("artists")
    .select("id, name, agency")
    .order("name");

  return <CreateCommunityForm artists={artists ?? []} />;
}
