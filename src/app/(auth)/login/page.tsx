"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" style={{ color: "var(--ff-fg)" }}>
          メールアドレス
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
          style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
          placeholder="fanfare@example.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" style={{ color: "var(--ff-fg)" }}>
          パスワード
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
          style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
        />
      </div>

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
        {loading ? "ログイン中..." : "ログインする"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--ff-muted)" }}>
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="font-medium" style={{ color: "var(--ff-accent)" }}>
          新規登録
        </Link>
      </p>
    </form>
  );
}
