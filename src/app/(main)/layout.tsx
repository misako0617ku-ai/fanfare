import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/layout/LogoutButton";
import PostFab from "@/components/layout/PostFab";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("nickname, icon_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col max-w-[480px] mx-auto">
      {/* Top bar */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 h-12 border-b"
        style={{ background: "var(--ff-bg)", borderColor: "var(--ff-border)" }}
      >
        <Link href="/home">
          <span className="text-xl font-bold tracking-widest" style={{ color: "var(--ff-accent)" }}>
            FAN<span className="font-black">FARE</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link href={`/profile/${user.id}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "var(--ff-accent)" }}
            >
              {profile?.nickname?.[0] ?? "？"}
            </div>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 pb-20">{children}</main>

      {/* FAB */}
      <PostFab />

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] border-t flex"
        style={{ background: "var(--ff-bg)", borderColor: "var(--ff-border)" }}
      >
        <NavItem href="/home" label="ホーム" icon="🏠" />
        <NavItem href="/communities" label="コミュニティ" icon="👥" />
        <NavItem href="/communities/new" label="作成する" icon="➕" />
        <NavItem href={`/profile/${user.id}`} label="マイページ" icon="👤" />
      </nav>
    </div>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs"
      style={{ color: "var(--ff-muted)" }}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
