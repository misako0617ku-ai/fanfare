import * as cheerio from "cheerio";
import type { ScrapedEvent } from "./base";

let artistIdMap: Map<number, string> = new Map();

export function setArtistIdMap(map: Map<number, string>) {
  artistIdMap = map;
}

function parseAllDates(dateText: string): string[] {
  return [...dateText.trim().matchAll(/(\d{4})\.(\d{2})\.(\d{2})/g)].map(
    (m) => `${m[1]}-${m[2]}-${m[3]}`
  );
}

function parseType(tagClass: string): ScrapedEvent["type"] {
  if (tagClass.includes("--concert") || tagClass.includes("--stage")) return "live";
  if (tagClass.includes("--event")) return "other";
  if (tagClass.includes("--release")) return "release";
  return "other";
}

export function parseStartoLivePage(html: string): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split("T")[0];

  $(".p-in_cs__list-item").each((_, el) => {
    const link = $(el).find("a.c-cs_card");
    const href = link.attr("href");
    const sourceUrl = href ? `https://starto.jp${href.split("?")[0]}` : undefined;

    const dateText = $(el).find(".c-cs_card__date .c-date").first().text().trim();
    const dates = parseAllDates(dateText);
    if (dates.length === 0) return;

    const eventDate = dates[0];
    const endDate = dates[dates.length - 1];
    if (endDate < today) return;

    const title = $(el).find(".c-ttl-2").first().text().trim();
    if (!title) return;

    const tagClass = $(el).find(".c-tag").attr("class") ?? "";
    const type = parseType(tagClass);

    $(el).find(".c-cast__item[data-code]").each((_, cast) => {
      const startoId = parseInt($(cast).attr("data-code") ?? "0");
      const artistId = artistIdMap.get(startoId);
      if (!artistId) return;

      events.push({ artistId, type, eventDate, title, sourceUrl });
    });
  });

  console.log(`[starto] parsed ${events.length} upcoming events`);
  return events;
}

// NEWS list page parser — matches artist by name in title
// Targets: RELEASE, STAGE, EVENT categories
const NEWS_TARGET_TAGS = ["--release", "--stage", "--event", "--concert"];

export function parseStartoNewsPage(
  html: string,
  artistNameMap: Map<string, string>
): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split("T")[0];
  const currentYear = new Date().getFullYear();
  const nowMonth = new Date().getMonth() + 1;

  $(".p-in_news__list-item, li.p-in_news__list-item, .p-in_news li").each((_, el) => {
    const tagClass = $(el).find(".c-tag").attr("class") ?? "";
    if (!NEWS_TARGET_TAGS.some((t) => tagClass.includes(t))) return;

    const title = $(el).find(".c-ttl-2").first().text().trim();
    if (!title) return;

    // タイトルから実際のイベント日付を抽出
    let eventDate: string | null = null;

    // パターン1: YYYY年MM月DD日
    const fullMatch = title.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (fullMatch) {
      eventDate = `${fullMatch[1]}-${fullMatch[2].padStart(2,"0")}-${fullMatch[3].padStart(2,"0")}`;
    }

    // パターン2: MM月DD日（年を推定）
    if (!eventDate) {
      const monthDayMatch = title.match(/(\d{1,2})月(\d{1,2})日/);
      if (monthDayMatch) {
        const m = parseInt(monthDayMatch[1]);
        const d = parseInt(monthDayMatch[2]);
        // 現在月より2ヶ月以上前の月 → 翌年
        const year = m < nowMonth - 1 ? currentYear + 1 : currentYear;
        eventDate = `${year}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      }
    }

    // 日付が抽出できない or 過去のイベント → スキップ
    if (!eventDate || eventDate < today) return;

    // source_url: external link or starto.jp internal
    const href = $(el).find("a").first().attr("href") ?? "";
    const sourceUrl = href.startsWith("http")
      ? href
      : href.startsWith("/")
      ? `https://starto.jp${href}`
      : undefined;

    // Match artist by name appearing in title
    for (const [artistName, artistId] of artistNameMap) {
      if (title.includes(artistName)) {
        const type = tagClass.includes("--release") ? "release" : "live";
        events.push({ artistId, type, eventDate, title, sourceUrl });
        break;
      }
    }
  });

  console.log(`[starto-news] parsed ${events.length} news events`);
  return events;
}
