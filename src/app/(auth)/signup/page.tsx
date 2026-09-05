"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function getAgeFromBirthdate(dateStr: string): number {
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!agreed) {
      setError("利用規約への同意が必要です");
      return;
    }

    const age = getAgeFromBirthdate(birthdate);
    if (age < 16) {
      setError("16歳未満の方はご利用いただけません");
      return;
    }

    const birthYear = new Date(birthdate).getFullYear();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nickname, birth_year: birthYear },
      },
    });

    if (error) {
      setError("登録に失敗しました。もう一度お試しください");
      setLoading(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">ニックネーム</label>
        <input
          type="text"
          required
          maxLength={20}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
          style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
          placeholder="推し活名"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">生年月日</label>
        <input
          type="date"
          required
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
          style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
        />
        <p className="text-xs" style={{ color: "var(--ff-muted)" }}>
          年齢確認のみに使用します。保存しません。
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">メールアドレス</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
          style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">パスワード</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
          style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
          placeholder="8文字以上"
        />
      </div>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-[var(--ff-accent)]"
        />
        <span className="text-xs" style={{ color: "var(--ff-muted)" }}>
          利用規約・プライバシーポリシーに同意します。16歳未満の方は保護者の同意を得た上でご利用ください。
        </span>
      </label>

      {error && (
        <p className="text-sm" style={{ color: "#E53E3E" }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 text-sm font-medium text-white rounded-lg transition-opacity disabled:opacity-60"
        style={{ background: "var(--ff-accent)" }}
      >
        {loading ? "登録中..." : "アカウントを作成する"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--ff-muted)" }}>
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-medium" style={{ color: "var(--ff-accent)" }}>
          ログイン
        </Link>
      </p>
    </form>
  );
}
