"use client";

import { FormEvent, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Flag, Link2, MessageCircleQuestion, Pencil, Play, Plus, Target, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AwarenessTagSelector from "@/app/components/AwarenessTagSelector";
import { createClient } from "@/lib/supabase-browser";
import { createVideoPath, formatVideoSize, PERFORMANCE_VIDEO_BUCKET, uploadVideoWithProgress, validateVideo } from "@/lib/performance-awareness";
import { schedulePhase, schedulePhases } from "@/lib/schedule-phases";
import type { SchedulePeriod } from "@/lib/schedule-periods";
import { eventNamesByKind, unitMap } from "@/lib/performance-events";
import FeedbackRequestButton from "@/app/components/FeedbackRequestButton";
import CalendarSyncButton from "@/app/components/CalendarSyncButton";

type Entry = { id: number; user_id: string; schedule_id: number | null; entry_date: string; starts_at: string | null; ends_at: string | null; all_day: boolean; entry_type: string; title: string; location: string | null; journal: string | null; awareness_categories: string[]; record_value: number | null; record_unit: string | null; performance_record_id: number | null; video_path: string | null; video_url: string | null; color: string };
type ClubSchedule = { id: number; title: string; details: string | null; location: string | null; starts_at: string; ends_at: string | null; all_day: boolean; schedule_type: string };
type FeedbackRequest = { id: number; request_type: string; message: string | null; priority: string; status: string };
type PerformanceRecord = { id: number; category: string; value: number; date: string; record_kind: string | null; awareness_categories: string[] | null; awareness_note: string | null; video_path: string | null; video_url: string | null; feedback_request?: FeedbackRequest | null };
type DisplayItem = { key: string; date: string; title: string; color: string; entry?: Entry; schedule?: ClubSchedule; performance?: PerformanceRecord; active: boolean };
type CalendarGoal = { id: number; user_id: string; title: string; target_date: string; event_name: string | null; target_value: number | null; target_unit: string | null; status: string; completed_at: string | null; schedule_id?: number | null; calendar_entry_id?: number | null; outcome?: string | null; result_value?: number | null; result_unit?: string | null; reflection?: string | null; next_action?: string | null };

const colors: Record<string, { dot: string; border: string; label: string }> = {
  orange: { dot: "bg-orange-400", border: "border-orange-500/40", label: "オレンジ" }, sky: { dot: "bg-sky-400", border: "border-sky-500/40", label: "ブルー" }, emerald: { dot: "bg-emerald-400", border: "border-emerald-500/40", label: "グリーン" }, violet: { dot: "bg-violet-400", border: "border-violet-500/40", label: "パープル" }, rose: { dot: "bg-rose-400", border: "border-rose-500/40", label: "レッド" }, slate: { dot: "bg-slate-400", border: "border-slate-500/40", label: "グレー" },
};
const entryTypes = { school_practice: "学校練習", personal_training: "自主練習", competition: "試合", rest: "休養", other: "その他", club_schedule: "クラブ予定" } as const;
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
function localDate(date = new Date()) { return date.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }); }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function timeValue(value: string | null | undefined) { return value ? new Date(value).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Tokyo" }) : ""; }
function entryTimeLabel(entry: Entry | undefined) { if (!entry || entry.all_day) return null; const start = timeValue(entry.starts_at); const end = timeValue(entry.ends_at); return start ? `${start}${end ? `〜${end}` : ""}` : null; }
function scheduleDates(schedule: ClubSchedule) { const start = new Date(schedule.starts_at); const end = schedule.ends_at ? new Date(schedule.ends_at) : start; const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate()); const last = new Date(end.getFullYear(), end.getMonth(), end.getDate()); const result: string[] = []; while (cursor <= last && result.length < 370) { result.push(dateKey(cursor)); cursor.setDate(cursor.getDate() + 1); } return result; }

