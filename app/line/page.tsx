import Link from "next/link";
import { Activity, CalendarDays, ClipboardPen, Home, MessageCircle, Users } from "lucide-react";

const items = [
  { href: "/mypage", label: "マイページ", icon: Home },
  { href: "/mypage/schedules", label: "今日・全体予定", icon: CalendarDays },
  { href: "/mypage/my-calendar?week=1", label: "1週間を作成", icon: ClipboardPen },
  { href: "/performance", label: "記録を入力", icon: Activity },
  { href: "/mypage/consult", label: "コーチへ相談", icon: MessageCircle },
  { href: "/family", label: "FAMILY", icon: Users },
];

export default function LineMenuPage() {
  return <main className="min-h-screen bg-[#090a0c] px-4 pb-16 pt-20 text-white"><div className="mx-auto max-w-xl">
    <p className="text-xs font-black tracking-[.24em] text-[#06c755]">VAULTEX × LINE</p>
    <h1 className="mt-3 text-4xl font-black tracking-tight">すぐに使う</h1>
    <p className="mt-3 text-sm leading-7 text-white/50">公式LINEのリッチメニューから開く、会員・保護者共通の入口です。</p>
    <section className="mt-8 grid grid-cols-2 gap-3">{items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className="flex min-h-32 flex-col justify-between rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:border-[#06c755]/50"><Icon className="text-[#06c755]"/><strong className="text-sm">{label}</strong></Link>)}</section>
    <a href="https://line.me/R/ti/p/@082fhyco" className="mt-4 block rounded-xl border border-[#06c755]/30 px-5 py-4 text-center text-sm font-bold text-[#06c755]">公式LINEのトークを開く</a>
  </div></main>;
}
