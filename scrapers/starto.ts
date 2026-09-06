import * as cheerio from "cheerio";
import type { ScrapedEvent } from "./base";

let artistIdMap: Map<number, string> = new Map();

export function setArtistIdMap(map: Map<number, string>) {
  artistIdMap = map;
}

function parseDate(dateText: string): string | null {
  const match = dateText.trim().match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function parseType(tagClass: string): ScrapedEvent["type"] {
  if (tagClass.includes("--concert") || tagClass.includes("--stage")) return "live";
  if (tagClass.includes("--event")) return "other";
  if (tagClass.includes("--release")) return "release";
  return "other";
}

function isUpcoming(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr >= today;
}

export function parseStartoLivePage(html: string): ScrapedEvent[] {
  const $ = cheerio.load(html);
  const events: ScrapedEvent[] = [];

  $(".p-in_cs__list-item").each((_, el) => {
    const link = $(el).find("a.c-cs_card");
    const href = link.attr("href");
    const sourceUrl = href ? `https://starto.jp${href.split("?")[0]}` : undefined;

    const dateText = $(el).find(".c-cs_card__date .c-date").first().text().trim();
    const eventDate = parseDate(dateText);
    if (!eventDate) return;
    if (!isUpcoming(eventDate)) return;

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
