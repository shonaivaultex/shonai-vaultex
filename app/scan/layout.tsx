import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VAULTEX SCAN for Teams",
  description: "部活動の体力測定と成長を、ひとつの画面で。",
  manifest: "/scan-manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "VAULTEX SCAN" },
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#080a09] text-white">{children}</div>;
}
