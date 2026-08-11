import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SHONAI VAULTEX",
    short_name: "VAULTEX",
    description: "SHONAI VAULTEX 会員マイページ",
    start_url: "/mypage",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#090a0c",
    theme_color: "#090a0c",
    lang: "ja",
    categories: ["sports", "health", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "マイページ", short_name: "マイページ", url: "/mypage", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "記録を追加", short_name: "記録追加", url: "/performance", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "スケジュール", short_name: "予定", url: "/mypage/schedules", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
