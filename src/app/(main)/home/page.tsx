import { createClient } from "@/lib/supabase/server";
import HomeFeed from "@/components/post/HomeFeed";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "oshi" } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <HomeFeed userId={user!.id} activeTab={tab as "oshi" | "follow" | "discover"} />;
}
