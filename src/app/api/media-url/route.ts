import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createViewPresignedUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { keys } = await req.json() as { keys: string[] };
  if (!Array.isArray(keys) || keys.length === 0) {
    return NextResponse.json({ urls: {} });
  }

  const urls: Record<string, string> = {};
  await Promise.all(
    keys.map(async (key) => {
      urls[key] = await createViewPresignedUrl(key);
    })
  );

  return NextResponse.json({ urls });
}
