"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TYPE_EMOJI: Record<string, string> = {
  live: "🎤",
  tv: "📺",
  release: "💿",
  other: "📢",
};

interface TickerEvent {
  id: string;
  title: string;
  event_date: string;
  type: string;
  source_url: string | null;
  artists: { name: string } | null;
}

export default function EventTicker({ userId }: { userId: string }) {
  const [events, setEvents] = useState<TickerEvent[]>([]);
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  // 2.5秒ごとに次のイベントへ
  useEffect(() => {
    if (events.length <= 1) return;
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrent((i) => (i + 1) % events.length);
        setVisible(true);
      }, 300);
    }, 2500);
    return () => clearInterval(timer);
  }, [events.length]);

  async function loadEvents() {
    const supabase = createClient();

    // 今日から7日以内のイベントを全アーティスト分取得
    const today = new Date().toISOString().split("T")[0];
    const week = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data } = await supabase
      .from("events")
      .select("id, title, event_date, type, source_url, artists(name)")
      .eq("status", "published")
      .gte("event_date", today)
      .lte("event_date", week)
      .order("event_date", { ascending: true })
      .limit(30);
    setEvents((data ?? []) as TickerEvent[]);
  }

  if (events.length === 0) return null;

  const ev = events[current];
  const daysUntil = Math.ceil(
    (new Date(ev.event_date).getTime() - new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
  );

  const label =
    daysUntil === 0 ? "今日" : daysUntil === 1 ? "明日" : `${daysUntil}日後`;

  const content = (
    <div
      className="flex items-center gap-2 min-w-0"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
      }}
    >
      <span className="text-base flex-shrink-0">{TYPE_EMOJI[ev.type] ?? "📢"}</span>
      <span
        className="text-xs font-medium flex-shrink-0"
        style={{ color: "var(--ff-accent)" }}
      >
        {label}
      </span>
      {ev.artists && (
        <span className="text-xs flex-shrink-0" style={{ color: "var(--ff-muted)" }}>
          {ev.artists.name}
        </span>
      )}
      <span className="text-xs truncate" style={{ color: "var(--ff-fg)" }}>
        {ev.title}
      </span>
      {events.length > 1 && (
        <span className="text-xs flex-shrink-0 ml-1" style={{ color: "var(--ff-border)" }}>
          {current + 1}/{events.length}
        </span>
      )}
    </div>
  );

  return (
    <div
      className="px-4 py-2 overflow-hidden"
      style={{ background: "rgba(110,92,230,0.06)", borderBottom: "1px solid var(--ff-border)" }}
    >
      {ev.source_url ? (
        <a href={ev.source_url} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
