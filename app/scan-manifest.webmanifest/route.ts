import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    id: "/scan",
    name: "CONTROL TEST for Teams",
    short_name: "CONTROL TEST",
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
      { src: "/scan-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/scan-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
    shortcuts: [
      { name: "チーム管理", short_name: "チーム", url: "/scan/dashboard" },
    ],
  }, { headers: { "content-type": "application/manifest+json" } });
}
