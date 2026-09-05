import * as cheerio from "cheerio";
import type { ScrapedEvent, ParseFn } from "./base";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getArtistIdMap(): Promise<Map<number, string>> {
  const { data } = await supabase
    .from("artists")
    .select("id, starto_artist_id")
    .not("starto_artist_id", "is", null);
  const map = new Map<number, string>();
  for (const row of data ?? []) {
    map.set(row.starto_artist_id!, row.id);
  }
  return map;
}

export async function parseStartoLive(html: string): Promise<ScrapedEvent[]> {
  const artistMap = await getArtistIdMap();
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $(".p-schedule-list__item, [class*='schedule'], [class*='live']").each((_, el) => {
    const dateText = $(el).find("[class*='date'], time").first().text().trim();
    const title = $(el).find("[class*='title'], h3, h4").first().text().trim();
    const href = $(el).find("a").first().attr("href");

    if (!dateText || !title) return;

    const dateMatch = dateText.match(/(\d{4})[.\-年](\d{1,2})[.\-月](\d{1,2})/);
    if (!dateMatch) return;

    const eventDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;

    // Extract artist ID from URL or data attributes
    const artistIdAttr = $(el).attr("data-artist-id") ?? href?.match(/artist[_-]?id[=\/](\d+)/)?.[1];
    const startoId = artistIdAttr ? parseInt(artistIdAttr) : null;
    const artistId = startoId ? artistMap.get(startoId) : null;

    if (!artistId) return;

    events.push({
      artistId,
      type: "live",
      eventDate,
      title,
      sourceUrl: href ? `https://starto.jp${href}` : undefined,
    });
  });

  return events;
}
