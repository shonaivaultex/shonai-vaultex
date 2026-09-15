import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VAULTEX SCAN for Teams",
  description: "部活動の体力測定と成長を、ひとつの画面で。",
  manifest: "/scan-manifest.webmanifest",
  icons: {
    icon: [{ url: "/scan-icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/scan-icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/scan-apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "VAULTEX SCAN" },
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#080a09] text-white">{children}</div>;
}
