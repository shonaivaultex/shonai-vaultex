import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  applicationName: "VAULTEX FAMILY",
  title: { default: "VAULTEX FAMILY", template: "%s | VAULTEX FAMILY" },
  description: "お子さまの成長・予定・クラブからのお知らせを確認できる保護者向けポータルです。",
  manifest: "/family-manifest.webmanifest",
  icons: {
    icon: [
      { url: "/family-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/family-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/family-apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "FAMILY" },
};

export const viewport: Viewport = { themeColor: "#111215", colorScheme: "light", viewportFit: "cover" };

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
