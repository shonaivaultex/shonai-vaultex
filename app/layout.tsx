import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SHONAI VAULTEX | Athletics Club",
    template: "%s | SHONAI VAULTEX",
  },
  
  description:
    "山形県庄内地域を拠点とする総合陸上クラブ、SHONAI VAULTEX。挑戦する人を増やし、庄内から全国へ。",
    keywords: [
  "SHONAI VAULTEX",
  "庄内陸上クラブ",
  "酒田陸上クラブ",
  "鶴岡陸上クラブ",
  "山形陸上クラブ",
  "陸上教室",
  "ジュニア陸上",
  "かけっこ教室",
  "陸上競技",
],
    icons: {
  icon: "/logo.png",
  
},
metadataBase: new URL("https://shonai-vaultex.vercel.app"),

openGraph: {
  title: "SHONAI VAULTEX",
  description:
    "庄内から、全国へ。挑戦する人を増やす総合陸上クラブ。",
  url: "https://shonai-vaultex.vercel.app",
  siteName: "SHONAI VAULTEX",
  locale: "ja_JP",
  type: "website",
  images: [
    {
      url: "/ogp2.jpg",
      width: 1200,
      height: 630,
      alt: "SHONAI VAULTEX",
    },
    
  ],
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#090a0c] font-sans text-white">
  <Header />
  <div className="flex-1">{children}</div>
  <Footer />
</body>
    </html>
  );
}
