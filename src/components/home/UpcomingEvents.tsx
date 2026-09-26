"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TYPE_EMOJI: Record<string, string> = {
  live: "🎤",
  tv: "📺",
  release: "💿",
  other: "📢",
};

interface Event {
  id: string;
  title: string;
  event_date: string;
  type: string;
  source_url: string | null;
  artists: { name: string } | null;
}

export default function UpcomingEvents({ userId }: { userId: string }) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    load();
  }, [userId]);

  async function load() {
    const supabase = createClient();

    // 推しアーティストを取得
    const { data: oshiData } = await supabase
      .from("user_oshi")
      .select("artist_id")
      .eq("user_id", userId);

    const oshiIds = (oshiData ?? []).map((r) => r.artist_id);

    // 90日前〜180日後のイベントを取得（開催中ツアーも含む）
    const from = new Date();
    from.setDate(from.getDate() - 90);
    const fromStr = from.toISOString().split("T")[0];

    const to = new Date();
    to.setDate(to.getDate() + 180);
    const toStr = to.toISOString().split("T")[0];

    let query = supabase
      .from("events")
      .select("id, title, event_date, type, source_url, artists(name)")
      .eq("status", "published")
      .gte("event_date", fromStr)
      .lte("event_date", toStr)
      .order("event_date", { ascending: true })
      .limit(30);

    if (oshiIds.length > 0) {
      query = query.in("artist_id", oshiIds);
    }

    const { data } = await query;
    setEvents((data ?? []) as Event[]);
  }

  if (events.length === 0) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="px-4 pt-4 pb-2">
      <h2 className="text-sm font-bold mb-3" style={{ color: "var(--ff-fg)" }}>
        🎪 イベント情報
      </h2>
      <div className="flex flex-col gap-2">
        {events.map((ev) => {
          const isOngoing = ev.event_date < today;
          const daysUntil = Math.ceil(
            (new Date(ev.event_date).getTime() - new Date(today).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          const label = isOngoing
            ? "開催中"
            : daysUntil === 0
            ? "今日"
            : daysUntil === 1
            ? "明日"
            : daysUntil <= 7
            ? `${daysUntil}日後`
            : ev.event_date.slice(5).replace("-", "/");

          const inner = (
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                background: isOngoing
                  ? "rgba(110,92,230,0.08)"
                  : "var(--ff-border)",
              }}
            >
              <span className="text-lg flex-shrink-0">{TYPE_EMOJI[ev.type] ?? "📢"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs font-bold flex-shrink-0 px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isOngoing ? "var(--ff-accent)" : "rgba(110,92,230,0.15)",
                      color: isOngoing ? "#fff" : "var(--ff-accent)",
                      fontSize: "10px",
                    }}
                  >
                    {label}
                  </span>
                  {ev.artists && (
                    <span className="text-xs truncate" style={{ color: "var(--ff-muted)" }}>
                      {ev.artists.name}
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium truncate" style={{ color: "var(--ff-fg)" }}>
                  {ev.title}
                </p>
              </div>
              {ev.source_url && (
                <span className="text-xs flex-shrink-0" style={{ color: "var(--ff-muted)" }}>
                  ›
                </span>
              )}
            </div>
          );

          return ev.source_url ? (
            <a key={ev.id} href={ev.source_url} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <div key={ev.id}>{inner}</div>
          );
        })}
      </div>
      <div
        className="mt-2 mb-1"
        style={{ height: "1px", background: "var(--ff-border)" }}
      />
    </div>
  );
}
