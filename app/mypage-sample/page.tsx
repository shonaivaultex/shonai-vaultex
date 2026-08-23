import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  MessageCircle,
  NotebookPen,
  ScanLine,
  Sparkles,
  Target,
  Trophy,
  Video,
} from "lucide-react";
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
  { id: 8, category: "立幅跳", value: 2.74, date: "2026-04-20", awareness_categories: ["力感"], record_kind: "control-test" },
  { id: 9, category: "立幅跳", value: 2.83, date: "2026-07-20", awareness_categories: ["動作"], record_kind: "control-test" },
  { id: 10, category: "立五段跳", value: 13.68, date: "2026-04-20", awareness_categories: ["リズム"], record_kind: "control-test" },
  { id: 11, category: "立五段跳", value: 14.12, date: "2026-07-20", awareness_categories: ["リズム", "感覚"], record_kind: "control-test" },
];

const explanations = {
  profile: ["プロフィールと1週間予定", "所属クラス・専門種目と、これから1週間のクラブ予定を一目で確認できます。"],
  calendar: ["マイカレンダー", "参加予定、個人練習、練習日誌、記録、動画を日付ごとにまとめます。"],
  video: ["動画を送る", "記録がない日でも、動画だけをコーチに送り、見てほしい動きを相談できます。"],
  schedule: ["全体スケジュール", "クラブ全体・クラス別の予定を確認。「参加」を押すとマイカレンダーへ反映されます。"],
  ai: ["VAULTEX AI", "競技の悩みやシステムの使い方を整理し、次に見る機能やコーチ相談へ案内します。"],
  scan: ["VAULTEX ATHLETE SCAN", "CONTROL TESTから身体能力の現在地と変化を確認。継続測定でプロフィールが育ちます。"],
  growth: ["月間成長レポート", "今月のベスト、PB、意識傾向、次に確認したいことを自動で整理します。"],
  news: ["NEWS", "予定変更、コーチからの返信、重要なお知らせをまとめて確認できます。"],
  report: ["全期間の成長レポート", "種目ごとの記録推移や成長幅を、累計・シーズン別に振り返れます。"],
} as const;

