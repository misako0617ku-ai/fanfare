import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ScrapedEvent {
  artistId: string;
  type: "live" | "tv" | "release" | "other";
  eventDate: string; // YYYY-MM-DD
  title: string;
  sourceUrl?: string;
}

export type ParseFn = (html: string) => ScrapedEvent[];

const USER_AGENT = "FANFAREBot/1.0 (contact: misako0617ku@gmail.com)";
const INTER_SITE_DELAY_MS = 4000;

export async function scrapeTarget(siteKey: string, url: string, parse: ParseFn): Promise<void> {
  const { data: target } = await supabase
    .from("scrape_targets")
    .select("last_etag, last_content_hash, consecutive_failures")
    .eq("site_name", siteKey)
    .single();

  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "text/html",
  };
  if (target?.last_etag) headers["If-None-Match"] = target.last_etag;

  let response: Response;
  try {
    response = await fetch(url, { headers });
  } catch (err) {
    console.error(`[${siteKey}] fetch error:`, err);
    await recordFailure(siteKey, target?.consecutive_failures ?? 0);
    return;
  }

  // Tier 1: 304 Not Modified
  if (response.status === 304) {
    console.log(`[${siteKey}] not modified (304)`);
    return;
  }

  if (response.status === 403 || response.status === 429) {
    console.warn(`[${siteKey}] blocked (${response.status}) — disabling target`);
    await supabase
      .from("scrape_targets")
      .update({ is_enabled: false })
      .eq("site_name", siteKey);
    return;
  }

  if (!response.ok) {
    await recordFailure(siteKey, target?.consecutive_failures ?? 0);
    return;
  }

  const html = await response.text();

  // Tier 2: content hash
  const hash = crypto.createHash("sha256").update(html).digest("hex");
  if (hash === target?.last_content_hash) {
    console.log(`[${siteKey}] content unchanged`);
    return;
  }

  const events = parse(html);
  console.log(`[${siteKey}] parsed ${events.length} events`);

  // Upsert events
  for (const ev of events) {
    await supabase.from("events").upsert(
      {
        artist_id: ev.artistId,
        type: ev.type,
        event_date: ev.eventDate,
        title: ev.title,
        source_url: ev.sourceUrl ?? null,
        source: "scrape",
        status: "published",
      },
      { onConflict: "artist_id,event_date,title" }
    );
  }

  const newEtag = response.headers.get("etag");
  await supabase.from("scrape_targets").update({
    last_etag: newEtag,
    last_content_hash: hash,
    last_success_at: new Date().toISOString(),
    consecutive_failures: 0,
  }).eq("site_name", siteKey);
}

async function recordFailure(siteKey: string, previous: number): Promise<void> {
  const next = previous + 1;
  await supabase
    .from("scrape_targets")
    .update({ consecutive_failures: next })
    .eq("site_name", siteKey);
  if (next >= 5) {
    console.error(`[${siteKey}] 5 consecutive failures — disabling`);
    await supabase
      .from("scrape_targets")
      .update({ is_enabled: false })
      .eq("site_name", siteKey);
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { INTER_SITE_DELAY_MS };
