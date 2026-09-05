// Tier 1: NGワード完全一致判定
// DBからキャッシュして使う。Edgeでも使えるように純粋関数として分離。

let cachedWords: Set<string> | null = null;
let lastFetched = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5分

export async function loadNgWords(
  fetchFn: () => Promise<string[]>
): Promise<Set<string>> {
  const now = Date.now();
  if (cachedWords && now - lastFetched < CACHE_TTL_MS) return cachedWords;
  const words = await fetchFn();
  cachedWords = new Set(words);
  lastFetched = now;
  return cachedWords;
}

export function checkTier1(text: string, ngWords: Set<string>): string | null {
  for (const word of ngWords) {
    if (text.includes(word)) return word;
  }
  return null;
}
