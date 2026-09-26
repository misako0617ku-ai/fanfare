import puppeteer from "puppeteer";
import type { ScrapedEvent } from "./base";

const LIVE_KEYWORDS = /LIVE|ライブ|コンサート|公演|ツアー|TOUR|フェス|FES|チケット|TICKET|開催決定/i;

export async function scrapeEBiDAN(
  artistNameMap: Map<string, string>
): Promise<ScrapedEvent[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto("https://ebidan.jp/news/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const rawItems = await page.evaluate(() => {
      const lis = document.querySelectorAll("li.delighter");
      return Array.from(lis).map((li) => ({
        date: li.querySelector("time.date")?.getAttribute("datetime") ?? "",
        group: li.querySelector(".tag-group")?.textContent?.trim() ?? "",
        title: (li.querySelector(".tit")?.textContent ?? "").replace(/\s+/g, " ").trim(),
        href: li.querySelector("a")?.getAttribute("href") ?? "",
      }));
    });

    const events: ScrapedEvent[] = [];

    for (const item of rawItems) {
      if (!item.date || !item.group || !item.title) continue;

      const eventDate = item.date.replace(/\//g, "-");
      if (eventDate < cutoffStr) continue;
      if (!LIVE_KEYWORDS.test(item.title)) continue;

      const artistId = artistNameMap.get(item.group);
      if (!artistId) continue;

      const sourceUrl = item.href.startsWith("http")
        ? item.href
        : `https://ebidan.jp${item.href}`;

      events.push({ artistId, type: "live", eventDate, title: item.title, sourceUrl });
    }

    console.log(`[EBiDAN] ${events.length} live events from ${rawItems.length} news items`);
    return events;
  } finally {
    await browser.close();
  }
}
