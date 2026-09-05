import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkTier1, loadNgWords } from "@/lib/moderation/tier1";
import { checkTier2 } from "@/lib/moderation/tier2";
import { runTier3 } from "@/lib/moderation/tier3";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    console.log("[posts] 1: client created");

    const { data: { user } } = await supabase.auth.getUser();
    console.log("[posts] 2: user =", user?.id ?? "null");
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body_json = await req.json();
    const { body, artistIds, mediaKeys, communityId } = body_json;
    console.log("[posts] 3: body =", body?.slice(0, 30));

    if (!body || typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ error: "本文を入力してください" }, { status: 400 });
    }
    if (body.length > 500) {
      return NextResponse.json({ error: "500文字以内で入力してください" }, { status: 400 });
    }

    // --- Tier 1: NGワード ---
    const ngWords = await loadNgWords(async () => {
      const { data } = await supabase.from("ng_words").select("word");
      return (data ?? []).map((r: any) => r.word);
    });
    const hit = checkTier1(body, ngWords);
    console.log("[posts] 4: tier1 hit =", hit);
    if (hit) {
      return NextResponse.json({ error: "投稿に使用できない言葉が含まれています" }, { status: 422 });
    }

    // --- Tier 2 → Tier 3 ---
    let status: "published" | "hidden" | "under_review" = "published";
    let reviewFlag = false;
    let aiScore: number | null = null;
    let aiReason: string | null = null;

    const tier2 = checkTier2(body);
    console.log("[posts] 5: tier2 =", tier2);

    if (tier2) {
      console.log("[posts] 5a: calling tier3...");
      const result = await runTier3(body);
      console.log("[posts] 5b: tier3 result =", result.verdict, result.score);
      aiScore = result.score;
      aiReason = result.reason;
      if (result.verdict === "black") status = "hidden";
      else if (result.verdict === "grey") reviewFlag = true;
    }

    // --- Save post ---
    const scope = communityId ? "community" : "home";
    console.log("[posts] 6: inserting post...");
    const { data: post, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        body: body.trim(),
        scope,
        community_id: communityId ?? null,
        status,
        review_flag: reviewFlag,
        ai_score: aiScore,
        ai_reason: aiReason,
      })
      .select()
      .single();

    console.log("[posts] 7: insert result error =", JSON.stringify(error), "post =", post?.id);

    if (error || !post) {
      return NextResponse.json({ error: "投稿に失敗しました" }, { status: 500 });
    }

    // --- Artist associations ---
    if (Array.isArray(artistIds) && artistIds.length > 0) {
      await supabase.from("post_artists").insert(
        artistIds.map((artistId: string) => ({ post_id: post.id, artist_id: artistId }))
      );
    }

    // --- Media associations ---
    if (Array.isArray(mediaKeys) && mediaKeys.length > 0) {
      await supabase.from("post_media").insert(
        mediaKeys.map((item: { key: string; type: "image" | "video" }, i: number) => ({
          post_id: post.id,
          r2_key: item.key,
          type: item.type,
          order: i,
        }))
      );
    }

    if (status === "hidden") {
      return NextResponse.json({ error: "投稿できませんでした。内容を確認してください" }, { status: 422 });
    }

    return NextResponse.json({ post });
  } catch (e: any) {
    console.error("[posts] UNCAUGHT ERROR:", e?.message, e?.stack);
    return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
