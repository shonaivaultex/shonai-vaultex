import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, ScanLine, Sparkles, Target, Trophy } from "lucide-react";
import OverallGrowthReport from "@/app/components/OverallGrowthReport";
import type { GrowthRecord } from "@/app/components/MonthlyGrowthReport";
import type { PerformanceKind } from "@/lib/performance-events";

type SampleRecord = GrowthRecord & { record_kind: PerformanceKind };

const sampleRecords: SampleRecord[] = [
  { id: 1, category: "走幅跳", value: 6.18, date: "2026-04-12", awareness_categories: ["リズム"], record_kind: "athletics" },
  { id: 2, category: "走幅跳", value: 6.27, date: "2026-05-03", awareness_categories: ["リズム", "動作"], record_kind: "athletics" },
  { id: 3, category: "走幅跳", value: 6.36, date: "2026-06-21", awareness_categories: ["感覚"], record_kind: "athletics" },
  { id: 4, category: "走幅跳", value: 6.48, date: "2026-08-02", awareness_categories: ["リズム", "スタート"], record_kind: "athletics" },
  { id: 5, category: "100m", value: 11.82, date: "2026-04-06", awareness_categories: ["力感"], record_kind: "athletics" },
  { id: 6, category: "100m", value: 11.69, date: "2026-06-07", awareness_categories: ["リズム"], record_kind: "athletics" },
  { id: 7, category: "100m", value: 11.54, date: "2026-08-09", awareness_categories: ["スタート", "リズム"], record_kind: "athletics" },
  { id: 8, category: "走幅跳", value: 6.22, date: "2026-05-17", awareness_categories: ["動作"], record_kind: "unofficial-athletics" },
  { id: 9, category: "走幅跳", value: 6.41, date: "2026-07-19", awareness_categories: ["リズム"], record_kind: "unofficial-athletics" },
  { id: 10, category: "立幅跳", value: 2.74, date: "2026-04-20", awareness_categories: ["力感"], record_kind: "control-test" },
  { id: 11, category: "立幅跳", value: 2.83, date: "2026-07-20", awareness_categories: ["動作"], record_kind: "control-test" },
  { id: 12, category: "立五段跳", value: 13.68, date: "2026-04-20", awareness_categories: ["リズム"], record_kind: "control-test" },
  { id: 13, category: "立五段跳", value: 14.12, date: "2026-07-20", awareness_categories: ["リズム", "感覚"], record_kind: "control-test" },
];

export default function MyPageSample() {
  return <main className="min-h-screen bg-[#090a0c] px-4 pb-24 pt-24 text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-white/55 transition hover:text-orange-400"><ArrowLeft size={16}/>ホームへ戻る</Link><span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-[10px] font-black tracking-[.14em] text-orange-300">PUBLIC DEMO / 架空データ</span></div>

      <header className="mt-8 overflow-hidden rounded-[30px] border border-orange-500/40 bg-[radial-gradient(circle_at_82%_15%,rgba(249,115,22,.22),transparent_32%),linear-gradient(145deg,#171717,#0c0d0f_70%)] p-6 sm:p-9">
        <p className="text-[10px] font-black tracking-[.24em] text-orange-400">SHONAI VAULTEX MY PAGE</p>
        <div className="mt-4 grid gap-7 lg:grid-cols-[1fr_1.25fr] lg:items-end"><div><h1 className="text-3xl font-black tracking-[-.05em] sm:text-5xl">成長が、見える。<br/>次の一歩が、決まる。</h1><p className="mt-4 max-w-lg text-sm leading-7 text-white/55">記録・感覚・動画・身体能力を一つにまとめ、昨日の自分からの変化を振り返れます。</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="累計記録" value="13件"/><Metric label="PB更新" value="7回"/><Metric label="よく使う意識" value="リズム"/><Metric label="次の目標まで" value="18日"/></div></div>
      </header>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-7"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.18em] text-orange-400">NEXT TARGET</p><h2 className="mt-1 text-2xl font-black">秋季記録会</h2></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500 text-black"><Target/></span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-white/[.035] p-4"><span className="text-xs text-white/40">目標種目</span><strong className="mt-1 block text-lg">走幅跳 6.60m</strong></div><div className="rounded-2xl bg-white/[.035] p-4"><span className="text-xs text-white/40">目標日</span><strong className="mt-1 block text-lg">2026/09/06</strong></div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full w-[72%] rounded-full bg-gradient-to-r from-orange-700 to-orange-300"/></div><p className="mt-2 text-right text-xs font-black text-orange-300">目標まであと18日</p></article>
        <article className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[.04] p-5 sm:p-7"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><ScanLine/></span><div><p className="text-[10px] font-black tracking-[.16em] text-cyan-300">ATHLETE SCAN</p><h2 className="mt-1 font-black">身体能力の現在地</h2></div></div><div className="mt-5 grid grid-cols-3 gap-2 text-center"><Score label="SPEED" value="78"/><Score label="POWER" value="84"/><Score label="REACTIVE" value="73"/></div><p className="mt-4 text-xs leading-6 text-white/45">CONTROL TESTを継続すると、身体能力プロフィールの変化を確認できます。</p></article>
      </section>

      <section className="mt-5 rounded-3xl border border-orange-500/30 bg-[#0e0f11] p-5 sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">GROWTH REPORT SAMPLE</p><h2 className="mt-1 text-2xl font-black sm:text-3xl">全期間の成長レポート</h2><p className="mt-2 text-sm leading-6 text-white/45">記録を追加するだけで、種目ごとの成長と取り組みの傾向を自動で整理します。</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><BarChart3/></span></div><div className="mt-7"><OverallGrowthReport records={sampleRecords}/></div></section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3"><Feature icon={<CalendarDays/>} title="予定と記録がつながる" text="マイカレンダーから練習、試合、動画、振り返りを確認。"/><Feature icon={<Trophy/>} title="成長を自動で集計" text="PB、前回比、意識傾向を自分で計算せずに確認。"/><Feature icon={<Sparkles/>} title="コーチへすぐ相談" text="記録や動画に紐づけて、見てほしい点をそのまま送信。"/></section>

      <div className="mt-10 rounded-3xl bg-orange-500 p-6 text-black sm:flex sm:items-center sm:justify-between sm:p-8"><div><p className="text-[10px] font-black tracking-[.2em]">START YOUR JOURNEY</p><h2 className="mt-2 text-2xl font-black">次は、あなたの成長を記録しよう。</h2></div><Link href="https://forms.gle/9KLAq5PSkBudhbyL9" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-4 text-sm font-black text-white sm:mt-0">無料体験を予約する<ArrowRight size={17}/></Link></div>
    </div>
  </main>;
}

function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white/10 bg-black/25 p-3"><span className="block text-[9px] font-black tracking-wide text-white/35">{label}</span><strong className="mt-1 block truncate text-base text-white">{value}</strong></div>}
function Score({label,value}:{label:string;value:string}){return <div className="rounded-xl bg-black/25 p-3"><span className="text-[8px] font-black text-white/35">{label}</span><strong className="mt-1 block text-2xl text-cyan-300">{value}</strong></div>}
function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <article className="rounded-2xl border border-white/10 bg-[#111] p-5"><span className="text-orange-400">{icon}</span><h3 className="mt-4 font-black">{title}</h3><p className="mt-2 text-xs leading-6 text-white/45">{text}</p></article>}
