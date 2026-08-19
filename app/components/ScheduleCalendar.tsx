"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { ScheduleCard, type ScheduleItem } from "@/app/components/SchedulePanel";
import CompetitionApplication, { type CompetitionApplicationItem } from "@/app/components/CompetitionApplication";
import { createClient } from "@/lib/supabase-browser";
import { schedulePhase, schedulePhases } from "@/lib/schedule-phases";

const colors: Record<string, string> = { practice: "bg-orange-400", competition: "bg-red-400", measurement: "bg-sky-400", other: "bg-white/40" };
const labels: Record<string, string> = { all: "すべて", practice: "練習", competition: "試合・大会", measurement: "測定", other: "その他" };
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
function itemDot(item: ScheduleItem) { const phase = schedulePhase(item.training_phase); return phase.value === "normal" ? colors[item.schedule_type] ?? colors.other : phase.dot; }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function startOfMonth(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function scheduleDateKeys(item: ScheduleItem) {
  const start = new Date(item.starts_at);
  const end = item.ends_at ? new Date(item.ends_at) : start;
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = end >= start ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : cursor;
  const keys: string[] = [];
  while (cursor <= last && keys.length < 370) {
    keys.push(dateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

export default function ScheduleCalendar({ items, applications, currentTime, canManage = false, coachId, initialSelectedDate }: { items: ScheduleItem[]; applications: CompetitionApplicationItem[]; currentTime: string; canManage?: boolean; coachId?: string; initialSelectedDate?: string }) {
  const router = useRouter();
  const today = new Date();
  const initialDay = initialSelectedDate ? new Date(`${initialSelectedDate}T00:00:00`) : today;
  const [month, setMonth] = useState(startOfMonth(initialDay)); const [selectedDate, setSelectedDate] = useState(dateKey(initialDay)); const [type, setType] = useState("all"); const [audience, setAudience] = useState("both");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);
  const filtered = useMemo(() => items.filter((item) => !hiddenIds.includes(item.id) && (type === "all" || item.schedule_type === type) && (audience === "both" || item.audience === audience)), [items, type, audience, hiddenIds]);
  const byDate = useMemo(() => filtered.reduce<Record<string, ScheduleItem[]>>((groups, item) => {
    scheduleDateKeys(item).forEach((key) => { (groups[key] ??= []).push(item); });
    return groups;
  }, {}), [filtered]);
  const firstGridDate = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
  const days = Array.from({ length: 42 }, (_, index) => new Date(firstGridDate.getFullYear(), firstGridDate.getMonth(), firstGridDate.getDate() + index));
  const selectedItems = byDate[selectedDate] ?? [];
  const nextCompetition = filtered.find((item) => item.schedule_type === "competition" && new Date(item.starts_at) >= today);
  const competitionDays = nextCompetition ? Math.max(0, Math.ceil((new Date(nextCompetition.starts_at).getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000)) : null;
  function moveMonth(amount: number) { const next = new Date(month.getFullYear(), month.getMonth() + amount, 1); setMonth(next); setSelectedDate(dateKey(next)); }
  function goToday() { setMonth(startOfMonth(today)); setSelectedDate(dateKey(today)); }
  async function removeSchedule(item: ScheduleItem) {
    if (!coachId || item.author_id !== coachId || !confirm(`「${item.title}」を削除しますか？\nこの操作は元に戻せません。`)) return;
    setDeletingId(item.id);
    const supabase = createClient();
    const { data, error } = await supabase.from("schedules").delete().eq("id", item.id).eq("author_id", coachId).select("id").maybeSingle();
    if (error || !data) {
      setDeletingId(null);
      alert(error?.message ?? "予定を削除できませんでした。再読み込みしてもう一度お試しください。");
      return;
    }
    setHiddenIds((current) => [...current, item.id]);
    setDeletingId(null);
    router.refresh();
  }
  return <>
    {nextCompetition && competitionDays !== null && <div className="mt-8 flex items-center gap-4 rounded-2xl border border-red-500/25 bg-red-500/[0.07] p-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-300"><Trophy size={19} /></span><div><span className="text-xs font-bold text-red-300">NEXT COMPETITION</span><strong className="mt-1 block">{nextCompetition.title}まで あと{competitionDays}日</strong></div></div>}
    <section className="mt-8 rounded-2xl border border-white/10 bg-[#111] p-4 text-white sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-black"><CalendarDays className="text-orange-400" />月間カレンダー</h2><button type="button" onClick={goToday} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/60">今日へ戻る</button></div>
      <div className="mt-4 grid grid-cols-2 gap-2"><select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-white/15 bg-[#111] px-3 py-2 text-xs">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-lg border border-white/15 bg-[#111] px-3 py-2 text-xs"><option value="both">全体＋自分のクラス</option><option value="all">全体予定</option><option value="class">クラス予定</option></select></div>
      <div className="mt-5 flex items-center justify-between"><button type="button" onClick={() => moveMonth(-1)} aria-label="前月" className="p-2 text-white/60"><ChevronLeft /></button><strong className="text-lg">{month.getFullYear()}年 {month.getMonth() + 1}月</strong><button type="button" onClick={() => moveMonth(1)} aria-label="翌月" className="p-2 text-white/60"><ChevronRight /></button></div>
      <div className="mt-3 grid text-center text-[10px] font-bold text-white/35" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>{weekdays.map((day, index) => <span key={day} className={index === 0 ? "text-red-300/60" : index === 6 ? "text-sky-300/60" : ""}>{day}</span>)}</div>
      <div className="mt-2 grid gap-1" style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>{days.map((day) => { const key = dateKey(day); const dayItems = byDate[key] ?? []; const inMonth = day.getMonth() === month.getMonth(); const selected = key === selectedDate; const isToday = key === dateKey(today); return <button type="button" key={key} onClick={() => setSelectedDate(key)} className={`h-14 min-w-0 overflow-hidden rounded-lg border p-1 text-left transition sm:h-20 sm:p-2 ${selected ? "border-orange-400 bg-orange-500/10" : "border-white/[0.06] bg-white/[0.015]"} ${inMonth ? "text-white" : "text-white/20"}`}><span className={`text-xs ${isToday ? "grid h-5 w-5 place-items-center rounded-full bg-orange-500 font-black text-black" : ""}`}>{day.getDate()}</span><span className="mt-1 flex flex-wrap gap-1 sm:hidden">{dayItems.slice(0, 3).map((item) => <i key={item.id} className={`block h-1.5 w-1.5 rounded-full ${itemDot(item)}`} />)}</span><span className="mt-1 hidden space-y-0.5 sm:block">{dayItems.slice(0, 2).map((item) => <span key={item.id} className="flex min-w-0 items-center gap-1"><i className={`block h-1.5 w-1.5 shrink-0 rounded-full ${itemDot(item)}`} /><span className="truncate text-[9px] text-white/60">{item.title}</span></span>)}{dayItems.length > 2 && <span className="block text-[9px] text-white/35">＋{dayItems.length - 2}件</span>}</span></button>; })}</div>
      <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-white/45">{Object.entries(labels).filter(([key]) => key !== "all").map(([key, label]) => <span key={key} className="flex items-center gap-1"><i className={`h-2 w-2 rounded-full ${colors[key]}`} />{label}</span>)}</div><div className="mt-2 flex flex-wrap gap-3 border-t border-white/[0.06] pt-2 text-[10px] text-white/45">{schedulePhases.slice(1).map((phase) => <span key={phase.value} className="flex items-center gap-1"><i className={`h-2 w-2 rounded-full ${phase.dot}`} />{phase.label}</span>)}</div>
    </section>
    <section className="mt-5 rounded-2xl border border-white/10 bg-[#111] p-5 text-white sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-black">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" })}の予定</h2>{canManage ? <Link href={`/mypage/schedules?newDate=${selectedDate}#schedule-management`} className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-black text-black"><Plus size={15}/>この日に追加</Link> : null}</div>{selectedItems.length ? <div className="mt-4 divide-y divide-white/10">{selectedItems.map((item) => <div key={item.id} className="pb-4"><ScheduleCard item={item} />{canManage && item.author_id === coachId ? <div className="mb-3 ml-[72px] flex flex-wrap gap-2"><Link href={`/mypage/schedules?edit=${item.id}#schedule-management`} className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/35 px-3 py-2 text-xs font-bold text-orange-300"><Pencil size={14}/>この予定を編集</Link><button type="button" disabled={deletingId === item.id} onClick={() => removeSchedule(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/35 px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-40"><Trash2 size={14}/>{deletingId === item.id ? "削除中…" : "この予定を削除"}</button></div> : null}{item.details && <p className="mb-4 ml-[72px] whitespace-pre-wrap text-sm leading-6 text-white/55">{item.details}</p>}{item.schedule_type === "competition" && item.registration_enabled ? <div className="ml-[72px]"><CompetitionApplication scheduleId={item.id} opensAt={item.registration_opens_at} deadline={item.registration_deadline} currentTime={currentTime} initialApplication={applications.find((application) => application.schedule_id === item.id)}/></div> : null}</div>)}</div> : <p className="mt-4 text-sm text-white/35">この日の予定はありません</p>}</section>
  </>;
}