export default function MyPageSample() {
  return (
    <main className="min-h-screen bg-[#08090b] px-3 pb-24 pt-20 text-white">
      <div className="mx-auto max-w-[1460px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-white/55 transition hover:text-orange-400">
            <ArrowLeft size={16} />ホームへ戻る
          </Link>
          <span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-2 text-[10px] font-black tracking-[.14em] text-orange-300">PUBLIC DEMO / 架空データ</span>
        </div>

        <header className="mb-5 mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-black tracking-[.28em] text-orange-400">ATHLETE DASHBOARD</p>
            <h1 className="mt-1 text-4xl font-black tracking-[-.05em]">MY PAGE</h1>
          </div>
          <span className="text-xs font-black tracking-[.18em] text-white/15">SHONAI VAULTEX</span>
        </header>

        <div className="mb-5 flex items-center justify-between rounded-2xl border border-orange-500/35 bg-orange-500/[.06] px-4 py-3 text-xs">
          <span className="flex items-center gap-2 font-black"><Sparkles size={16} className="text-orange-400" />各エリアの使い方</span>
          <span className="text-right text-white/40">PCはカーソル、スマホは「？」をタップ</span>
        </div>

        <section className="grid overflow-hidden rounded-[30px] border border-white/10 bg-[#101113]">
          <Explained title={explanations.profile[0]} text={explanations.profile[1]} className="min-h-[450px] border-b border-white/10 p-6">
            <div className="flex items-center gap-2"><span className="rounded-full border border-orange-500/50 bg-orange-500/10 px-4 py-2 text-xs font-black text-orange-300">エリート</span><span className="text-xs text-white/35">ATHLETE</span></div>
            <h2 className="mt-7 text-4xl font-black tracking-[-.05em]">VAULTEX 選手</h2>
            <p className="mt-2 text-base text-white/40">走幅跳・100m</p>
            <div className="mt-20">
              <div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-300">CLUB SCHEDULE</p><strong className="mt-1 block text-sm">これから1週間</strong></div><span className="text-xs text-white/35">全体を見る <ChevronRight size={13} className="inline" /></span></div>
              <div className="grid grid-cols-4 gap-2"><WeekDay day="金" date="21" label="東北選手権" active/><WeekDay day="土" date="22" label="東北選手権"/><WeekDay day="日" date="23" label="東北選手権"/><WeekDay day="月" date="24"/><WeekDay day="火" date="25"/><WeekDay day="水" date="26"/><WeekDay day="木" date="27"/></div>
            </div>
          </Explained>

          <Explained title={explanations.calendar[0]} text={explanations.calendar[1]} className="min-h-[450px] bg-[radial-gradient(circle_at_100%_0%,rgba(249,115,22,.2),transparent_55%)] p-5">
            <div className="flex items-center justify-between gap-3 pr-10"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><NotebookPen size={20}/></span><div><p className="text-[10px] font-black tracking-[.2em] text-emerald-300">MY CALENDAR</p><strong className="mt-1 block">今日を確認・記録する</strong></div></div><span className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-2 text-[10px] font-black text-orange-300">出欠未回答 3件</span></div>
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-black/20 p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[.16em] text-emerald-300">TODAY&apos;S TRAINING</p><strong className="mt-1 block">今日の練習</strong></div><span className="rounded-full bg-white/[.06] px-3 py-1 text-xs font-black text-white/45">1件</span></div><div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[.08] bg-black/25 px-4 py-3"><span className="h-2 w-2 rounded-full bg-emerald-400"/><span className="min-w-0 flex-1"><strong className="block truncate text-sm">試合前日練習</strong><span className="text-[10px] text-white/40">終日 ・ あづま</span></span><span className="rounded-full bg-white/[.06] px-2 py-1 text-[9px] text-white/40">個人予定</span></div></div>
            <div className="mt-4 grid gap-3"><DashboardTile eyebrow="NEXT" title="東北選手権" meta="8/21(金) ・ あづま総合運動公園"/><DashboardTile eyebrow="TODAY'S LOG" title="今日の練習を記録" accent/></div>
            <div className="mt-4 flex items-center justify-between text-xs text-white/40"><span className="flex items-center gap-2"><Target size={14} className="text-orange-400"/>次の目標：東北選手権</span><span>2026/08/22</span></div>
            <div className="mt-6 grid grid-cols-2 border-t border-white/10"><Metric label="THIS MONTH" value="7 RECORDS"/><Metric label="TO CHECK" value="0 ITEMS"/></div>
          </Explained>
        </section>

        <section className="mt-5 grid gap-3 grid-cols-1">
          <Explained title={explanations.video[0]} text={explanations.video[1]} className="rounded-2xl border border-white/10 bg-[#111214] p-5"><NavCard icon={<Video size={20}/>} title="動画を送る" color="text-cyan-300"/></Explained>
          <Explained title={explanations.schedule[0]} text={explanations.schedule[1]} className="rounded-2xl border border-white/10 bg-[#111214] p-5"><NavCard icon={<CalendarDays size={20}/>} title="全体スケジュール" color="text-orange-400"/></Explained>
          <Explained title={explanations.ai[0]} text={explanations.ai[1]} className="rounded-2xl border border-white/10 bg-[#111214] p-5"><NavCard icon={<MessageCircle size={20}/>} title="AIに相談" color="text-orange-400"/></Explained>
        </section>

        <Explained title={explanations.scan[0]} text={explanations.scan[1]} className="mt-5 rounded-[28px] border border-orange-500/45 bg-[#101113] p-6">
          <div className="flex items-start gap-4 pr-10"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-500 text-black"><ScanLine/></span><div><p className="text-[11px] font-black tracking-[.2em] text-orange-400">VAULTEX ATHLETE SCAN</p><h2 className="mt-1 text-xl font-black">身体能力の現在地を知る</h2><p className="mt-2 text-sm leading-6 text-white/45">CONTROL TESTから6能力・3特性・現在のATHLETE TYPEを確認します。</p></div></div>
          <div className="mt-6 rounded-xl bg-orange-500 px-4 py-4 text-center text-sm font-black text-black">＋ 最初のVAULTEX SCANを記録</div>
          <p className="mt-3 text-center text-xs font-bold text-white/40">CONTROL TESTの履歴・詳細 <ChevronRight size={13} className="inline"/></p>
        </Explained>

        <section className="mt-5 grid gap-5">
          <Explained title={explanations.growth[0]} text={explanations.growth[1]} className="rounded-[28px] border border-orange-500/35 bg-[#111214] p-5">
            <div className="flex items-center justify-between pr-10"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">MONTHLY GROWTH</p><h2 className="mt-1 text-xl font-black">8月の成長レポート</h2></div><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><BarChart3/></span></div>
            <div className="mt-6 rounded-2xl border border-orange-500/30 bg-black/20 p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black tracking-[.18em] text-orange-300">MONTH&apos;S HIGHLIGHT</p><h3 className="mt-2 text-lg font-black">走幅跳 今月ベスト</h3><strong className="mt-2 block text-4xl">6.48m</strong></div><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500 text-black"><Trophy size={20}/></span></div><p className="mt-4 text-sm text-white/55">7月の平均より12cm前進しました。</p><p className="mt-3 text-sm font-bold text-orange-200"><Sparkles size={14} className="mr-1 inline"/>よく使った意識は「リズム」</p></div>
            <div className="mt-3 grid gap-3"><DashboardTile eyebrow="PB CHASE" title="100m 今月PBに到達" accent/><DashboardTile eyebrow="NEXT STEP" title="走幅跳をあと1件記録すると安定度も確認できます"/></div>
          </Explained>
          <Explained title={explanations.news[0]} text={explanations.news[1]} className="rounded-[28px] border border-white/10 bg-[#111214] p-5">
            <div className="flex items-center gap-2 pr-10"><Bell size={18} className="text-orange-400"/><h2 className="font-black">NEWS</h2></div>
            <div className="mt-5 divide-y divide-white/10"><NewsItem title="新しい予定：酒田スプリント" date="2026/10/25"/><NewsItem title="コーチから返信が届きました" date="2026/08/20"/><NewsItem title="CONTROL TEST測定会のお知らせ" date="2026/08/18"/></div>
            <p className="mt-5 text-center text-xs font-black text-orange-400">NEWSをすべて見る <ChevronRight size={13} className="inline"/></p>
          </Explained>
        </section>

        <Explained title={explanations.report[0]} text={explanations.report[1]} className="mt-5 rounded-[28px] border border-orange-500/30 bg-[#0e0f11] p-5">
          <div className="mb-7 pr-10"><p className="text-[10px] font-black tracking-[.2em] text-orange-400">GROWTH REPORT SAMPLE</p><h2 className="mt-1 text-2xl font-black">全期間の成長レポート</h2></div>
          <OverallGrowthReport records={sampleRecords}/>
        </Explained>

        <div className="mt-10 rounded-3xl bg-orange-500 p-6 text-black"><div><p className="text-[10px] font-black tracking-[.2em]">START YOUR JOURNEY</p><h2 className="mt-2 text-2xl font-black">次は、あなたの成長を記録しよう。</h2></div><Link href="https://forms.gle/9KLAq5PSkBudhbyL9" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-4 text-sm font-black text-white">無料体験を予約する<ArrowRight size={17}/></Link></div>
      </div>
    </main>
  );
}

