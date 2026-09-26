import * as cheerio from "cheerio";
import type { ScrapedEvent } from "./base";

function parseDate(text: string): string | null {
  const m = text.match(/(\d{4})[./年](\d{1,2})[./月](\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

// befirst.tokyo/news/ — structure:
//   <li class="p-news_list_item">
//     <time datetime="YYYY-MM-DD">
//     <span class="p-news_list_item_link_category">Live</span>
//     <span class="p-news_list_item_link_title_text">YYYY/MM/DD(曜) タイトル</span>
export function parseBEFirstNewsPage(html: string, artistId: string): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split("T")[0];

  $(".p-news_list_item").each((_, el) => {
    const category = $(el).find(".p-news_list_item_link_category").text().trim();
    if (category !== "Live") return;

    const titleText = $(el).find(".p-news_list_item_link_title_text").text().trim();
    const href = $(el).find("a").attr("href");

    const eventDate = parseDate(titleText);
    if (!eventDate || eventDate < today) return;

    const title = titleText
      .replace(/^\d{4}[./]\d{1,2}[./]\d{1,2}[（(][土日月火水木金][）)]\s*/, "")
      .replace(/^\d{4}[./]\d{1,2}[./]\d{1,2}\s*/, "")
      .trim();
    if (!title) return;

    events.push({ artistId, type: "live", eventDate, title, sourceUrl: href });
  });

  console.log(`[BEFIRST] parsed ${events.length} upcoming live events`);
  return events;
}

// mazzel.tokyo/news/ — structure:
//   <li class="entry">
//     <time class="date">YYYY.MM.DD</time>
//     <p class="entry-text">YYYY.MM.DD Category タイトル</p>
export function parseMazzelNewsPage(html: string, artistId: string): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];
  const today = new Date().toISOString().split("T")[0];

  $("li.entry").each((_, el) => {
    const entryText = $(el).find(".entry-text").text().trim();
    const href = $(el).find("a.entry-content").attr("href");

    // Format: "YYYY.MM.DD Category タイトル..."
    const m = entryText.match(/^(\d{4}[./]\d{1,2}[./]\d{1,2})\s+(\S+)\s+([\s\S]+)/);
    if (!m) return;

    const [, rawDate, category, title] = m;
    if (category !== "Live") return;

    const eventDate = parseDate(rawDate);
    if (!eventDate || eventDate < today) return;

    events.push({ artistId, type: "live", eventDate, title: title.trim(), sourceUrl: href });
  });

  console.log(`[MAZZEL] parsed ${events.length} upcoming live events`);
  return events;
}
