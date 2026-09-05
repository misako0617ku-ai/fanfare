"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PostFab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const fabBottom = "5rem";
  const fabRight = "1rem";

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Options — appear directly above the FAB */}
      {open && (
        <div
          style={{
            position: "fixed",
            bottom: "9rem",
            right: fabRight,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            alignItems: "flex-end",
          }}
        >
          <button
            onClick={() => { setOpen(false); router.push("/communities"); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "var(--ff-surface)",
              color: "var(--ff-fg)",
              border: "1px solid var(--ff-border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span>👥</span> コミュニティに投稿
          </button>
          <button
            onClick={() => { setOpen(false); router.push("/post/new"); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              borderRadius: "9999px",
              fontSize: "0.875rem",
              fontWeight: 500,
              background: "var(--ff-surface)",
              color: "var(--ff-fg)",
              border: "1px solid var(--ff-border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            <span>🏠</span> ホームに投稿
          </button>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="投稿する"
        style={{
          position: "fixed",
          bottom: fabBottom,
          right: fabRight,
          zIndex: 50,
          width: "3.5rem",
          height: "3.5rem",
          borderRadius: "9999px",
          background: "var(--ff-accent)",
          color: "#fff",
          fontSize: "1.5rem",
          lineHeight: 1,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "none",
          cursor: "pointer",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
          transition: "transform 0.2s ease",
        }}
      >
        +
      </button>
    </>
  );
}
