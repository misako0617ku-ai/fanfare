"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Artist {
  id: string;
  name: string;
}

const MAX_IMAGES = 4;
const MAX_VIDEOS = 2;

export default function NewPostForm({ artists }: { artists: Artist[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<
    Array<{ file: File; preview: string; type: "image" | "video" }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const imageCount = mediaFiles.filter((m) => m.type === "image").length;
  const videoCount = mediaFiles.filter((m) => m.type === "video").length;

  function toggleArtist(id: string) {
    setSelectedArtists((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        if (imageCount >= MAX_IMAGES) { setError("画像は最大4枚です"); return; }
        if (file.size > 10 * 1024 * 1024) { setError("画像は10MB以内にしてください"); return; }
        const preview = URL.createObjectURL(file);
        setMediaFiles((prev) => [...prev, { file, preview, type: "image" }]);
      } else if (file.type === "video/mp4") {
        if (videoCount >= MAX_VIDEOS) { setError("動画は最大2本です"); return; }
        if (file.size > 50 * 1024 * 1024) { setError("動画は50MB以内にしてください"); return; }
        // Client-side duration check
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
          if (video.duration > 60) {
            setError("動画は60秒以内にしてください");
            URL.revokeObjectURL(video.src);
            return;
          }
          setMediaFiles((prev) => [...prev, { file, preview: video.src, type: "video" }]);
        };
      } else {
        setError("対応していないファイル形式です（画像またはmp4動画のみ）");
        return;
      }
    }
    setError(null);
    e.target.value = "";
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadMedia(): Promise<Array<{ key: string; type: "image" | "video" }>> {
    const results: Array<{ key: string; type: "image" | "video" }> = [];
    for (const media of mediaFiles) {
      const res = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mimeType: media.file.type,
          sizeBytes: media.file.size,
        }),
      });
      const { url, key, error: urlError } = await res.json();
      if (urlError) throw new Error(urlError);

      await fetch(url, {
        method: "PUT",
        body: media.file,
        headers: { "Content-Type": media.file.type },
      });

      results.push({ key, type: media.type });
    }
    return results;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) { setError("本文を入力してください"); return; }
    setLoading(true);
    setError(null);

    try {
      const mediaKeys = await uploadMedia();

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          artistIds: selectedArtists,
          mediaKeys,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "投稿に失敗しました");
        setLoading(false);
        return;
      }

      router.push("/home");
      router.refresh();
    } catch {
      setError("通信に失敗しました。もう一度お試しください");
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-4">
      <h2 className="text-base font-bold mb-4" style={{ color: "var(--ff-fg)" }}>
        投稿する
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Body */}
        <div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={500}
            rows={5}
            placeholder="推しへの気持ちをファンファーレに乗せて..."
            className="w-full px-3 py-2 text-sm border rounded-lg resize-none outline-none focus:ring-2 focus:ring-[var(--ff-accent)]"
            style={{ borderColor: "var(--ff-border)", borderRadius: "8px" }}
          />
          <p className="text-xs text-right mt-0.5" style={{ color: "var(--ff-muted)" }}>
            {body.length}/500
          </p>
        </div>

        {/* Artist selection */}
        {artists.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--ff-muted)" }}>
              推しを選択（複数可）
            </p>
            <div className="flex flex-wrap gap-1.5">
              {artists.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleArtist(a.id)}
                  className="px-3 py-1 text-xs rounded-full transition-colors"
                  style={{
                    borderRadius: "9999px",
                    background: selectedArtists.includes(a.id)
                      ? "var(--ff-accent)"
                      : "var(--ff-border)",
                    color: selectedArtists.includes(a.id) ? "#fff" : "var(--ff-fg)",
                  }}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Media preview */}
        {mediaFiles.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mediaFiles.map((m, i) => (
              <div key={i} className="relative">
                {m.type === "image" ? (
                  <img
                    src={m.preview}
                    alt=""
                    className="w-20 h-20 object-cover"
                    style={{ borderRadius: "12px" }}
                  />
                ) : (
                  <video
                    src={m.preview}
                    className="w-20 h-20 object-cover"
                    style={{ borderRadius: "12px" }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(i)}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs text-white flex items-center justify-center"
                  style={{ background: "var(--ff-fg)" }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Media add button */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border"
            style={{ borderColor: "var(--ff-border)", color: "var(--ff-muted)" }}
          >
            <span>📎</span>
            <span>画像・動画を追加</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {error && (
          <p className="text-sm" style={{ color: "#E53E3E" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="w-full py-2.5 text-sm font-medium text-white rounded-full transition-opacity disabled:opacity-50"
          style={{ background: "var(--ff-accent)", borderRadius: "9999px" }}
        >
          {loading ? "投稿中..." : "投稿する"}
        </button>
      </form>
    </div>
  );
}
