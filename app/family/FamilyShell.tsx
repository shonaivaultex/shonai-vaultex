import Link from "next/link";
import { Bell, CalendarDays, ChartNoAxesCombined, Home, Settings } from "lucide-react";
import type { FamilyContext } from "@/lib/family";
import FamilyTutorial from "./FamilyTutorial";

const nav = [
  { href: "/family", label: "HOME", icon: Home },
  { href: "/family/growth", label: "成長", icon: ChartNoAxesCombined },
  { href: "/family/schedule", label: "予定", icon: CalendarDays },
  { href: "/family/news", label: "お知らせ", icon: Bell },
  { href: "/family/settings", label: "設定", icon: Settings },
];

export default function FamilyShell({ context, active, children }: { context: FamilyContext; active: string; children: React.ReactNode }) {
  const athleteQuery = `?athlete=${context.athlete.id}`;
  return <main className="min-h-screen bg-[#f5f2ec] pb-28 pt-20 text-[#151515] sm:pt-24">
    <header className="border-b border-black/10 bg-white/80 px-5 py-6 backdrop-blur sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-5">
        <div><p className="text-[10px] font-black tracking-[.28em] text-orange-600">SHONAI VAULTEX</p><h1 className="mt-1 text-2xl font-black tracking-[-.045em] sm:text-3xl">VAULTEX FAMILY</h1><p className="mt-1 text-sm text-black/50">成長を、一緒に見守る。</p><FamilyTutorial /></div>
        <form action={active} className="min-w-[180px]">
          <label className="text-[10px] font-black tracking-[.14em] text-black/40" htmlFor="family-athlete">お子さま</label>
          <select id="family-athlete" name="athlete" defaultValue={context.athlete.id} className="mt-1 block w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-bold" onChange={undefined}>
            {context.athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name} {athlete.grade ?? ""}</option>)}
          </select>
          <button className="mt-2 w-full rounded-lg bg-black px-3 py-2 text-xs font-black text-white">表示を切り替える</button>
        </form>
      </div>
    </header>
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">{children}</div>
    <nav aria-label="FAMILY navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-5">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={`${href}${athleteQuery}`} className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-black ${active === href ? "text-orange-600" : "text-black/45"}`}><Icon size={19}/>{label}</Link>)}</div>
    </nav>
  </main>;
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-black/8 bg-white p-5 shadow-[0_10px_35px_rgba(0,0,0,.04)] sm:p-6 ${className}`}>{children}</section>;
}

export function SectionTitle({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) {
  return <div><p className="text-[10px] font-black tracking-[.2em] text-orange-600">{eyebrow}</p><h2 className="mt-2 text-xl font-black tracking-[-.03em]">{children}</h2></div>;
}
