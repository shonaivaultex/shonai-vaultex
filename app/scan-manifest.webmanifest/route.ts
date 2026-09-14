import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    name: "VAULTEX SCAN for Teams",
    short_name: "VAULTEX SCAN",
    description: "部活動向けCONTROL TEST測定アプリ",
    start_url: "/scan/dashboard",
    scope: "/scan",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#080a09",
    theme_color: "#080a09",
    lang: "ja",
    categories: ["sports", "education", "health"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "チーム管理", short_name: "チーム", url: "/scan/dashboard" },
    ],
  }, { headers: { "content-type": "application/manifest+json" } });
}
