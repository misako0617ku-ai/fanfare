import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export type ModerationTarget =
  | "self"
  | "oshi_positive"
  | "oshi_critical"
  | "other_user"
  | "other_fan"
  | "third_artist";

export type ModerationIntent =
  | "praise"
  | "sharing"
  | "opinion"
  | "sarcasm"
  | "attack";

export interface ModerationResult {
  verdict: "white" | "grey" | "black";
  target: ModerationTarget;
  intent: ModerationIntent;
  score: number;
  reason: string;
}

const SCHEMA = {
  type: "object",
  properties: {
    target: {
      type: "string",
      enum: ["self", "oshi_positive", "oshi_critical", "other_user", "other_fan", "third_artist"],
    },
    intent: {
      type: "string",
      enum: ["praise", "sharing", "opinion", "sarcasm", "attack"],
    },
    score: { type: "integer", minimum: 0, maximum: 100 },
    reason: { type: "string" },
  },
  required: ["target", "intent", "score", "reason"],
};

export async function runTier3(
  text: string,
  imageBase64?: string
): Promise<ModerationResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SCHEMA as any,
    },
  });

  const systemPrompt = `あなたは推し活SNS「FANFARE」のコンテンツモデレーターです。
投稿を以下の3軸で評価してください。

【対象 (target)】
- self: 自分自身について
- oshi_positive: 推し（好意的）
- oshi_critical: 推し（批判的）
- other_user: 他のユーザー
- other_fan: 他のファン層・界隈
- third_artist: 第三者のアーティスト

【意図 (intent)】
- praise: 賞賛・感情の発露
- sharing: 事実の共有
- opinion: 意見表明
- sarcasm: 揶揄・皮肉
- attack: 直接攻撃

【強度 (score)】0〜100（100が最も攻撃的）

判定ルール:
- target=self または target=oshi_positive → 表現が激しくても通す（score低め）
- target=other_user かつ intent=sarcasm以上 → score高め
- target=other_fan かつ intent=attack → score高め
- target=third_artist かつ intent=sarcasm以上 → score高め
- 推し活特有表現「尊すぎて死んだ」「しんどい（賛辞）」は praise として扱うこと

score 70以上 = black（非公開）
score 40〜69 = grey（要確認フラグ）
score 39以下 = white（通過）`;

  const parts: any[] = [
    { text: systemPrompt + "\n\n投稿テキスト:\n" + text },
  ];

  if (imageBase64) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: imageBase64 },
    });
  }

  try {
    const result = await model.generateContent(parts);
    const raw = JSON.parse(result.response.text());

    const score: number = raw.score;
    const verdict: "white" | "grey" | "black" =
      score >= 70 ? "black" : score >= 40 ? "grey" : "white";

    return {
      verdict,
      target: raw.target,
      intent: raw.intent,
      score,
      reason: raw.reason,
    };
  } catch {
    // AI判定失敗 → 体験を止めない。公開+review_flag
    return {
      verdict: "grey",
      target: "self",
      intent: "sharing",
      score: 0,
      reason: "AI判定エラー。要確認。",
    };
  }
}
