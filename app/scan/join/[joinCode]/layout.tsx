import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ joinCode: string }> }): Promise<Metadata> {
  const { joinCode } = await params;
  return {
    title: "CONTROL TEST 選手用",
    manifest: `/scan/join/${encodeURIComponent(joinCode)}/manifest.webmanifest`,
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "CONTROL TEST" },
  };
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
