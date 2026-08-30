import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    id: "/family",
    name: "VAULTEX FAMILY",
    short_name: "FAMILY",
    description: "SHONAI VAULTEX 保護者向けポータル",
    start_url: "/family",
    scope: "/family",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f5f2ec",
    theme_color: "#111215",
    lang: "ja",
    categories: ["sports", "family", "lifestyle"],
    icons: [
      { src: "/family-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/family-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/family-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "FAMILY HOME", short_name: "ホーム", url: "/family", icons: [{ src: "/family-icon-192.png", sizes: "192x192" }] },
      { name: "予定・出欠", short_name: "予定", url: "/family/schedule", icons: [{ src: "/family-icon-192.png", sizes: "192x192" }] },
      { name: "お知らせ", short_name: "お知らせ", url: "/family/news", icons: [{ src: "/family-icon-192.png", sizes: "192x192" }] },
    ],
  }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } });
}