export default function MyCalendar({ userId, initialEntries, schedules, activeScheduleIds, records, periods, initialGoal, initialSelectedDate }: { userId: string; initialEntries: Entry[]; schedules: ClubSchedule[]; activeScheduleIds: number[]; records: PerformanceRecord[]; periods: SchedulePeriod[]; initialGoal: CalendarGoal | null; initialSelectedDate?: string }) {
  const router = useRouter(); const today = new Date();
  const selectedDateValue = initialSelectedDate ? new Date(`${initialSelectedDate}T00:00:00`) : today;
  const [month, setMonth] = useState(new Date(selectedDateValue.getFullYear(), selectedDateValue.getMonth(), 1)); const [selectedDate, setSelectedDate] = useState(initialSelectedDate ?? localDate());
  const [entries, setEntries] = useState(initialEntries); const [editing, setEditing] = useState<Entry | null>(null); const [linkedSchedule, setLinkedSchedule] = useState<ClubSchedule | null>(null); const [open, setOpen] = useState(false);
  const [performanceRecords, setPerformanceRecords] = useState(records);
  const [goal, setGoal] = useState<CalendarGoal | null>(initialGoal); const [goalOpen, setGoalOpen] = useState(false); const [reviewOpen, setReviewOpen] = useState(false);
  const [mobileCalendarView, setMobileCalendarView] = useState<"week" | "month">("week");
  const activeIds = useMemo(() => new Set(activeScheduleIds), [activeScheduleIds]);
  const displayItems = useMemo(() => {
    const result: DisplayItem[] = entries.filter((entry) => !entry.schedule_id).map((entry) => ({ key: `entry-${entry.id}`, date: entry.entry_date, title: entry.title, color: entry.color, entry, active: true }));
    schedules.forEach((schedule) => { const entry = entries.find((item) => item.schedule_id === schedule.id); const active = activeIds.has(schedule.id); if (!active && !entry?.journal && !entry?.video_path && !entry?.record_value && !entry?.performance_record_id) return; scheduleDates(schedule).forEach((date) => result.push({ key: `schedule-${schedule.id}-${date}`, date, title: schedule.title, color: active ? "orange" : "slate", entry, schedule, active })); });
    performanceRecords.forEach((performance) => result.push({ key: `performance-${performance.id}`, date: performance.date, title: performance.category, color: performance.record_kind === "athletics" ? "violet" : performance.record_kind === "control-test" ? "sky" : "emerald", performance, active: true }));
    return result;
  }, [entries, schedules, activeIds, performanceRecords]);
  const byDate = useMemo(() => displayItems.reduce<Record<string, DisplayItem[]>>((all, item) => { (all[item.date] ??= []).push(item); return all; }, {}), [displayItems]);
  const periodForDate = (key: string) => periods.find((period) => period.starts_on <= key && period.ends_on >= key);
  const first = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay()); const days = Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), first.getDate() + index));
  const selectedItems = byDate[selectedDate] ?? [];
  const selectedDay = new Date(`${selectedDate}T00:00:00`);
  const mobileWeekStart = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate() - selectedDay.getDay());
  const mobileWeekDays = Array.from({ length: 7 }, (_, index) => new Date(mobileWeekStart.getFullYear(), mobileWeekStart.getMonth(), mobileWeekStart.getDate() + index));
  function startNew() { setEditing(null); setLinkedSchedule(null); setOpen(true); }
  function startNewForDate(key: string) { setSelectedDate(key); }
  function moveWeek(amount: number) { const next = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate() + amount * 7); setSelectedDate(dateKey(next)); setMonth(new Date(next.getFullYear(), next.getMonth(), 1)); }
  function moveMonth(amount: number) { const next = new Date(month.getFullYear(), month.getMonth() + amount, 1); setMonth(next); setSelectedDate(dateKey(next)); }
  function editItem(item: DisplayItem) { setEditing(item.entry ?? null); setLinkedSchedule(item.schedule ?? null); setOpen(true); }
  function close() { setOpen(false); setEditing(null); setLinkedSchedule(null); }
  async function remove(entry: Entry) { if (!confirm(entry.schedule_id ? "この予定の日誌・動画・個人記録を削除しますか？\nクラブ予定と参加登録は残ります。" : `「${entry.title}」を削除しますか？`)) return; const supabase = createClient(); const { error } = await supabase.from("personal_calendar_entries").delete().eq("id", entry.id).eq("user_id", userId); if (error) return alert(error.message); if (entry.video_path && !entry.performance_record_id) await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([entry.video_path]); setEntries((items) => items.filter((item) => item.id !== entry.id)); }
  async function removePerformance(record: PerformanceRecord) {
    if (!confirm(`「${record.category} ${record.value}${unitMap[record.category] ?? ""}」を削除しますか？\nこの操作は元に戻せません。`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("performance_records").delete().eq("id", record.id).eq("user_id", userId);
    if (error) return alert(`記録を削除できませんでした：${error.message}`);
    setPerformanceRecords((items) => items.filter((item) => item.id !== record.id));
    if (record.video_path) {
      const { error: storageError } = await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([record.video_path]);
      if (storageError) alert("記録は削除しましたが、動画ファイルの削除に失敗しました。管理者へお知らせください。");
    }
    router.refresh();
  }
  async function removePeriod(period: SchedulePeriod) { if (!confirm(`「${period.label || schedulePhase(period.phase).label}」の期間カラーを削除しますか？`)) return; const { error } = await createClient().from("schedule_periods").delete().eq("id", period.id).eq("author_id", userId); if (error) return alert(error.message); router.refresh(); }
  const goalDays = goal ? Math.ceil((new Date(`${goal.target_date}T00:00:00`).getTime() - new Date(`${localDate()}T00:00:00`).getTime()) / 86400000) : null;
  return <div className="mt-8 grid items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
    <section className="rounded-[26px] border border-orange-500/35 bg-[linear-gradient(135deg,rgba(249,115,22,.14),rgba(17,17,17,.96)_55%)] p-5 sm:p-6 xl:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex min-w-0 items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-black"><Target size={23}/></span><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">NEXT TARGET</p>{goal ? <><h2 className="mt-1 text-xl font-black sm:text-2xl">{goal.title}</h2><p className="mt-1 text-sm text-white/55">{goal.target_date.replaceAll("-", "/")}{goal.event_name ? ` ・ ${goal.event_name}` : ""}{goal.target_value ? ` ・ ${goal.target_value}${goal.target_unit ?? ""}` : ""}</p><p className="mt-2 text-sm font-black text-orange-300">{goalDays !== null && goalDays > 0 ? `目標まであと${goalDays}日` : goalDays === 0 ? "目標当日" : "結果を振り返って次の目標へ"}</p></> : <><h2 className="mt-1 text-xl font-black">次の目標を1つ決める</h2><p className="mt-1 text-sm text-white/45">大会・種目・目標記録を決めると、カレンダーに表示されます。</p></>}</div></div><div className="flex flex-wrap gap-2"><button onClick={() => setGoalOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black"><Flag size={16}/>{goal ? "目標を変更" : "次の目標を設定"}</button>{goal ? <button onClick={() => setReviewOpen(true)} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/60">目標を振り返る</button> : null}</div></div>
    </section>
    <section className="rounded-[26px] border border-white/10 bg-[#111] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-xl font-black"><CalendarDays className="text-orange-400"/>マイカレンダー</h2><div className="flex flex-wrap gap-2"><CalendarSyncButton/><button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black"><Plus size={17}/>個人予定を追加</button></div></div>
      <div className="mt-6 flex items-center justify-between"><button onClick={() => moveMonth(-1)} className="p-2 text-white/55" aria-label="前月"><ChevronLeft/></button><strong>{month.getFullYear()}年 {month.getMonth() + 1}月</strong><button onClick={() => moveMonth(1)} className="p-2 text-white/55" aria-label="翌月"><ChevronRight/></button></div>
      <div className="mt-3 grid grid-cols-2 rounded-xl border border-white/10 bg-black/25 p-1 lg:hidden">
        <button type="button" onClick={() => setMobileCalendarView("week")} className={`rounded-lg px-3 py-2 text-xs font-black transition ${mobileCalendarView === "week" ? "bg-orange-500 text-black" : "text-white/45"}`}>週間</button>
        <button type="button" onClick={() => setMobileCalendarView("month")} className={`rounded-lg px-3 py-2 text-xs font-black transition ${mobileCalendarView === "month" ? "bg-orange-500 text-black" : "text-white/45"}`}>1ヶ月</button>
      </div>
      {mobileCalendarView === "week" ? <div className="mt-4 lg:hidden">
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-2 py-2">
          <button type="button" onClick={() => moveWeek(-1)} aria-label="前の週" className="rounded-lg p-2 text-white/55"><ChevronLeft size={19}/></button>
          <div className="text-center">
            <p className="text-[9px] font-black tracking-[.16em] text-orange-400">1週間の予定</p>
            <strong className="mt-0.5 block text-sm">{mobileWeekStart.getMonth() + 1}/{mobileWeekStart.getDate()}〜{mobileWeekDays[6].getMonth() + 1}/{mobileWeekDays[6].getDate()}</strong>
          </div>
          <button type="button" onClick={() => moveWeek(1)} aria-label="次の週" className="rounded-lg p-2 text-white/55"><ChevronRight size={19}/></button>
        </div>
        <div className="mt-3 space-y-2">
          {mobileWeekDays.map((day, index) => {
            const key = dateKey(day);
            const items = byDate[key] ?? [];
            const period = periodForDate(key);
            const theme = schedulePhase(period?.phase);
            const goalDay = goal?.target_date === key;
            const selected = key === selectedDate;
            return <button
              type="button"
              key={key}
              onClick={() => { startNewForDate(key); setMonth(new Date(day.getFullYear(), day.getMonth(), 1)); }}
              aria-label={`${day.getMonth() + 1}月${day.getDate()}日の予定を表示`}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${selected ? "border-orange-400 bg-orange-500/12 ring-1 ring-orange-400/50" : "border-white/10 bg-white/[.025]"}`}
            >
              <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl border ${selected ? "border-orange-400/60 bg-orange-500/15" : "border-white/10 bg-black/25"}`}>
                <span className={`block text-[9px] font-black ${index === 0 ? "text-red-300" : index === 6 ? "text-sky-300" : "text-white/45"}`}>{weekdays[index]}曜</span>
                <strong className="-mt-2 block text-xl leading-none">{day.getDate()}</strong>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-1.5">
                  {goalDay ? <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-1 text-[9px] font-black text-orange-300"><Flag size={10} className="fill-orange-400"/>目標日</span> : null}
                  {period ? <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${theme.badge}`}><i className={`h-1.5 w-1.5 rounded-full ${theme.dot}`}/>{period.label || theme.label}</span> : null}
                </span>
                {items.length > 0 ? <span className="mt-1.5 block space-y-1">{items.slice(0, 2).map((item) => <span key={item.key} className="flex min-w-0 items-center gap-2"><i className={`h-2 w-2 shrink-0 rounded-full ${colors[item.color]?.dot}`}/><span className="truncate text-sm font-bold text-white/80">{item.title}</span></span>)}{items.length > 2 ? <span className="block text-[10px] font-bold text-white/35">ほか{items.length - 2}件</span> : null}</span> : <span className="mt-1.5 block text-xs text-white/30">予定なし</span>}
              </span>
              <ChevronRight size={18} className={selected ? "shrink-0 text-orange-400" : "shrink-0 text-white/20"}/>
            </button>;
          })}
        </div>
      </div> : <div className="mt-4 lg:hidden">
        <div className="grid grid-cols-7 text-center text-[9px] font-black text-white/35">{weekdays.map((day, index) => <span key={day} className={index === 0 ? "text-red-300/70" : index === 6 ? "text-sky-300/70" : ""}>{day}</span>)}</div>
        <div className="mt-2 grid grid-cols-7 gap-1">{days.map((day) => {
          const key = dateKey(day);
          const items = byDate[key] ?? [];
          const period = periodForDate(key);
          const theme = schedulePhase(period?.phase);
          const current = day.getMonth() === month.getMonth();
          const goalDay = goal?.target_date === key;
          const selected = key === selectedDate;
          return <button
            type="button"
            key={key}
            onClick={() => startNewForDate(key)}
            aria-label={`${day.getMonth() + 1}月${day.getDate()}日の予定・練習記録を表示`}
            className={`h-[68px] min-w-0 overflow-hidden rounded-lg border p-1 text-left ${goalDay ? "border-orange-400 bg-orange-500/15 ring-1 ring-orange-400" : selected ? "border-white/45 ring-1 ring-white/25" : "border-white/[.07]"} ${theme.day} ${current ? "text-white" : "text-white/20"}`}
          >
            <span className="flex items-center justify-between"><strong className="text-[10px]">{day.getDate()}</strong>{goalDay ? <Flag size={8} className="fill-orange-400 text-orange-400"/> : period ? <i className={`h-1.5 w-1.5 rounded-full ${theme.dot}`}/> : null}</span>
            {goalDay ? <span className="mt-1 block truncate text-[7px] font-black text-orange-300">目標日</span> : period ? <span className="mt-1 block truncate text-[7px] font-bold opacity-70">{period.label || theme.label}</span> : null}
            {items.slice(0, 2).map((item) => <span key={item.key} className="mt-1 flex min-w-0 items-center gap-1"><i className={`h-1 w-1 shrink-0 rounded-full ${colors[item.color]?.dot}`}/><span className="truncate text-[7px] text-white/55">{item.title}</span></span>)}
          </button>;
        })}</div>
      </div>}
      <div className="mt-4 hidden grid-cols-7 text-center text-[10px] font-black text-white/35 lg:grid">{weekdays.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="mt-2 hidden grid-cols-7 gap-1 lg:grid">{days.map((day) => { const key = dateKey(day); const items = byDate[key] ?? []; const period = periodForDate(key); const theme = schedulePhase(period?.phase); const current = day.getMonth() === month.getMonth(); const goalDay = goal?.target_date === key; return <button key={key} onClick={() => startNewForDate(key)} aria-label={`${day.getMonth() + 1}月${day.getDate()}日の予定・練習記録を表示`} className={`h-24 overflow-hidden rounded-lg border p-1.5 text-left transition hover:border-orange-400/70 ${goalDay ? "border-orange-400 bg-orange-500/15 ring-1 ring-orange-400" : key === selectedDate ? "border-white/40 ring-1 ring-white/25" : "border-white/[.07]"} ${theme.day} ${current ? "text-white" : "text-white/20"}`}><span className="flex items-center justify-between"><span className="text-xs font-bold">{day.getDate()}</span>{goalDay ? <Flag size={12} className="fill-orange-400 text-orange-400"/> : period ? <i className={`h-1.5 w-1.5 rounded-full ${theme.dot}`}/> : null}</span>{goalDay ? <span className="mt-1 block truncate text-[8px] font-black text-orange-300">目標：{goal.title}</span> : period ? <span className="mt-0.5 block truncate text-[8px] font-bold opacity-70">{period.label || theme.label}</span> : null}<span className="mt-1 block space-y-1">{items.slice(0, goalDay ? 2 : 3).map((item) => <span key={item.key} className="flex min-w-0 items-center gap-1"><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors[item.color]?.dot}`}/><span className="truncate text-[9px] text-white/55">{item.title}</span></span>)}</span></button>; })}</div>
      <p className="mt-3 text-center text-[11px] font-bold text-orange-300/80">日付をタップすると、その日の予定・練習記録を確認できます</p>
      <div className="mt-4 flex flex-wrap gap-3 text-[10px] text-white/45">{schedulePhases.map((phase) => <span key={phase.value} className="flex items-center gap-1"><i className={`h-2 w-2 rounded-full ${phase.dot}`}/>{phase.label}</span>)}</div>
    </section>
    <section className="rounded-[26px] border border-white/10 bg-[#111] p-5 sm:p-6 xl:sticky xl:top-20">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.18em] text-orange-400">DAILY LOG</p><h2 className="mt-1 text-xl font-black">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "long" })}</h2></div><div className="flex flex-wrap gap-2"><Link href={`/performance?kind=unofficial-athletics&date=${selectedDate}&from=calendar`} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-black text-black"><Plus size={15}/>練習記録を追加</Link><Link href={`/mypage/my-calendar?periodDate=${selectedDate}#period-management`} className="rounded-lg border border-sky-500/35 p-2 text-sky-300" aria-label="この日から期間カラーを追加"><CalendarDays size={18}/></Link><button onClick={startNew} className="rounded-lg border border-orange-500/35 p-2 text-orange-300" aria-label="個人予定を追加"><Plus size={18}/></button></div></div>
      {(() => { const period = periodForDate(selectedDate); if (!period) return null; const theme = schedulePhase(period.phase); return <div className={`mt-4 rounded-xl border px-4 py-3 ${theme.badge}`}><div className="flex items-center justify-between gap-3"><div><strong className="text-sm">{period.label || theme.label}</strong><p className="mt-1 text-[10px] opacity-65">{period.starts_on.replaceAll("-", "/")}〜{period.ends_on.replaceAll("-", "/")}</p></div><div className="flex gap-2"><Link href={`/mypage/my-calendar?period=${period.id}#period-management`} className="rounded-lg border border-current/30 p-2" aria-label="期間カラーを編集"><Pencil size={14}/></Link><button onClick={() => void removePeriod(period)} className="rounded-lg border border-red-400/30 p-2 text-red-300" aria-label="期間カラーを削除"><Trash2 size={14}/></button></div></div></div>; })()}
      {selectedItems.length ? <div className="mt-5 space-y-3">{selectedItems.map((item) => <DailyItemCard key={item.key} item={item} onEdit={() => editItem(item)} onRemove={remove} onRemovePerformance={removePerformance}/>)}</div> : <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-white/35"><p>この日の予定・練習記録はありません</p><Link href={`/performance?kind=unofficial-athletics&date=${selectedDate}&from=calendar`} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 px-4 py-3 font-black text-emerald-300"><Plus size={15}/>この日の練習記録を追加</Link></div>}
    </section>
    {open && <EntryEditor
      userId={userId}
      date={selectedDate}
      entry={editing}
      schedule={linkedSchedule}
      records={performanceRecords}
      calendarItems={displayItems}
      onClose={close}
      onSaved={(entry, performance) => { setEntries((items) => [...items.filter((item) => item.id !== entry.id), entry]); if (performance) setPerformanceRecords((items) => [...items.filter((item) => item.id !== performance.id), performance]); close(); router.refresh(); }}
    />}
    {goalOpen && <GoalEditor
      userId={userId}
      goal={goal}
      calendarItems={displayItems}
      initialDate={selectedDate}
      onClose={() => setGoalOpen(false)}
      onSaved={(saved) => { setGoal(saved); setGoalOpen(false); setMonth(new Date(`${saved.target_date}T00:00:00`)); }}
    />}
    {reviewOpen && goal && <GoalReviewEditor
      userId={userId}
      goal={goal}
      onClose={() => setReviewOpen(false)}
      onSaved={(continueGoal) => { setGoal(null); setReviewOpen(false); if (continueGoal) setGoalOpen(true); }}
    />}
  </div>;
}

