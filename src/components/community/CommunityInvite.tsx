"use client";

import { useState } from "react";

export default function CommunityInvite({ communityId }: { communityId: string }) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(communityId);
    setCopied(true);
    setShowMenu(false);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyUrl() {
    const url = `${window.location.origin}/communities/${communityId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setShowMenu(false);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((p) => !p)}
        className="text-xs px-2 py-1 rounded-lg"
        style={{
          background: "var(--ff-border)",
          color: "var(--ff-muted)",
        }}
      >
        {copied ? "コピーしました ✓" : "招待する"}
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div
            className="absolute right-0 top-8 z-50 rounded-xl overflow-hidden shadow-lg"
            style={{ background: "var(--ff-surface)", border: "1px solid var(--ff-border)", minWidth: "160px" }}
          >
            <button
              onClick={copyUrl}
              className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--ff-border)]"
              style={{ color: "var(--ff-fg)" }}
            >
              URLをコピー
            </button>
            <button
              onClick={copyId}
              className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--ff-border)]"
              style={{ color: "var(--ff-muted)", borderTop: "1px solid var(--ff-border)" }}
            >
              IDをコピー
            </button>
          </div>
        </>
      )}
    </div>
  );
}
