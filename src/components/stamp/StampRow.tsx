"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const NORMAL_STAMPS = [
  { id: "", label: "尊い", emoji: "🙏" },
  { id: "", label: "しんどい", emoji: "😭" },
  { id: "", label: "ブラボー", emoji: "👏" },
  { id: "", label: "好き", emoji: "💗" },
  { id: "", label: "かわいい", emoji: "🎀" },
  { id: "", label: "かっこいい", emoji: "✨" },
  { id: "", label: "わかる", emoji: "🙌" },
  { id: "", label: "おめでとう", emoji: "🎉" },
];

interface StampRowProps {
  postId: string;
  stampCounts: Record<string, number>;
  myStamps: string[];
  currentUserId: string;
  onToggle: () => void;
}

export default function StampRow({
  postId,
  stampCounts,
  myStamps,
  currentUserId,
  onToggle,
}: StampRowProps) {
  const [stamps, setStamps] = useState<Array<{ id: string; label: string; emoji: string }>>([]);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>(stampCounts);
  const [localMine, setLocalMine] = useState<Set<string>>(new Set(myStamps));
  const [bouncing, setBouncing] = useState<string | null>(null);

  useEffect(() => {
    loadStamps();
  }, []);

  useEffect(() => {
    setLocalCounts(stampCounts);
    setLocalMine(new Set(myStamps));
  }, [stampCounts, myStamps]);

  async function loadStamps() {
    const supabase = createClient();
    const { data } = await supabase
      .from("stamps")
      .select("id, label, emoji")
      .eq("category", "normal")
      .order("sort_order");
    if (data) setStamps(data);
  }

  async function handleToggle(stampId: string) {
    const isActive = localMine.has(stampId);

    // Optimistic update
    setLocalCounts((prev) => ({
      ...prev,
      [stampId]: Math.max(0, (prev[stampId] ?? 0) + (isActive ? -1 : 1)),
    }));
    setLocalMine((prev) => {
      const next = new Set(prev);
      if (isActive) next.delete(stampId);
      else next.add(stampId);
      return next;
    });

    if (!isActive) {
      setBouncing(stampId);
      setTimeout(() => setBouncing(null), 400);
    }

    const supabase = createClient();
    if (isActive) {
      await supabase
        .from("post_stamps")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", currentUserId)
        .eq("stamp_id", stampId);
    } else {
      await supabase
        .from("post_stamps")
        .insert({ post_id: postId, user_id: currentUserId, stamp_id: stampId });
    }

    onToggle();
  }

  const activeStamps = stamps.filter((s) => (localCounts[s.id] ?? 0) > 0 || localMine.has(s.id));

  return (
    <div className="flex flex-wrap gap-1.5">
      {stamps.map((stamp) => {
        const count = localCounts[stamp.id] ?? 0;
        const isActive = localMine.has(stamp.id);
        const isBouncing = bouncing === stamp.id;

        if (count === 0 && !isActive) return null;

        return (
          <button
            key={stamp.id}
            onClick={() => handleToggle(stamp.id)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-full transition-colors"
            style={{
              borderRadius: "9999px",
              background: isActive ? "var(--ff-accent)" : "var(--ff-border)",
              color: isActive ? "#fff" : "var(--ff-fg)",
              transform: isBouncing ? "scale(1.25)" : "scale(1)",
              transition: "transform 0.2s cubic-bezier(.36,.07,.19,.97), background 0.1s",
            }}
          >
            <span
              style={{
                display: "inline-block",
                transform: isBouncing ? "scale(1.2)" : "scale(1)",
                transition: "transform 0.2s cubic-bezier(.36,.07,.19,.97)",
              }}
            >
              {stamp.emoji}
            </span>
            <span>{stamp.label}</span>
            {count > 0 && (
              <span
                className="font-medium"
                style={{ color: isActive ? "rgba(255,255,255,0.85)" : "var(--ff-muted)" }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}

      {/* Add stamp button */}
      <AddStampButton
        stamps={stamps}
        myStamps={localMine}
        onToggle={handleToggle}
      />
    </div>
  );
}

function AddStampButton({
  stamps,
  myStamps,
  onToggle,
}: {
  stamps: Array<{ id: string; label: string; emoji: string }>;
  myStamps: Set<string>;
  onToggle: (stampId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-center w-8 h-7 rounded-full text-sm"
        style={{ background: "var(--ff-border)", color: "var(--ff-muted)" }}
        aria-label="スタンプを追加"
      >
        +
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute bottom-9 left-0 z-50 p-2 rounded-xl shadow-lg grid grid-cols-4 gap-1"
            style={{ background: "var(--ff-surface)", border: "1px solid var(--ff-border)" }}
          >
            {stamps.map((s) => (
              <button
                key={s.id}
                onClick={() => { onToggle(s.id); setOpen(false); }}
                className="flex flex-col items-center p-1.5 rounded-lg text-xs gap-0.5"
                style={{
                  background: myStamps.has(s.id) ? "var(--ff-accent)" : "transparent",
                  color: myStamps.has(s.id) ? "#fff" : "var(--ff-fg)",
                }}
              >
                <span className="text-lg leading-none">{s.emoji}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
