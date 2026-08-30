import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, UserRound, Users } from "lucide-react";
import ScheduleAttendance from "@/app/components/ScheduleAttendance";
import { schedulePhase } from "@/lib/schedule-phases";

export type ScheduleItem = { id: number; author_id?: string; author_name?: string; title: string; details: string | null; location: string | null; starts_at: string; ends_at: string | null; all_day?: boolean; training_phase?: string; schedule_type: string; audience: string; program_class: string | null; registration_enabled: boolean; registration_opens_at: string | null; registration_deadline: string | null; personal?: boolean };
export type CoachAttendanceMember = { id: string; name: string; programClass: string | null; status: string; comment: string | null };
export type CoachAttendanceRoster = { attending: CoachAttendanceMember[]; absent: CoachAttendanceMember[]; undecided: CoachAttendanceMember[]; unanswered: CoachAttendanceMember[] };

const typeLabels: Record<string, string> = { practice: "練習", competition: "試合・大会", measurement: "測定", other: "その他" };
const japanTimeZone = "Asia/Tokyo";
function scheduleTime(date: Date) { return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: japanTimeZone }); }
function scheduleDate(date: Date) { return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", timeZone: japanTimeZone }); }

function RosterGroup({ label, members, tone }: { label: string; members: CoachAttendanceMember[]; tone: string }) {
  return <div className="rounded-xl border border-white/[0.08] bg-black/20 p-3"><div className="flex items-center justify-between gap-2"><strong className={`text-xs ${tone}`}>{label}</strong><span className="text-xs font-black text-white/45">{members.length}名</span></div>{members.length ? <ul className="mt-2 space-y-1.5">{members.map((member) => <li key={member.id} className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs"><span className="font-bold text-white/80">{member.name}<small className="ml-2 font-normal text-white/35">{member.programClass ?? "クラス未設定"}</small></span>{member.comment ? <span className="text-white/45">{member.comment}</span> : null}</li>)}</ul> : <p className="mt-2 text-xs text-white/25">該当者はいません</p>}</div>;
}

export function CoachAttendanceList({ roster }: { roster: CoachAttendanceRoster }) {
  const total = roster.attending.length + roster.absent.length + roster.undecided.length + roster.unanswered.length;
  return <details className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] open:bg-sky-500/[0.09]"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3"><span className="inline-flex items-center gap-2 text-xs font-black text-sky-300"><Users size={15}/>参加者・出欠を確認</span><span className="text-xs text-white/50"><b className="text-emerald-300">参加 {roster.attending.length}名</b> ／ 全{total}名</span></summary><div className="grid gap-2 border-t border-sky-500/15 p-3 sm:grid-cols-2"><RosterGroup label="参加" members={roster.attending} tone="text-emerald-300"/><RosterGroup label="未定" members={roster.undecided} tone="text-amber-300"/><RosterGroup label="欠席" members={roster.absent} tone="text-red-300"/><RosterGroup label="未回答" members={roster.unanswered} tone="text-white/55"/></div></details>;
}

export function ScheduleCard({ item, coachAttendanceRoster, showAuthor = false }: { item: ScheduleItem; coachAttendanceRoster?: CoachAttendanceRoster; showAuthor?: boolean }) {
  const start = new Date(item.starts_at);
  const end = item.ends_at ? new Date(item.ends_at) : null;
  const phase = schedulePhase(item.training_phase);
  return <article className="flex gap-4 py-4 first:pt-0 last:pb-0">
    <div className="w-14 shrink-0 rounded-xl bg-orange-500/10 py-2 text-center"><strong className="block text-xl text-orange-400">{start.toLocaleDateString("ja-JP", { day: "numeric", timeZone: japanTimeZone })}</strong><span className="text-[10px] font-bold text-white/45">{start.toLocaleDateString("ja-JP", { month: "short", weekday: "short", timeZone: japanTimeZone })}</span></div>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{item.title}</strong><span className="rounded-full border border-orange-500/25 px-2 py-0.5 text-[10px] font-bold text-orange-300">{item.personal ? "個人予定" : typeLabels[item.schedule_type] ?? "予定"}</span>{phase.value !== "normal" ? <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${phase.badge}`}>{phase.label}</span> : null}{!item.personal ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.audience === "all" ? "bg-white/10 text-white/60" : "bg-sky-500/15 text-sky-300"}`}>{item.audience === "all" ? "全体対象" : `${item.program_class}対象`}</span> : null}</div>{showAuthor && !item.personal ? <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-violet-300/80"><UserRound size={13}/>作成者：{item.author_name ?? "コーチ名未登録"}</p> : null}<p className="mt-1 text-sm text-white/60">{item.all_day ? "終日" : <>{scheduleTime(start)}{end && end.getTime() > start.getTime() ? `〜${scheduleTime(end)}` : ""}</>}</p>{end && scheduleDate(start) !== scheduleDate(end) ? <p className="mt-1 text-xs font-bold text-orange-300/75">開催期間：{scheduleDate(start)}〜{scheduleDate(end)}</p> : null}{item.location && <p className="mt-1 flex items-center gap-1 text-xs text-white/40"><MapPin size={12} />{item.location}</p>}{!item.personal ? <ScheduleAttendance scheduleId={item.id} scheduleType={item.schedule_type} /> : null}{coachAttendanceRoster ? <CoachAttendanceList roster={coachAttendanceRoster}/> : null}</div>
  </article>;
}

export default function SchedulePanel({ items }: { items: ScheduleItem[] }) {
  return <section className="mt-10 rounded-2xl border border-white/10 bg-[#111] p-5 text-white sm:p-6"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-black"><CalendarDays className="text-orange-400" size={20} />NEXT SCHEDULE</h2></div>{items.length ? <div className="mt-4 divide-y divide-white/10">{items.slice(0, 2).map((item) => <ScheduleCard key={item.id} item={item} />)}</div> : <p className="mt-4 text-sm text-white/40">現在、予定はありません</p>}<Link href="/mypage/my-calendar" className="mt-5 flex items-center justify-center gap-1 border-t border-white/10 pt-4 text-sm font-bold text-orange-400">マイカレンダーをすべて見る<ChevronRight size={15} /></Link></section>;
}