function DailyItemCard({ item, onEdit, onRemove, onRemovePerformance }: { item: DisplayItem; onEdit: () => void; onRemove: (entry: Entry) => Promise<void>; onRemovePerformance: (record: PerformanceRecord) => Promise<void> }) {
  const record = item.performance;
  const tags = record?.awareness_categories ?? item.entry?.awareness_categories ?? [];
  const videoUrl = record?.video_url ?? item.entry?.video_url ?? null;
  const label = record
    ? record.record_kind === "athletics" ? "本番記録" : record.record_kind === "control-test" ? "CONTROL TEST" : "練習記録"
    : item.schedule ? item.active ? "参加予定" : "保存済みの振り返り"
    : entryTypes[item.entry?.entry_type as keyof typeof entryTypes] ?? "個人予定";
  const timeLabel = item.schedule ? (item.schedule.all_day ? "終日" : `${timeValue(item.schedule.starts_at)}${item.schedule.ends_at ? `〜${timeValue(item.schedule.ends_at)}` : ""}`) : entryTimeLabel(item.entry);

  return <article className={`rounded-2xl border bg-black/20 p-4 ${colors[item.color]?.border}`}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><span className="text-[10px] font-black text-white/35">{label}</span><h3 className="mt-1 truncate font-black">{item.title}</h3>{timeLabel && <p className="mt-1 text-xs font-bold text-orange-300/80">{timeLabel}</p>}{(item.schedule?.location || item.entry?.location) && <p className="mt-1 text-xs text-white/40">{item.schedule?.location || item.entry?.location}</p>}</div>
      {record ? <div className="flex gap-1"><Link href={`/edit/${record.id}`} className="p-2 text-emerald-300" aria-label="記録を編集"><Pencil size={16}/></Link><button onClick={() => void onRemovePerformance(record)} className="p-2 text-red-300" aria-label="記録を削除"><Trash2 size={16}/></button></div> : <button onClick={onEdit} className="p-2 text-orange-300" aria-label="予定・日誌を編集"><Pencil size={16}/></button>}
    </div>
    {record ? <p className="mt-3 text-lg font-black text-emerald-300">{record.value}{unitMap[record.category] ?? ""}</p> : null}
    {tags.length ? <div className="mt-3"><p className="text-[9px] font-black tracking-[.14em] text-white/35">今日の感覚・意識</p><div className="mt-1.5 flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="rounded-full border border-orange-500/30 px-2 py-1 text-[10px] font-bold text-orange-300">{tag}</span>)}</div></div> : null}
    {(record?.awareness_note || item.entry?.journal) && <div className="mt-3"><p className="text-[9px] font-black tracking-[.14em] text-white/35">練習の振り返り</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-white/65">{record?.awareness_note || item.entry?.journal}</p></div>}
    {item.entry?.record_value && <p className="mt-3 text-sm font-black text-emerald-300">記録 {item.entry.record_value}{item.entry.record_unit}</p>}
    {item.entry?.performance_record_id && <Link href={`/edit/${item.entry.performance_record_id}`} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-sky-300"><Link2 size={13}/>パフォーマンス記録と連携</Link>}
    {videoUrl && <details className="mt-3"><summary className="cursor-pointer text-xs font-black text-orange-300"><Play size={13} className="mr-1 inline"/>動画を見る</summary><video controls playsInline preload="metadata" src={videoUrl} className="mt-3 max-h-[50vh] w-full rounded-xl bg-black object-contain"/></details>}
    {!record ? <Link href={`/mypage/ai-navigator?prompt=${encodeURIComponent(`「${item.title}」についてコーチに相談したい`)}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/35 bg-sky-400/[.06] px-4 py-3 text-sm font-black text-sky-300"><MessageCircleQuestion size={17}/>コーチに相談</Link> : null}
    {record && <FeedbackRequestButton recordId={record.id} initialRequest={record.feedback_request} />}
    {item.entry && <button onClick={() => void onRemove(item.entry!)} className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-red-300/70"><Trash2 size={12}/>個人記録を削除</button>}
  </article>;
}

function GoalReviewEditor({ userId, goal, onClose, onSaved }: { userId: string; goal: CalendarGoal; onClose: () => void; onSaved: (continueGoal: boolean) => void }) {
  const [outcome, setOutcome] = useState("achieved");
  const [resultValue, setResultValue] = useState("");
  const [resultUnit, setResultUnit] = useState(goal.target_unit ?? "");
  const [reflection, setReflection] = useState("");
  const [nextAction, setNextAction] = useState("new_goal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const outcomeLabels: Record<string, string> = { achieved: "達成した", not_achieved: "惜しくも未達成", no_entry: "大会に出られなかった", changed: "目標を変更した" };
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const { error: saveError } = await createClient().from("personal_calendar_goals").update({ status: "completed", completed_at: new Date().toISOString(), outcome, result_value: resultValue ? Number(resultValue) : null, result_unit: resultValue ? resultUnit.trim() || null : null, reflection: reflection.trim() || null, next_action: nextAction, updated_at: new Date().toISOString() }).eq("id", goal.id).eq("user_id", userId);
    if (saveError) { setError(saveError.message); setSaving(false); return; }
    onSaved(nextAction === "continue");
  }
  return <div className="fixed inset-0 z-[140] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"><form onSubmit={save} className="mx-auto my-12 max-w-lg rounded-[28px] border border-orange-500/40 bg-[#111] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">TARGET REVIEW</p><h2 className="mt-1 text-2xl font-black">目標を振り返る</h2></div><button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2"><X/></button></div><div className="mt-5 rounded-xl border border-white/10 bg-white/[.03] p-4"><strong>{goal.title}</strong><p className="mt-1 text-xs text-white/45">目標：{goal.target_value ? `${goal.target_value}${goal.target_unit ?? ""}` : "記録未設定"}</p></div><div className="mt-5 space-y-4"><div><span className="text-xs font-bold text-white/55">結果</span><div className="mt-2 grid gap-2 sm:grid-cols-2">{Object.entries(outcomeLabels).map(([value, label]) => <button type="button" key={value} onClick={() => setOutcome(value)} className={`rounded-xl border px-3 py-3 text-left text-sm font-bold ${outcome === value ? "border-orange-400 bg-orange-500/10 text-orange-300" : "border-white/10 text-white/55"}`}>{label}</button>)}</div></div>{outcome !== "no_entry" && <div className="grid grid-cols-[1fr_120px] gap-3"><label><span className="text-xs font-bold text-white/55">実際の記録（任意）</span><input type="number" step="any" min="0" value={resultValue} onChange={(event) => setResultValue(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3"/></label><label><span className="text-xs font-bold text-white/55">単位</span><input maxLength={20} value={resultUnit} onChange={(event) => setResultUnit(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3"/></label></div>}<label className="block"><span className="text-xs font-bold text-white/55">良かったこと・次に試したいこと（任意）</span><textarea rows={4} maxLength={2000} value={reflection} onChange={(event) => setReflection(event.target.value)} placeholder="結果だけでなく、次につながる感覚を残す" className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-black/30 px-4 py-3 leading-6"/></label><div><span className="text-xs font-bold text-white/55">次はどうする？</span><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setNextAction("continue")} className={`rounded-xl border px-3 py-3 text-sm font-bold ${nextAction === "continue" ? "border-orange-400 bg-orange-500/10 text-orange-300" : "border-white/10 text-white/55"}`}>同じ目標を継続</button><button type="button" onClick={() => setNextAction("new_goal")} className={`rounded-xl border px-3 py-3 text-sm font-bold ${nextAction === "new_goal" ? "border-orange-400 bg-orange-500/10 text-orange-300" : "border-white/10 text-white/55"}`}>新しい目標へ</button></div></div></div>{error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/55">閉じる</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black disabled:opacity-40"><Check size={17}/>{saving ? "保存中" : "振り返りを保存"}</button></div></form></div>;
}

function GoalEditor({ userId, goal, initialDate, calendarItems, onClose, onSaved }: { userId: string; goal: CalendarGoal | null; initialDate: string; calendarItems: DisplayItem[]; onClose: () => void; onSaved: (goal: CalendarGoal) => void }) {
  const calendarChoices = useMemo(() => {
    const choices = new Map<string, { value: string; title: string; dates: string[] }>();
    calendarItems.forEach((item) => {
      if (item.schedule && item.schedule.schedule_type !== "competition") return;
      if (!item.schedule && item.entry?.entry_type !== "competition") return;
      const value = item.schedule ? `schedule:${item.schedule.id}` : item.entry ? `entry:${item.entry.id}` : "";
      if (!value) return;
      const current = choices.get(value);
      if (current) {
        if (!current.dates.includes(item.date)) current.dates.push(item.date);
      } else {
        choices.set(value, { value, title: item.title, dates: [item.date] });
      }
    });
    return [...choices.values()].map((choice) => ({ ...choice, dates: choice.dates.sort() })).sort((a, b) => a.dates[0].localeCompare(b.dates[0]));
  }, [calendarItems]);
  const initialSource = goal?.schedule_id ? `schedule:${goal.schedule_id}` : goal?.calendar_entry_id ? `entry:${goal.calendar_entry_id}` : "";
  const [calendarSource, setCalendarSource] = useState(initialSource);
  const [title, setTitle] = useState(goal?.title ?? "");
  const [targetDate, setTargetDate] = useState(goal?.target_date ?? initialDate);
  const [eventName, setEventName] = useState(goal?.event_name ?? "");
  const [targetValue, setTargetValue] = useState(goal?.target_value?.toString() ?? "");
  const [targetUnit, setTargetUnit] = useState(goal?.target_unit ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedChoice = calendarChoices.find((choice) => choice.value === calendarSource);
  const selectedDayIndex = selectedChoice?.dates.indexOf(targetDate) ?? -1;
  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const [sourceType, sourceId] = calendarSource.split(":");
    const row = { user_id: userId, title: title.trim(), target_date: targetDate, event_name: eventName.trim() || null, target_value: targetValue ? Number(targetValue) : null, target_unit: targetValue ? targetUnit.trim() || null : null, schedule_id: sourceType === "schedule" ? Number(sourceId) : null, calendar_entry_id: sourceType === "entry" ? Number(sourceId) : null, updated_at: new Date().toISOString() };
    const supabase = createClient();
    const query = goal ? supabase.from("personal_calendar_goals").update(row).eq("id", goal.id).eq("user_id", userId) : supabase.from("personal_calendar_goals").insert(row);
    const { data, error: saveError } = await query.select("*").single();
    if (saveError) { setError(saveError.message); setSaving(false); return; }
    onSaved(data as CalendarGoal);
  }
  return <div className="fixed inset-0 z-[130] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"><form onSubmit={save} className="mx-auto my-12 max-w-lg rounded-[28px] border border-orange-500/40 bg-[#111] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">NEXT TARGET</p><h2 className="mt-1 text-2xl font-black">次の目標を1つ決める</h2></div><button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2"><X/></button></div><p className="mt-3 text-sm leading-6 text-white/45">マイカレンダーにある試合・大会から、次の目標を選んでください。</p><div className="mt-6 space-y-4"><label className="block"><span className="text-xs font-bold text-white/55">試合・大会</span><select required value={calendarSource} onChange={(event) => { const value = event.target.value; setCalendarSource(value); const choice = calendarChoices.find((item) => item.value === value); if (choice) { setTitle(choice.title); setTargetDate(choice.dates[0]); } }} className="mt-2 w-full rounded-xl border border-orange-500/45 bg-[#111] px-4 py-3"><option value="">試合を選択</option>{calendarChoices.map((choice) => <option key={choice.value} value={choice.value}>{choice.dates[0].replaceAll("-", "/")}{choice.dates.length > 1 ? `〜${choice.dates.at(-1)?.replaceAll("-", "/")}（${choice.dates.length}日間）` : ""}　{choice.title}</option>)}</select>{calendarChoices.length === 0 ? <p className="mt-2 text-xs text-orange-300">先にマイカレンダーへ試合・大会を追加してください。</p> : null}</label>{selectedChoice && selectedChoice.dates.length > 1 ? <div><span className="text-xs font-bold text-white/55">何日目を目標にする？</span><div className="mt-2 grid grid-cols-3 gap-2">{selectedChoice.dates.map((date, index) => <button type="button" key={date} onClick={() => setTargetDate(date)} className={`rounded-xl border px-3 py-3 text-sm font-black ${targetDate === date ? "border-orange-400 bg-orange-500/15 text-orange-300" : "border-white/10 text-white/50"}`}><span className="block">{index + 1}日目</span><span className="mt-1 block text-[10px] font-bold opacity-65">{date.slice(5).replace("-", "/")}</span></button>)}</div></div> : null}<label className="block"><span className="text-xs font-bold text-white/55">目標名</span><input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3"/></label><label className="block"><span className="text-xs font-bold text-white/55">目標日</span><div className="mt-2 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white/60">{targetDate ? targetDate.replaceAll("-", "/") : "試合を選択してください"}{selectedChoice && selectedChoice.dates.length > 1 && selectedDayIndex >= 0 ? `（${selectedDayIndex + 1}日目）` : ""}</div></label><label className="block"><span className="text-xs font-bold text-white/55">種目（任意）</span><input maxLength={80} value={eventName} onChange={(event) => setEventName(event.target.value)} placeholder="例：走幅跳" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3"/></label><div className="grid grid-cols-[1fr_120px] gap-3"><label><span className="text-xs font-bold text-white/55">目標記録（任意）</span><input type="number" step="any" min="0" value={targetValue} onChange={(event) => setTargetValue(event.target.value)} placeholder="例：7.50" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3"/></label><label><span className="text-xs font-bold text-white/55">単位</span><input maxLength={20} value={targetUnit} onChange={(event) => setTargetUnit(event.target.value)} placeholder="m / 秒" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3"/></label></div></div>{error ? <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/55">閉じる</button><button disabled={saving || !calendarSource || !title.trim() || !targetDate} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black disabled:opacity-40"><Check size={17}/>{saving ? "保存中" : "目標を保存"}</button></div></form></div>;
}

function EntryEditor({ userId, date, entry, schedule, records, calendarItems, onClose, onSaved }: { userId: string; date: string; entry: Entry | null; schedule: ClubSchedule | null; records: PerformanceRecord[]; calendarItems: DisplayItem[]; onClose: () => void; onSaved: (entry: Entry, performance?: PerformanceRecord) => void }) {
  const initialDate = schedule ? dateKey(new Date(schedule.starts_at)) : entry?.entry_date ?? date;
  const linkedRecord = records.find((record) => record.id === entry?.performance_record_id);
  const unofficialEvents = eventNamesByKind("unofficial-athletics");
  const [title, setTitle] = useState(schedule?.title ?? entry?.title ?? ""); const [entryDate, setEntryDate] = useState(initialDate); const [type, setType] = useState(schedule ? "club_schedule" : entry?.entry_type ?? "personal_training"); const [location, setLocation] = useState(schedule?.location ?? entry?.location ?? ""); const [journal, setJournal] = useState(entry?.journal ?? ""); const [tags, setTags] = useState(entry?.awareness_categories ?? []); const [color, setColor] = useState(entry?.color ?? (schedule ? "orange" : "sky")); const [recordCategory, setRecordCategory] = useState(linkedRecord?.category ?? ""); const [recordValue, setRecordValue] = useState(entry?.record_value?.toString() ?? linkedRecord?.value.toString() ?? ""); const [recordUnit, setRecordUnit] = useState(entry?.record_unit ?? (linkedRecord ? unitMap[linkedRecord.category] ?? "" : "")); const [performanceId, setPerformanceId] = useState(entry?.performance_record_id?.toString() ?? ""); const [video, setVideo] = useState<File | null>(null); const [removeVideo, setRemoveVideo] = useState(false); const [progress, setProgress] = useState(0); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const [allDay, setAllDay] = useState(schedule?.all_day ?? entry?.all_day ?? true);
  const [startTime, setStartTime] = useState(timeValue(schedule?.starts_at ?? entry?.starts_at));
  const [endTime, setEndTime] = useState(timeValue(schedule?.ends_at ?? entry?.ends_at));
  const initialDateValue = new Date(`${initialDate}T00:00:00`);
  const [calendarOpen, setCalendarOpen] = useState(!schedule);
  const [pickerMonth, setPickerMonth] = useState(new Date(initialDateValue.getFullYear(), initialDateValue.getMonth(), 1));
  const pickerItems = useMemo(() => calendarItems.reduce<Record<string, DisplayItem[]>>((all, item) => { (all[item.date] ??= []).push(item); return all; }, {}), [calendarItems]);
  const pickerFirst = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1 - pickerMonth.getDay());
  const pickerDays = Array.from({ length: 42 }, (_, index) => new Date(pickerFirst.getFullYear(), pickerFirst.getMonth(), pickerFirst.getDate() + index));
  function selectEntryDate(key: string) { setEntryDate(key); const selected = new Date(`${key}T00:00:00`); setPickerMonth(new Date(selected.getFullYear(), selected.getMonth(), 1)); }
  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!schedule && !allDay && !startTime) return setError("開始時刻を入力してください。");
    if (!schedule && !allDay && endTime && endTime < startTime) return setError("終了時刻は開始時刻より後にしてください。");
    const numericValue = recordValue ? Number(recordValue) : null;
    if (recordValue && (!Number.isFinite(numericValue) || Number(numericValue) <= 0)) return setError("記録には0より大きい数値を入力してください。");
    if (recordValue && !recordCategory) return setError("パフォーマンスへ反映する種目を選択してください。");
    const videoError = video ? validateVideo(video) : null;
    if (videoError) return setError(videoError);
    setSaving(true);
    const supabase = createClient();
    let videoPath = removeVideo ? null : entry?.video_path ?? null;
    let createdPerformanceId: number | null = null;
    let savedPerformance: PerformanceRecord | undefined;
    try {
      if (video) {
        videoPath = createVideoPath(userId, video);
        await uploadVideoWithProgress(supabase, videoPath, video, setProgress);
      }
      let resolvedPerformanceId = performanceId ? Number(performanceId) : null;
      if (numericValue !== null) {
        const performanceRow = {
          user_id: userId,
          category: recordCategory,
          value: numericValue,
          date: entryDate,
          record_kind: "unofficial-athletics",
          awareness_category: tags[0] || null,
          awareness_categories: tags.length ? tags : null,
          awareness_note: journal.trim() || null,
          video_path: videoPath,
        };
        const performanceQuery = resolvedPerformanceId
          ? supabase.from("performance_records").update(performanceRow).eq("id", resolvedPerformanceId).eq("user_id", userId)
          : supabase.from("performance_records").insert(performanceRow);
        const { data: performanceData, error: performanceError } = await performanceQuery.select("id, category, value, date, record_kind, awareness_categories, awareness_note, video_path").single();
        if (performanceError) throw performanceError;
        resolvedPerformanceId = performanceData.id;
        if (!performanceId) createdPerformanceId = performanceData.id;
        savedPerformance = { ...performanceData, video_url: video ? URL.createObjectURL(video) : removeVideo ? null : entry?.video_url ?? null } as PerformanceRecord;
      }
      const personalStart = !allDay && startTime ? `${entryDate}T${startTime}:00+09:00` : null;
      const personalEnd = !allDay && endTime ? `${entryDate}T${endTime}:00+09:00` : null;
      const row = { user_id: userId, schedule_id: schedule?.id ?? entry?.schedule_id ?? null, entry_date: entryDate, all_day: schedule?.all_day ?? allDay, starts_at: schedule?.starts_at ?? personalStart, ends_at: schedule?.ends_at ?? personalEnd, entry_type: type, title: title.trim(), location: location.trim() || null, journal: journal.trim() || null, awareness_categories: tags, record_value: numericValue, record_unit: numericValue !== null ? recordUnit.trim() || null : null, performance_record_id: resolvedPerformanceId, video_path: videoPath, color, updated_at: new Date().toISOString() };
      const query = entry ? supabase.from("personal_calendar_entries").update(row).eq("id", entry.id).eq("user_id", userId) : supabase.from("personal_calendar_entries").upsert(row, { onConflict: "user_id,schedule_id" });
      const { data, error: saveError } = await query.select("*").single();
      if (saveError) throw saveError;
      if ((removeVideo || video) && entry?.video_path && entry.video_path !== videoPath) await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([entry.video_path]);
      onSaved({ ...data, video_url: video ? URL.createObjectURL(video) : removeVideo ? null : entry?.video_url ?? null } as Entry, savedPerformance);
    } catch (caught) {
      if (createdPerformanceId) await supabase.from("performance_records").delete().eq("id", createdPerformanceId).eq("user_id", userId);
      if (video && videoPath && videoPath !== entry?.video_path) await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([videoPath]);
      setError(caught instanceof Error ? caught.message : "保存できませんでした。");
    } finally {
      setSaving(false);
    }
  }
  return <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"><form onSubmit={save} className="mx-auto my-8 max-w-3xl rounded-[28px] border border-orange-500/35 bg-[#111] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">{schedule ? "CLUB SCHEDULE LOG" : "PERSONAL LOG"}</p><h2 className="mt-1 text-2xl font-black">{schedule ? "予定を振り返る" : entry ? "個人予定を編集" : "個人予定を追加"}</h2></div><button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2"><X/></button></div>{!schedule && <div className="mt-5 rounded-2xl border border-white/10 bg-black/20"><button type="button" onClick={() => setCalendarOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-black"><span className="flex items-center gap-2"><CalendarDays size={18} className="text-orange-400"/>月間カレンダーを見ながら日付を選ぶ</span><ChevronRight size={17} className={`text-white/40 transition ${calendarOpen ? "rotate-90" : ""}`}/></button>{calendarOpen && <div className="border-t border-white/10 p-3 sm:p-4"><div className="flex items-center justify-between"><button type="button" onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))} className="rounded-lg p-2 text-white/55"><ChevronLeft size={19}/></button><strong className="text-sm">{pickerMonth.getFullYear()}年 {pickerMonth.getMonth() + 1}月</strong><button type="button" onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))} className="rounded-lg p-2 text-white/55"><ChevronRight size={19}/></button></div><div className="mt-2 grid grid-cols-7 text-center text-[9px] font-black text-white/35">{weekdays.map((day) => <span key={day}>{day}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{pickerDays.map((day) => { const key = dateKey(day); const items = pickerItems[key] ?? []; const current = day.getMonth() === pickerMonth.getMonth(); return <button type="button" key={key} onClick={() => selectEntryDate(key)} className={`min-h-12 overflow-hidden rounded-lg border p-1 text-left sm:min-h-16 ${key === entryDate ? "border-orange-400 bg-orange-500/10 ring-1 ring-orange-400" : "border-white/[.07] bg-white/[.02]"} ${current ? "text-white" : "text-white/20"}`}><span className="text-[10px] font-bold">{day.getDate()}</span><span className="mt-1 block space-y-0.5">{items.slice(0, 2).map((item) => <span key={item.key} className="flex items-center gap-1"><i className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors[item.color]?.dot}`}/><span className="hidden truncate text-[8px] text-white/50 sm:block">{item.title}</span></span>)}</span></button>; })}</div><p className="mt-3 text-center text-xs font-bold text-orange-300">選択中：{new Date(`${entryDate}T00:00:00`).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</p></div>}</div>}<div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="text-xs font-bold text-white/55">タイトル</span><input required maxLength={120} disabled={Boolean(schedule)} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 disabled:opacity-60"/></label><label><span className="text-xs font-bold text-white/55">日付</span><input type="date" required disabled={Boolean(schedule)} value={entryDate} onChange={(e) => selectEntryDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 disabled:opacity-60"/></label>{!schedule && <><label className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} className="h-4 w-4 accent-orange-500"/>時刻を指定せず終日予定にする</label>{!allDay && <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2"><label><span className="text-xs font-bold text-white/55">開始時刻</span><input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="mt-2 w-full rounded-xl border border-orange-500/40 bg-black/30 px-4 py-3 [color-scheme:dark]"/></label><label><span className="text-xs font-bold text-white/55">終了時刻（任意）</span><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]"/></label></div>}</>}<label><span className="text-xs font-bold text-white/55">種類</span><select disabled={Boolean(schedule)} value={type} onChange={(e) => setType(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] px-4 py-3 disabled:opacity-60">{Object.entries(entryTypes).filter(([key]) => key !== "club_schedule" || schedule).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label className="sm:col-span-2"><span className="text-xs font-bold text-white/55">場所（任意）</span><input maxLength={200} disabled={Boolean(schedule)} value={location} onChange={(e) => setLocation(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 disabled:opacity-60"/></label><div className="sm:col-span-2"><span className="text-xs font-bold text-white/55">カラー</span><div className="mt-2 flex flex-wrap gap-2">{Object.entries(colors).map(([key, item]) => <button type="button" aria-label={item.label} key={key} onClick={() => setColor(key)} className={`h-9 w-9 rounded-full ${item.dot} ${color === key ? "ring-2 ring-white ring-offset-2 ring-offset-[#111]" : "opacity-55"}`}/>)}</div></div><div className="sm:col-span-2"><span className="text-xs font-bold text-white/55">今日意識したこと（複数可）</span><div className="mt-2"><AwarenessTagSelector value={tags} onChange={setTags}/></div></div><label className="sm:col-span-2"><span className="text-xs font-bold text-white/55">練習日誌・振り返り</span><textarea rows={5} maxLength={5000} value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="やったこと、感覚、次に試したいこと" className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-black/30 px-4 py-3 leading-6"/></label><label className="sm:col-span-2"><span className="text-xs font-bold text-white/55">パフォーマンスへ反映する種目（任意）</span><select value={recordCategory} onChange={(event) => { const category = event.target.value; setRecordCategory(category); setRecordUnit(unitMap[category] ?? ""); if (!category) setRecordValue(""); }} className="mt-2 w-full rounded-xl border border-emerald-500/35 bg-[#111] px-4 py-3"><option value="">記録しない</option>{unofficialEvents.map((eventName) => <option key={eventName} value={eventName}>{eventName}</option>)}</select></label><div><span className="text-xs font-bold text-white/55">記録（パフォーマンスにも保存）</span><input type="number" inputMode="decimal" step="any" min="0" disabled={!recordCategory} value={recordValue} onChange={(e) => setRecordValue(e.target.value)} placeholder="例：7.25" className="mt-2 w-full rounded-xl border border-emerald-500/35 bg-black/30 px-4 py-3 disabled:opacity-35"/></div><label><span className="text-xs font-bold text-white/55">単位</span><input maxLength={20} disabled={!recordCategory} value={recordUnit} onChange={(e) => setRecordUnit(e.target.value)} placeholder="m / 秒 / kg" className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 disabled:opacity-35"/></label><p className="-mt-2 text-[11px] leading-5 text-emerald-300/70 sm:col-span-2">種目と記録を入力すると、意識・振り返り・動画と一緒に「練習記録」へ自動で反映されます。</p><label className="sm:col-span-2"><span className="flex items-center gap-1 text-xs font-bold text-white/55"><Link2 size={13}/>既存パフォーマンス記録を編集する場合</span><select value={performanceId} onChange={(event) => { const value = event.target.value; setPerformanceId(value); const selected = records.find((record) => record.id === Number(value)); if (selected) { setRecordCategory(selected.category); setRecordValue(selected.value.toString()); setRecordUnit(unitMap[selected.category] ?? ""); } }} className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] px-4 py-3"><option value="">新しい練習記録として保存</option>{records.map((record) => <option key={record.id} value={record.id}>{record.date}　{record.category}　{record.value}{unitMap[record.category] ?? ""}</option>)}</select><p className="mt-1 text-[10px] text-white/35">通常は「新しい練習記録として保存」のままで大丈夫です。</p></label><div className="sm:col-span-2 rounded-xl border border-white/10 p-4"><span className="text-xs font-bold text-white/55">動画（任意・100MBまで）</span>{entry?.video_path && !removeVideo && !video ? <div className="mt-2 flex items-center justify-between rounded-lg bg-white/[.04] p-3 text-xs"><span>保存済みの動画</span><button type="button" onClick={() => setRemoveVideo(true)} className="text-red-300">動画を削除</button></div> : <label className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 p-4 text-sm text-white/55"><Upload size={18}/>{video ? `${video.name}（${formatVideoSize(video.size)}）` : "写真フォルダから動画を選択"}<input type="file" accept="video/*" className="sr-only" onChange={(e) => setVideo(e.target.files?.[0] ?? null)}/></label>}{video && <button type="button" onClick={() => setVideo(null)} className="mt-2 text-xs text-red-300">選択を取り消す</button>}{saving && video && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><i className="block h-full bg-orange-500" style={{ width: `${progress}%` }}/></div>}</div></div>{error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-white/15 px-5 py-3 text-sm font-bold text-white/55">閉じる</button><button disabled={saving || !title.trim()} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black disabled:opacity-40"><Check size={17}/>{saving ? "保存中" : "保存する"}</button></div></form></div>;
}
