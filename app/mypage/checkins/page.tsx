import Link from "next/link";
import { ArrowLeft, CalendarDays, HeartPulse, MoonStar, Smile } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

type CheckinRow = {
  id: number;
  checkin_date: string;
  condition_score: number;
  fatigue_score: number;
  mood_score: number;
  note: string | null;
};

const metrics = [
  { key: "condition_score" as const, label: "体調", icon: HeartPulse, color: "bg-emerald-400", text: "text-emerald-300" },
  { key: "fatigue_score" as const, label: "疲労", icon: MoonStar, color: "bg-amber-400", text: "text-amber-300" },
  { key: "mood_score" as const, label: "気分", icon: Smile, color: "bg-sky-400", text: "text-sky-300" },
];

function average(rows: CheckinRow[], key: keyof Pick<CheckinRow, "condition_score" | "fatigue_score" | "mood_score">) {
  if (!rows.length) return "—";
  return (rows.reduce((sum, row) => sum + row[key], 0) / rows.length).toFixed(1);
}

export default async function CheckinHistoryPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;
  if (!userId) redirect("/login?next=/mypage/checkins");

  const { data } = await supabase
    .from("daily_checkins")
    .select("id,checkin_date,condition_score,fatigue_score,mood_score,note")
    .eq("user_id", userId)
    .order("checkin_date", { ascending: false })
    .limit(90);
  const rows = (data ?? []) as CheckinRow[];
  const recent = rows.slice(0, 7);

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 pb-24 pt-32 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60"><ArrowLeft size={16}/>MY PAGE</Link>
        <header className="mt-10 border-l-2 border-orange-500 pl-5">
          <p className="text-xs font-black tracking-[0.22em] text-orange-400">CONDITION HISTORY</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">状態の履歴</h1>
          <p className="mt-3 leading-7 text-white/55">毎日の体調・疲労・気分を振り返り、自分の変化を確認できます。</p>
        </header>

        {rows.length ? <>
          <section className="mt-10 rounded-2xl border border-white/10 bg-[#111] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">RECENT AVERAGE</p><h2 className="mt-1 text-lg font-black">直近{recent.length}回の平均</h2></div><span className="text-xs text-white/35">5段階</span></div>
            <div className="mt-5 grid grid-cols-3 gap-3">{metrics.map((metric) => { const Icon = metric.icon; return <div key={metric.key} className="rounded-xl border border-white/[.08] bg-white/[.025] p-3 text-center"><Icon size={18} className={`mx-auto ${metric.text}`}/><strong className="mt-2 block text-2xl">{average(recent, metric.key)}</strong><span className="text-[10px] font-bold text-white/40">{metric.label}</span></div>; })}</div>
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between border-b border-white/15 pb-4"><h2 className="flex items-center gap-2 text-lg font-black"><CalendarDays size={19} className="text-orange-400"/>記録一覧</h2><span className="text-xs font-bold text-white/35">{rows.length}日分</span></div>
            <div className="divide-y divide-white/10">{rows.map((row) => <article key={row.id} className="py-5"><div className="flex flex-wrap items-center justify-between gap-3"><time className="font-black">{new Date(`${row.checkin_date}T12:00:00+09:00`).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" })}</time><div className="flex gap-3 text-xs font-black">{metrics.map((metric) => <span key={metric.key} className={metric.text}>{metric.label} {row[metric.key]}</span>)}</div></div><div className="mt-3 grid gap-2">{metrics.map((metric) => <div key={metric.key} className="flex items-center gap-3"><span className="w-8 text-[10px] font-bold text-white/35">{metric.label}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.07]"><span className={`block h-full rounded-full ${metric.color}`} style={{ width: `${row[metric.key] * 20}%` }}/></span></div>)}</div>{row.note ? <p className="mt-3 rounded-xl bg-white/[.035] px-4 py-3 text-sm leading-6 text-white/60">{row.note}</p> : null}</article>)}</div>
          </section>
        </> : <div className="mt-10 rounded-2xl border border-white/10 bg-[#111] px-6 py-16 text-center"><CalendarDays size={36} className="mx-auto text-white/25"/><p className="mt-5 font-black">まだ記録がありません。</p><p className="mt-2 text-sm text-white/40">マイページから今日の状態を記録してみましょう。</p><Link href="/mypage#daily-checkin" className="mt-6 inline-flex rounded-full bg-orange-500 px-5 py-3 text-xs font-black text-black">今日の状態を記録</Link></div>}
      </div>
    </main>
  );
}
