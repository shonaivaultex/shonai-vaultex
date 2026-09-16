import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  // Keep the participant app distinct from the authenticated coach app.
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(joinCode)) {
    return NextResponse.json({ error: "Invalid entry code" }, { status: 400 });
  }
  const entry = `/scan/join/${joinCode}`;
  return NextResponse.json({
    id: entry,
    name: "CONTROL TEST 選手用",
    short_name: "CONTROL TEST",
    description: "選手用の測定記録入力・測定履歴",
    start_url: entry,
    scope: "/scan/join/",
    display: "standalone",
    background_color: "#080a09",
    theme_color: "#080a09",
    lang: "ja",
    icons: [
      { src: "/scan-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/scan-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
    shortcuts: [
      { name: "記録を入力", url: entry },
      { name: "選手マイページ", url: `${entry}/dashboard` },
    ],
  }, { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" } });
}
