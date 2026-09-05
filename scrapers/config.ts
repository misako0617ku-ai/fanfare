export interface ScrapeTarget {
  siteKey: string;
  url: string;
  enabled: boolean;
}

export const TARGETS: ScrapeTarget[] = [
  { siteKey: "STARTO_NEWS",        url: "https://starto.jp/s/p/news/list",           enabled: true  },
  { siteKey: "STARTO_LIVE",        url: "https://starto.jp/s/p/live",                enabled: true  },
  { siteKey: "STARTO_DISCOGRAPHY", url: "https://starto.jp/s/p/search/discography",  enabled: true  },
  { siteKey: "BMSG",               url: "https://bmsg.tokyo",                        enabled: false },
];

export const STARTO_ARTIST_IDS: Record<number, string> = {
  // starto_artist_id → artist name (used to match DB records)
  12: "NEWS", 13: "SUPER EIGHT", 15: "Hey! Say! JUMP",
  17: "Kis-My-Ft2", 24: "timelesz", 26: "A.B.C-Z",
  29: "WEST.", 41: "King & Prince", 42: "SixTONES",
  43: "Snow Man", 56: "なにわ男子", 57: "20th Century",
  60: "Travis Japan", 157: "Aぇ! group",
};
