# FANFAREコード解説ドキュメント

> このドキュメントはFANFAREのコードを教材として、プログラミングの基礎概念を学ぶためのものです。
> 非エンジニア向けに、できるだけ日常語で説明しています。

---

## 目次

1. [FANFAREの全体像](#1-fanfareの全体像)
2. [フォルダ構成と役割](#2-フォルダ構成と役割)
3. [データの旅：投稿が画面に出るまで](#3-データの旅投稿が画面に出るまで)
4. [オブジェクト指向とは何か](#4-オブジェクト指向とは何か)
5. [FANFAREで使われている主なパターン](#5-fanfareで使われている主なパターン)
6. [コードを読む練習](#6-コードを読む練習)
7. [よく出てくる言葉集](#7-よく出てくる言葉集)

---

## 1. FANFAREの全体像

### どんな技術で動いているか

FANFAREは複数のサービスが連携して動いています。レストランに例えると：

```
ユーザー（お客さん）
    ↓ ブラウザでアクセス
Next.js（ホールスタッフ）← 画面を作って渡す役
    ↓ データが必要なとき
Supabase（倉庫＋鍵番）← データの保存と認証
    ↓ 画像・動画が必要なとき
Cloudflare R2（写真倉庫）← メディアファイルの保管
    ↓ 投稿の内容チェック
Gemini API（審査員）← AIによるモデレーション
```

### 技術スタックの説明

| 技術 | 役割 | 日常語で言うと |
|---|---|---|
| **Next.js** | フレームワーク | アプリ全体の骨格 |
| **TypeScript** | プログラミング言語 | JavaScriptに「型」という安全装置をつけたもの |
| **Tailwind CSS** | スタイル | 見た目を整えるデザインツール |
| **Supabase** | データベース＋認証 | データの保管場所＋ログイン管理 |
| **Cloudflare R2** | ファイル保管 | 画像・動画の倉庫 |
| **Gemini API** | AI判定 | Googleが作ったAIへの問い合わせ |

---

## 2. フォルダ構成と役割

```
fanfare/
├── src/
│   ├── app/              ← 「ページ」の定義
│   │   ├── (auth)/       ← ログイン・登録ページ
│   │   ├── (main)/       ← ログイン後のページ
│   │   │   ├── home/     ← ホームページ
│   │   │   ├── post/     ← 投稿作成ページ
│   │   │   ├── profile/  ← プロフィールページ
│   │   │   └── communities/ ← コミュニティページ
│   │   ├── admin/        ← 管理画面
│   │   └── api/          ← サーバー側の処理
│   │
│   ├── components/       ← 「部品」の定義
│   │   ├── post/         ← 投稿関連の部品
│   │   ├── stamp/        ← スタンプ関連の部品
│   │   ├── community/    ← コミュニティ関連の部品
│   │   ├── profile/      ← プロフィール関連の部品
│   │   ├── home/         ← ホーム関連の部品
│   │   └── layout/       ← ヘッダー・ナビなど共通部品
│   │
│   ├── lib/              ← 「道具箱」
│   │   ├── supabase/     ← データベース接続の道具
│   │   ├── moderation/   ← モデレーション（tier1〜3）
│   │   └── r2.ts         ← ファイル保管の道具
│   │
│   └── types/            ← 「設計図」
│       └── database.ts   ← データの形の定義
│
├── supabase/
│   └── migrations/       ← データベースの構造定義
│
└── scrapers/             ← 外部サイトから情報収集するプログラム
```

### `app/` と `components/` の違い

- **`app/`** → URLに対応するページ（`/home` にアクセスしたらここが動く）
- **`components/`** → ページの中に使う部品（ボタン、投稿カードなど）

レゴで言うと、`app/` は完成品の設計図、`components/` は個々のブロック。

---

## 3. データの旅：投稿が画面に出るまで

### 「投稿する」ボタンを押したとき、何が起きるか

```
① ユーザーが文章を入力して「投稿する」を押す
        ↓
② ブラウザ（クライアント）が /api/posts にデータを送る
   src/components/post/NewPostForm.tsx
        ↓
③ サーバーがデータを受け取る
   src/app/api/posts/route.ts
        ↓
④ モデレーションチェック（3段階）
   ・Tier1: NGワードが含まれていないか？ → 含まれていたらエラー
   ・Tier2: 攻撃的な文脈か？ → 怪しければTier3へ
   ・Tier3: Gemini AIに判定依頼 → 黒なら非公開
        ↓
⑤ 問題なければSupabaseのpostsテーブルに保存
        ↓
⑥ ブラウザが「成功」を受け取ってホームへ移動
        ↓
⑦ ホームページが新しい投稿をSupabaseから取得して表示
```

### データベースのイメージ

データベースはExcelのような「表」の集まりです。FANFAREには以下の表があります：

```
users（ユーザー情報）
┌──────────┬──────────┬──────────┬──────────┐
│ id       │ nickname │ role     │ created  │
├──────────┼──────────┼──────────┼──────────┤
│ abc-123  │ Misa     │ admin    │ 2026/9/6 │
└──────────┴──────────┴──────────┴──────────┘

posts（投稿）
┌──────────┬──────────┬─────────────┬───────────┐
│ id       │ user_id  │ body        │ status    │
├──────────┼──────────┼─────────────┼───────────┤
│ xyz-456  │ abc-123  │ 推し尊い！  │ published │
└──────────┴──────────┴─────────────┴───────────┘
```

`posts.user_id = users.id` で「この投稿は誰が書いたか」がわかります。
これを**リレーション（関係）**といいます。

---

## 4. オブジェクト指向とは何か

### 現実世界をコードで表す考え方

オブジェクト指向とは「現実のものをコードで表す」考え方です。

**例：投稿（Post）を「もの」として考える**

```typescript
// 投稿というオブジェクトが持つ「情報（プロパティ）」
{
  id: "xyz-456",          // 投稿ID
  body: "推し尊い！",     // 本文
  user_id: "abc-123",     // 誰が書いたか
  status: "published",    // 公開状態
  created_at: "2026/9/6" // いつ書いたか
}
```

このように、関連するデータをひとまとめにしたものを**オブジェクト**といいます。

### TypeScriptの「型」とオブジェクト指向

FANFAREでは `src/types/database.ts` に全データの「形」が定義されています。

```typescript
// 投稿の「設計図」（型定義）
posts: {
  Row: {
    id: string;           // 文字列
    user_id: string;      // 文字列
    body: string;         // 文字列
    status: PostStatus;   // "published" | "hidden" | "under_review"
    created_at: string;   // 文字列
  }
}
```

これは「投稿には必ずこれらの情報がある」という**約束事**です。
約束を守らないコードはエラーになります（型安全性）。

### コンポーネントもオブジェクト

Reactのコンポーネントも「オブジェクト」の一種です。

```typescript
// PostCard.tsx（投稿カード部品）
export default function PostCard({
  post,           // 投稿データ（オブジェクト）
  currentUserId,  // 現在のユーザーID
  onStampToggle,  // スタンプを押したときの動作（関数）
}) {
  // この部品は「投稿カード」という1つの責任だけを持つ
  return <div>...</div>;
}
```

**オブジェクト指向の重要な概念：単一責任の原則**
→ 1つの部品（コンポーネント）は1つのことだけをする

- `PostCard` → 投稿1件を表示するだけ
- `StampRow` → スタンプを表示・操作するだけ
- `EventTicker` → イベント情報を流すだけ

---

## 5. FANFAREで使われている主なパターン

### ① サーバーコンポーネント vs クライアントコンポーネント

```typescript
// サーバーコンポーネント（"use client" がない）
// → ページを最初に読み込むときにサーバー側で実行される
// → データベースに直接アクセスできる
export default async function ProfilePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("*");
  return <div>{data.nickname}</div>;
}

// クライアントコンポーネント（"use client" がある）
// → ブラウザ側で実行される
// → ボタンクリックなど「インタラクション」を扱う
"use client";
export default function StampRow() {
  const [count, setCount] = useState(0); // ← これはクライアントでしか使えない
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

**使い分けの目安：**
- データを取ってきて表示するだけ → サーバーコンポーネント
- ボタンを押したら何かする → クライアントコンポーネント

### ② RLS（Row Level Security）：データの鍵番

Supabaseの特徴的な機能。「誰が何を見られるか」をデータベース側で管理します。

```sql
-- 投稿は「公開済み」のものだけ見られる
-- ブロックしているユーザーの投稿は見えない
create policy "posts: select published"
  on public.posts for select
  using (
    status = 'published'
    and not exists (
      select 1 from public.blocks
      where blocker_id = auth.uid() and blocked_id = user_id
    )
  );
```

これがあるから、アプリにバグがあっても「他人のデータが見える」という事故が起きにくい。

### ③ 3層モデレーション

```
Tier1（NGワード）→ 重い処理は後回し、一番シンプルな判定を先に
Tier2（AND判定）→ 「怪しいかも」だけAI判定に送る（コスト削減）
Tier3（Gemini）→ 本当に必要なときだけAIを使う
```

これは「コストをかけずに精度を出す」という設計思想です。
全投稿をAIに送ると月数万円かかるところ、95%はTier1/2で処理できます。

### ④ 楽観的更新（Optimistic Update）

スタンプを押したとき：

```typescript
// 実際にはこうやっている
// 1. まず画面だけ即座に更新（サーバーの返事を待たない）
setLocalCounts(prev => ({ ...prev, [stampId]: count + 1 }));
setBouncing(stampId); // アニメーション開始

// 2. その後でサーバーに保存
await supabase.from("post_stamps").insert({ ... });

// 3. もしサーバーが失敗したら画面を元に戻す
```

「先に見た目を変えてしまって、後でサーバーに追いつかせる」手法。
LINEの既読もこれに近い考え方です。

---

## 6. コードを読む練習

### 実際のコードを一緒に読む

#### 例1：EventTicker.tsx（イベントティッカー）

```typescript
"use client"; // ← ブラウザで動くコンポーネント

// 絵文字の対応表（オブジェクト）
const TYPE_EMOJI: Record<string, string> = {
  live: "🎤",
  tv: "📺",
  release: "💿",
  other: "📢",
};

// コンポーネントの「入口」（引数）
export default function EventTicker({ userId }: { userId: string }) {
  // useState: 状態（変わる値）を管理する
  const [events, setEvents] = useState<TickerEvent[]>([]); // イベント一覧
  const [current, setCurrent] = useState(0);               // 今何番目を表示中か
  const [visible, setVisible] = useState(true);            // 表示/非表示

  // useEffect: コンポーネントが表示されたときに1回だけ実行
  useEffect(() => {
    loadEvents(); // データを取ってくる
  }, []);

  // 2.5秒ごとに次のイベントへ切り替え
  useEffect(() => {
    if (events.length <= 1) return; // イベントが1件以下なら何もしない
    const timer = setInterval(() => {
      setVisible(false);  // フェードアウト
      setTimeout(() => {
        setCurrent((i) => (i + 1) % events.length); // 次のイベントへ
        setVisible(true);  // フェードイン
      }, 300);
    }, 2500); // 2500ミリ秒 = 2.5秒
    return () => clearInterval(timer); // お掃除（メモリリーク防止）
  }, [events.length]);
  
  // ...
}
```

**読み解きポイント：**
- `useState` → 「変わる値」の管理（現在値 + 更新関数のセット）
- `useEffect` → 「副作用」の管理（データ取得・タイマーなど）
- `(i) => (i + 1) % events.length` → 最後に達したら0に戻る（循環）

#### 例2：モデレーションのtier2.ts

```typescript
// 攻撃語の判定（正規表現）
const AMBIGUOUS = /死|無理|やばい|しんどい/u; // 条件A
const TARGET = /お前|こいつ|のファン|のオタク/u; // 条件B
const POSITIVE = /尊い|好き|最高|かわいい/u;    // 条件C

export function checkTier2(text: string): boolean {
  const hasAmbiguous = AMBIGUOUS.test(text); // Aに当てはまるか
  const hasTarget = TARGET.test(text);       // Bに当てはまるか
  const hasPositive = POSITIVE.test(text);   // Cに当てはまるか

  // 3条件のAND判定
  return hasAmbiguous && hasTarget && !hasPositive;
  //     A が true    かつ B が true かつ C が false のとき → true（AI判定へ）
}
```

**読み解きポイント：**
- 「尊すぎて死ぬ」→ A=true, B=false → `false`（AI判定不要、通過）
- 「お前のファンは死ね」→ A=true, B=true, C=false → `true`（AI判定へ）
- `&&` = かつ（AND）、`!` = ではない（NOT）

---

## 7. よく出てくる言葉集

| 言葉 | 意味 |
|---|---|
| **コンポーネント** | 画面の部品（ボタン、カードなど） |
| **プロップス（props）** | 部品に渡す情報（引数） |
| **ステート（state）** | 部品が持つ「変わる値」（カウント、入力値など） |
| **非同期（async/await）** | 「待ってから次へ」の処理（通信など時間がかかるもの） |
| **API** | アプリ同士の「会話の窓口」 |
| **エンドポイント** | APIの「窓口の住所」（例：`/api/posts`） |
| **RLS** | データベースの「誰が何を見られるか」ルール |
| **マイグレーション** | データベースの構造を変える操作 |
| **型（Type）** | データの「形」の約束事（TypeScriptの特徴） |
| **null** | 「値がない」状態 |
| **undefined** | 「定義されていない」状態 |
| **三項演算子** | `条件 ? 真のとき : 偽のとき` の短い書き方 |
| **アロー関数** | `() => {}` という短い関数の書き方 |
| **スプレッド構文** | `{ ...obj, key: value }` = オブジェクトを展開してコピー |

---

## まとめ：コードレビューで見るべきポイント

AIが書いたコードを自分でレビューするときのチェックリスト：

```
□ データの型が正しいか（TypeScriptのエラーが出ていないか）
□ エラー処理が書かれているか（失敗したときの処理）
□ nullチェックがされているか（値がないときにクラッシュしないか）
□ セキュリティ：APIキーがクライアント側に露出していないか
□ セキュリティ：ユーザーIDを信頼しすぎていないか（サーバー側で確認しているか）
□ パフォーマンス：不要なデータまで取ってきていないか
□ 単一責任：1つの関数が複数のことをやりすぎていないか
```

---

---

## 8. イベントティッカーの仕組み

> ホーム画面の「FANFARE」ロゴとタブの間に流れるライブ情報のこと。

### 全体の流れ

```
① STARTOの公式サイト
      ↓ 毎日20時に自動取得（スクレイピング）
② GitHub Actions（自動実行）
      ↓ データを保存
③ Supabaseのeventsテーブル
      ↓ ユーザーがホームを開いたとき
④ EventTicker（ティッカーコンポーネント）
      ↓ 表示
⑤ ホーム画面に流れる
```

### スクレイピングとは？

**スクレイピング** = ウェブサイトのHTMLを自動で読み取って、必要な情報だけを抜き出す技術。

```
普通の人がサイトを見るとき：
  ブラウザを開く → 目でページを読む → 情報を手でメモ

スクレイピングのとき：
  プログラムがHTMLを取得 → 自動でデータを解析 → DBに保存
```

例えばSTARTOのライブページのHTMLはこんな構造になっています：

```html
<li class="p-in_cs__list-item">
  <a href="/s/p/live/10578" class="c-cs_card">
    <div class="c-cs_card__date">
      <span class="c-date">2026.10.30 - 2027.01.07</span>
    </div>
    <div class="c-ttl-2">Snow Man DOME TOUR 2026-2027 ALL SUITE</div>
    <div class="c-cast__item" data-code="43">Snow Man</div>
  </a>
</li>
```

プログラム（`scrapers/starto.ts`）はこのHTMLから：
- 日付 → `c-date` というクラスから取得
- タイトル → `c-ttl-2` というクラスから取得
- アーティスト → `data-code="43"` という番号から取得（43 = Snow Man）

を読み取り、データベースに保存します。

### GitHub Actionsとは？

**GitHub Actions** = GitHubが提供する「定期的に自動でプログラムを実行してくれる仕組み」。

```yaml
# .github/workflows/scrape.yml
on:
  schedule:
    - cron: "0 11 * * *"  # 毎日11:00 UTC = 20:00 JST
```

このファイルがあることで、毎日20時に自動でスクレイパーが動きます。人間が何もしなくても最新情報が更新されます。

### EventTickerコンポーネントの動き

```typescript
// 2.5秒ごとに次のイベントへ切り替え
useEffect(() => {
  const timer = setInterval(() => {
    setVisible(false);        // フェードアウト
    setTimeout(() => {
      setCurrent(i => (i + 1) % events.length);  // 次のイベントへ
      setVisible(true);       // フェードイン
    }, 300);
  }, 2500);  // 2500ミリ秒 = 2.5秒
}, [events.length]);
```

`setInterval` = 「〇〇ミリ秒ごとに繰り返す」タイマー。時計の秒針のようなもの。

### データの保存先（eventsテーブル）

```
events テーブル
┌──────────┬──────────┬─────────────┬────────────────────────────────┬──────────┐
│ id       │ artist_id│ event_date  │ title                          │ source   │
├──────────┼──────────┼─────────────┼────────────────────────────────┼──────────┤
│ xxx-001  │ Snow Man │ 2026-10-30  │ Snow Man DOME TOUR 2026-2027   │ scrape   │
│ xxx-002  │ SixTONES │ 2026-09-19  │ MILESixTONES スタジアムツアー  │ scrape   │
└──────────┴──────────┴─────────────┴────────────────────────────────┴──────────┘
```

`source = 'scrape'` は「スクレイパーが自動で取得したデータ」という意味。
`source = 'user'` は「ユーザーが手動で入力したデータ」という意味。

### 今回やったデバッグの手順

問題が起きたとき、以下の順番で原因を特定しました：

| ステップ | 確認内容 | 結果 |
|---|---|---|
| 1 | GitHub Actionsのログを見る | 「No enabled targets」が判明 |
| 2 | RLSポリシーを確認 | スクレイパーがDBを読めないと判明 |
| 3 | ポリシーを追加するSQLを実行 | アクセス権を付与 |
| 4 | ローカルで実行テスト | 認証情報の読み込み問題が判明 |
| 5 | 直接SQLでデータ挿入 | ティッカーに表示成功 |

**教訓**: 「うまく動かない」ときは、ログを読んでエラーの発生箇所を特定するのが最優先。

---

*このドキュメントはFANFAREの開発と並行して更新していきます。*
*わからない部分があればいつでも聞いてください。*
