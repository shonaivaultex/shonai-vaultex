import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin } from "lucide-react";

export type ScheduleItem = { id: number; title: string; details: string | null; location: string | null; starts_at: string; ends_at: string | null; schedule_type: string; audience: string; program_class: string | null };

const typeLabels: Record<string, string> = { practice: "練習", competition: "大会", measurement: "測定", other: "その他" };
const japanTimeZone = "Asia/Tokyo";
function scheduleTime(date: Date) { return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: japanTimeZone }); }

export function ScheduleCard({ item }: { item: ScheduleItem }) {
  const start = new Date(item.starts_at);
  const end = item.ends_at ? new Date(item.ends_at) : null;
  return <article className="flex gap-4 py-4 first:pt-0 last:pb-0">
    <div className="w-14 shrink-0 rounded-xl bg-orange-500/10 py-2 text-center"><strong className="block text-xl text-orange-400">{start.toLocaleDateString("ja-JP", { day: "numeric", timeZone: japanTimeZone })}</strong><span className="text-[10px] font-bold text-white/45">{start.toLocaleDateString("ja-JP", { month: "short", weekday: "short", timeZone: japanTimeZone })}</span></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{item.title}</strong><span className="rounded-full border border-orange-500/25 px-2 py-0.5 text-[10px] font-bold text-orange-300">{typeLabels[item.schedule_type] ?? "予定"}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.audience === "all" ? "bg-white/10 text-white/60" : "bg-sky-500/15 text-sky-300"}`}>{item.audience === "all" ? "全体対象" : `${item.program_class}対象`}</span></div><p className="mt-1 text-sm text-white/60">{scheduleTime(start)}{end && end.getTime() > start.getTime() ? `〜${scheduleTime(end)}` : ""}</p>{item.location && <p className="mt-1 flex items-center gap-1 text-xs text-white/40"><MapPin size={12} />{item.location}</p>}</div>
  </article>;
}

export default function SchedulePanel({ items }: { items: ScheduleItem[] }) {
  return <section className="mt-10 rounded-2xl border border-white/10 bg-[#111] p-5 text-white sm:p-6"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-black"><CalendarDays className="text-orange-400" size={20} />NEXT SCHEDULE</h2></div>{items.length ? <div className="mt-4 divide-y divide-white/10">{items.slice(0, 2).map((item) => <ScheduleCard key={item.id} item={item} />)}</div> : <p className="mt-4 text-sm text-white/40">現在、予定はありません</p>}<Link href="/mypage/schedules" className="mt-5 flex items-center justify-center gap-1 border-t border-white/10 pt-4 text-sm font-bold text-orange-400">スケジュールをすべて見る<ChevronRight size={15} /></Link></section>;
}
