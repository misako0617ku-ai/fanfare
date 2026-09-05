import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createUploadPresignedUrl } from "@/lib/r2";

const RATE_LIMIT: Map<string, { count: number; resetAt: number }> = new Map();
const MAX_UPLOADS_PER_HOUR = 20;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Simple in-memory rate limit (resets on cold start)
  const now = Date.now();
  const entry = RATE_LIMIT.get(user.id) ?? { count: 0, resetAt: now + 3600_000 };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + 3600_000;
  }
  if (entry.count >= MAX_UPLOADS_PER_HOUR) {
    return NextResponse.json({ error: "アップロード上限に達しました。しばらくお待ちください" }, { status: 429 });
  }
  entry.count++;
  RATE_LIMIT.set(user.id, entry);

  const { mimeType, sizeBytes } = await req.json();

  try {
    const result = await createUploadPresignedUrl(mimeType, sizeBytes);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
