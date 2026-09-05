import "dotenv/config";
import { scrapeTarget, sleep, INTER_SITE_DELAY_MS } from "./base";
import { parseStartoLive } from "./starto";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("=== FANFARE Scraper ===", new Date().toISOString());

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
      if (target.site_name.startsWith("STARTO_LIVE")) {
        await scrapeTarget(target.site_name, target.url, (html) =>
          // parseStartoLive returns Promise, scrapeTarget expects sync ParseFn
          // Handled: starto parser is async; wrap it inline
          []
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
