import puppeteer, { type Browser } from "puppeteer";
import type { ScrapedEvent } from "./base";

const LIVE_KEYWORDS = /LIVE|ライブ|コンサート|公演|ツアー|TOUR|フェス|FES|TICKET|チケット|開催決定|WORLD TOUR|DOME|ARENA|STADIUM/i;

function normalizeDate(text: string): string {
  // 2026.09.25 or 2026/09/25 → 2026-09-25
  return text.trim().replace(/[\/\.]/g, "-");
}

// HYBE Japan sites (ENHYPEN, TWS, BOYNEXTDOOR) — format: "YYYY.MM.DD | EVENT & LIVE NEW title"
async function scrapeHYBEJapan(
  browser: Browser,
  url: string,
  artistId: string
): Promise<ScrapedEvent[]> {
  const page = await browser.newPage();
  const events: ScrapedEvent[] = [];

  try {
    await page.setUserAgent("Mozilla/5.0 Chrome/120.0.0.0");
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const items = await page.evaluate(() => {
      const dateRegex = /202\d[\/\.]\d{2}[\/\.]\d{2}/;
      const results: { dateText: string; parentText: string; href: string }[] = [];

      document.querySelectorAll("*").forEach((el) => {
        if (el.children.length > 0) return;
        const text = el.textContent?.trim() ?? "";
        if (dateRegex.test(text) && text.length < 25) {
          const parent =
            el.closest("li, article, a") ??
            el.parentElement?.parentElement ?? null;
          if (!parent) return;
          results.push({
            dateText: text,
            parentText: parent.textContent?.trim().replace(/\s+/g, " ") ?? "",
            href:
              (parent.tagName === "A"
                ? (parent as HTMLAnchorElement).href
                : parent.querySelector("a")?.href) ?? "",
          });
        }
      });
      return results;
    });

    for (const item of items) {
      if (!item.dateText) continue;
      const eventDate = normalizeDate(item.dateText);
      if (eventDate < cutoffStr) continue;

      const isLiveCategory = /EVENT\s*&\s*LIVE/i.test(item.parentText);
      if (!isLiveCategory && !LIVE_KEYWORDS.test(item.parentText)) continue;

      const title = item.parentText
        .replace(/\[?\s*EVENT\s*&\s*LIVE\s*\]?/gi, "")
        .replace(/202\d[\/\.]\d{2}[\/\.]\d{2}/, "")
        .replace(/\|\s*/, "")
        .replace(/\bNEW\b/, "")
        .trim();

      if (title.length < 4) continue;
      events.push({
        artistId,
        type: "live",
        eventDate,
        title,
        sourceUrl: item.href || undefined,
      });
    }
  } finally {
    await page.close();
  }

  return events;
}

// TWICE Japan (twicejapan.com/news/) — format: "YYYY.MM.DD | CATEGORY title"
async function scrapeTwice(
  browser: Browser,
  artistId: string
): Promise<ScrapedEvent[]> {
  const page = await browser.newPage();
  const events: ScrapedEvent[] = [];

  try {
    await page.setUserAgent("Mozilla/5.0 Chrome/120.0.0.0");
    await page.goto("https://www.twicejapan.com/news/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const items = await page.evaluate(() => {
      const results: { date: string; parentText: string; href: string }[] = [];
      document.querySelectorAll("p.date").forEach((el) => {
        const date = el.textContent?.trim() ?? "";
        const li = el.closest("li, article") ?? el.parentElement;
        results.push({
          date,
          parentText: li?.textContent?.trim().replace(/\s+/g, " ") ?? "",
          href: li?.querySelector("a")?.href ?? "",
        });
      });
      return results;
    });

    for (const item of items) {
      if (!item.date) continue;
      const eventDate = normalizeDate(item.date);
      if (eventDate < cutoffStr) continue;

      const title = item.parentText.replace(item.date, "").trim();
      if (!LIVE_KEYWORDS.test(title)) continue;

      events.push({
        artistId,
        type: "live",
        eventDate,
        title,
        sourceUrl: item.href || undefined,
      });
    }
  } finally {
    await page.close();
  }

  return events;
}

export interface KpopTarget {
  siteName: string;
  url: string;
  artistId: string;
  type: "hybe-jp" | "twice";
}

export async function scrapeKpop(targets: KpopTarget[]): Promise<ScrapedEvent[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const allEvents: ScrapedEvent[] = [];

  try {
    for (const target of targets) {
      try {
        let events: ScrapedEvent[] = [];
        if (target.type === "hybe-jp") {
          events = await scrapeHYBEJapan(browser, target.url, target.artistId);
        } else if (target.type === "twice") {
          events = await scrapeTwice(browser, target.artistId);
        }
        console.log(`[${target.siteName}] ${events.length} live events`);
        allEvents.push(...events);
      } catch (err) {
        console.error(`[${target.siteName}] error:`, err);
      }
    }
  } finally {
    await browser.close();
  }

  return allEvents;
}
