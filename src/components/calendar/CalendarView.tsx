"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TYPE_EMOJI: Record<string, string> = {
  live: "🎤",
  tv: "📺",
  release: "💿",
  other: "📢",
};

interface CalEvent {
  id: string;
  title: string;
  event_date: string;
  type: string;
  source_url: string | null;
  artist_id: string;
  artists: { name: string } | null;
}

export default function CalendarView({
  events,
  attendingIds: initialAttending,
  userId,
}: {
  events: CalEvent[];
  attendingIds: string[];
  userId: string;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(
    today.toISOString().split("T")[0]
  );
  const [attending, setAttending] = useState<Set<string>>(new Set(initialAttending));

  // カレンダー生成
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  // 日付ごとのイベントマップ
  const eventsByDate: Record<string, CalEvent[]> = {};
  for (const ev of events) {
    if (!eventsByDate[ev.event_date]) eventsByDate[ev.event_date] = [];
    eventsByDate[ev.event_date].push(ev);
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  async function toggleAttendance(eventId: string) {
    const supabase = createClient();
    if (attending.has(eventId)) {
      await supabase.from("event_attendances")
        .delete()
        .eq("user_id", userId)
        .eq("event_id", eventId);
      setAttending(prev => { const next = new Set(prev); next.delete(eventId); return next; });
    } else {
      await supabase.from("event_attendances")
        .insert({ user_id: userId, event_id: eventId });
      setAttending(prev => new Set([...prev, eventId]));
    }
  }

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : [];
  const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div>
      {/* ヘッダー */}
      <div
        className="px-4 py-3 flex items-center justify-between sticky top-12 z-30"
        style={{ background: "var(--ff-bg)", borderBottom: "1px solid var(--ff-border)" }}
      >
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center text-lg" style={{ color: "var(--ff-muted)" }}>‹</button>
        <span className="text-base font-bold" style={{ color: "var(--ff-fg)" }}>
          {year}年{month + 1}月
        </span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center text-lg" style={{ color: "var(--ff-muted)" }}>›</button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 px-2 pt-2">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className="text-center text-xs py-1 font-medium"
            style={{ color: i === 0 ? "#ef4444" : i === 6 ? "#3b82f6" : "var(--ff-muted)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 px-2 pb-2">
        {/* 空白セル */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {/* 日付セル */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ds = dateStr(day);
          const dayEvents = eventsByDate[ds] ?? [];
          const isToday = ds === todayStr;
          const isSelected = ds === selectedDate;
          const hasAttending = dayEvents.some(e => attending.has(e.id));
          const weekday = (firstDay + i) % 7;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : ds)}
              className="flex flex-col items-center py-1.5 rounded-lg"
              style={{
                background: isSelected ? "var(--ff-accent)" : "transparent",
              }}
            >
              <span
                className="text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium"
                style={{
                  background: isToday && !isSelected ? "rgba(110,92,230,0.12)" : "transparent",
                  color: isSelected ? "#fff"
                    : weekday === 0 ? "#ef4444"
                    : weekday === 6 ? "#3b82f6"
                    : "var(--ff-fg)",
                  fontWeight: isToday ? "700" : "400",
                }}
              >
                {day}
              </span>
              {/* イベントドット */}
              <div className="flex gap-0.5 mt-0.5 h-1.5">
                {dayEvents.slice(0, 3).map((e, idx) => (
                  <div
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: attending.has(e.id)
                        ? "#22c55e"
                        : isSelected ? "rgba(255,255,255,0.7)" : "var(--ff-accent)",
                    }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* 参戦予定カウント */}
      <div
        className="px-4 py-2 text-xs"
        style={{ color: "var(--ff-muted)", borderTop: "1px solid var(--ff-border)" }}
      >
        🟢 参戦予定 {attending.size}件 ／ 推しイベント計 {events.length}件
      </div>

      {/* 選択日のイベント */}
      {selectedDate && (
        <div style={{ borderTop: "1px solid var(--ff-border)" }}>
          <div className="px-4 py-3">
            <p className="text-sm font-bold" style={{ color: "var(--ff-fg)" }}>
              {selectedDate.slice(5, 7)}月{selectedDate.slice(8, 10)}日のイベント
            </p>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="px-4 pb-4 text-sm" style={{ color: "var(--ff-muted)" }}>
              この日のイベントはありません
            </p>
          ) : (
            <div>
              {selectedEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="px-4 py-3 flex items-start gap-3"
                  style={{ borderBottom: "1px solid var(--ff-border)" }}
                >
                  <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_EMOJI[ev.type] ?? "📢"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-0.5" style={{ color: "var(--ff-accent)" }}>
                      {ev.artists?.name}
                    </p>
                    {ev.source_url ? (
                      <a
                        href={ev.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium line-clamp-2"
                        style={{ color: "var(--ff-fg)" }}
                      >
                        {ev.title}
                      </a>
                    ) : (
                      <p className="text-sm font-medium line-clamp-2" style={{ color: "var(--ff-fg)" }}>
                        {ev.title}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleAttendance(ev.id)}
                    className="flex-shrink-0 px-3 py-1 text-xs rounded-full font-medium"
                    style={{
                      background: attending.has(ev.id) ? "#22c55e" : "var(--ff-border)",
                      color: attending.has(ev.id) ? "#fff" : "var(--ff-muted)",
                    }}
                  >
                    {attending.has(ev.id) ? "参戦予定✓" : "参戦予定"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
