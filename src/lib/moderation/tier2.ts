// Tier 2: AND方式フィルタ
// 全3条件が成立した場合のみTier3へ振り分け

// A: 両義語（推し活では賛辞になりうる語）
const AMBIGUOUS = /死|無理|やばい|しんどい|キツい|つらい|終わった|怖い|ヤバい/u;

// B: 攻撃対象を示す語
const TARGET_INDICATORS =
  /お前|こいつ|あいつ|そいつ|あなた|てめえ|貴様|のファン|のオタク|信者|ガチ勢|にわか/u;

// C: ポジティブ文脈語（あれば攻撃文脈を打ち消す）
const POSITIVE_CONTEXT =
  /尊い|好き|最高|かわいい|かっこいい|天才|神|推し|ファン|💗|♡|！！|！？|笑|www|ww/u;

export function checkTier2(text: string): boolean {
  const hasAmbiguous = AMBIGUOUS.test(text);
  const hasTarget = TARGET_INDICATORS.test(text);
  const hasPositive = POSITIVE_CONTEXT.test(text);

  // 3条件ANDで判定。ポジティブ文脈があれば通す。
  return hasAmbiguous && hasTarget && !hasPositive;
}