function Explained({ title, text, children, className = "" }: { title: string; text: string; children: ReactNode; className?: string }) {
  return <div className={`group/explain relative ${className}`}>
    {children}
    <button type="button" aria-label={`${title}の説明を見る`} className="absolute right-3 top-3 z-20 grid h-7 w-7 place-items-center rounded-full border border-orange-400/45 bg-black/70 text-xs font-black text-orange-300 transition hover:bg-orange-500 hover:text-black focus:outline-none focus:ring-2 focus:ring-orange-300">?</button>
    <div className="pointer-events-none absolute inset-x-3 top-12 z-30 translate-y-2 rounded-2xl border border-orange-400/50 bg-[#090a0c]/95 p-4 opacity-0 shadow-2xl shadow-black/60 backdrop-blur-md transition duration-200 group-hover/explain:translate-y-0 group-hover/explain:opacity-100 group-focus-within/explain:translate-y-0 group-focus-within/explain:opacity-100">
      <p className="text-[9px] font-black tracking-[.18em] text-orange-400">この機能について</p><strong className="mt-1 block text-sm text-white">{title}</strong><p className="mt-2 text-xs leading-6 text-white/65">{text}</p>
    </div>
  </div>;
}

function WeekDay({day,date,label,active=false}:{day:string;date:string;label?:string;active?:boolean}) { return <div className={`min-w-0 rounded-xl border px-2 py-3 ${active ? "border-orange-400/60 bg-orange-400/10" : "border-white/[.08] bg-black/15"}`}><span className="text-[9px] font-black text-white/35">{day}</span><strong className="mt-1 block">{date}日</strong>{label ? <><span className="mt-3 block h-1.5 w-1.5 rounded-full bg-orange-400"/><span className="mt-1 block truncate text-[8px] text-white/55">{label}</span></> : <span className="mt-3 block text-[8px] text-white/20">予定なし</span>}</div> }
function DashboardTile({eyebrow,title,meta,accent=false}:{eyebrow:string;title:string;meta?:string;accent?:boolean}) { return <div className={`rounded-xl border p-4 ${accent ? "border-emerald-400/25 bg-emerald-400/[.05]" : "border-white/10 bg-black/20"}`}><span className={`text-[9px] font-black tracking-wide ${accent ? "text-emerald-300" : "text-white/30"}`}>{eyebrow}</span><strong className="mt-1 block text-sm">{title}</strong>{meta && <span className="mt-1 block text-[10px] text-white/40">{meta}</span>}</div> }
function Metric({label,value}:{label:string;value:string}) { return <div className="border-r border-white/10 px-3 pt-5 last:border-r-0"><span className="block text-[9px] font-black tracking-[.16em] text-white/25">{label}</span><strong className="mt-2 block text-2xl">{value}</strong></div> }
function NavCard({icon,title,color}:{icon:ReactNode;title:string;color:string}) { return <div className="flex items-center justify-between gap-3 pr-8"><span className="flex items-center gap-3"><span className={color}>{icon}</span><strong>{title}</strong></span><ChevronRight size={17} className="text-white/30"/></div> }
function NewsItem({title,date}:{title:string;date:string}) { return <div className="flex gap-3 py-4"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-500/10 text-orange-400"><Bell size={13}/></span><span><strong className="block text-sm leading-5">{title}</strong><span className="mt-1 block text-xs text-white/35">{date}</span></span></div> }
