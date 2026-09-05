import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FANFARE - ファンの数だけ、ファンファーレ。",
  description: "ネガティブ禁止。推しは尊い。同じ推しを推している人同士が繋がる場所。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
