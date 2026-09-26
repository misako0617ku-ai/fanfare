import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { scrapeTarget, sleep, INTER_SITE_DELAY_MS } from "./base";
import { parseStartoLivePage, setArtistIdMap } from "./starto";
import { parseBEFirstNewsPage, parseMazzelNewsPage } from "./bmsg";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function loadArtistIdMap(): Promise<Map<number, string>> {
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

async function loadArtistIdByName(name: string): Promise<string | null> {
  const { data } = await supabase
    .from("artists")
    .select("id")
    .eq("name", name)
    .single();
  return data?.id ?? null;
}

async function main() {
  console.log("=== FANFARE Scraper ===", new Date().toISOString());

  const artistMap = await loadArtistIdMap();
  console.log(`Loaded ${artistMap.size} STARTO artists`);
  setArtistIdMap(artistMap);

  const beFirstId = await loadArtistIdByName("BE:FIRST");
  const mazzelId = await loadArtistIdByName("MAZZEL");

  const { data: targets } = await supabase
    .from("scrape_targets")
    .select("site_name, url, is_enabled")
    .eq("is_enabled", true);

  if (!targets || targets.length === 0) {
    console.log("No enabled targets");
    return;
  }

  for (const target of targets) {
    console.log(`\n--- ${target.site_name} ---`);
    try {
      if (target.site_name === "STARTO_LIVE") {
        await scrapeTarget(target.site_name, target.url, parseStartoLivePage);
      } else if (target.site_name === "BEFIRST_NEWS" && beFirstId) {
        await scrapeTarget(target.site_name, target.url, (html) =>
          parseBEFirstNewsPage(html, beFirstId)
        );
      } else if (target.site_name === "MAZZEL_NEWS" && mazzelId) {
        await scrapeTarget(target.site_name, target.url, (html) =>
          parseMazzelNewsPage(html, mazzelId)
        );
      } else {
        console.log(`[${target.site_name}] no parser implemented yet`);
      }
    } catch (err) {
      console.error(`[${target.site_name}] unexpected error:`, err);
    }
    await sleep(INTER_SITE_DELAY_MS);
  }

  console.log("\n=== Done ===");
}

main().catch(console.error);
