"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, Dumbbell, MapPin, Trophy, Users } from "lucide-react";

export type PublicScheduleItem = {
  id: number;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  schedule_type: string;
  audience: string;
  program_class: string | null;
};

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
const typeLabels: Record<string, string> = { practice: "練習", competition: "大会", measurement: "測定", other: "その他" };
const typeColors: Record<string, string> = {
  practice: "bg-emerald-400",
  competition: "bg-orange-400",
  measurement: "bg-sky-400",
  other: "bg-white/50",
};
type ScheduleFilter = "all" | "session" | "competition";

function tokyoDateKey(value: string) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date(value));
}

function monthKeyFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${year}年 ${Number(month)}月`;
}

function timeLabel(item: PublicScheduleItem) {
  if (item.all_day) return "終日";
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" };
  const start = new Date(item.starts_at).toLocaleTimeString("ja-JP", options);
  const end = item.ends_at ? new Date(item.ends_at).toLocaleTimeString("ja-JP", options) : null;
  return `${start}${end ? `〜${end}` : ""}`;
}

export default function PublicScheduleCalendar({ items }: { items: PublicScheduleItem[] }) {
  const todayKey = tokyoDateKey(new Date().toISOString());
  const initialMonth = items[0]?.starts_at ? tokyoDateKey(items[0].starts_at).slice(0, 7) : todayKey.slice(0, 7);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<ScheduleFilter>("all");

  const filteredItems = useMemo(() => items.filter((item) => filter === "all" || (filter === "competition" ? item.schedule_type === "competition" : item.schedule_type !== "competition")), [filter, items]);

  const itemsByDate = useMemo(() => {
    const result = new Map<string, PublicScheduleItem[]>();
    for (const item of filteredItems) {
      const key = tokyoDateKey(item.starts_at);
      result.set(key, [...(result.get(key) ?? []), item]);
    }
    return result;
  }, [filteredItems]);

  const calendarDays = useMemo(() => {
    const [year, month] = visibleMonth.split("-").map(Number);
    const first = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const previousMonthDays = new Date(year, month - 1, 0).getDate();
    return Array.from({ length: 42 }, (_, index) => {
      const offset = index - first.getDay() + 1;
      if (offset < 1) return { day: previousMonthDays + offset, current: false, key: null };
      if (offset > daysInMonth) return { day: offset - daysInMonth, current: false, key: null };
      const key = `${visibleMonth}-${String(offset).padStart(2, "0")}`;
      return { day: offset, current: true, key };
    });
  }, [visibleMonth]);

  const monthItems = filteredItems.filter((item) => tokyoDateKey(item.starts_at).startsWith(visibleMonth));
  const detailItems = selectedDate ? itemsByDate.get(selectedDate) ?? [] : monthItems;
  const detailGroups = filter === "all" ? [
    { key: "session", label: "セッション", icon: Dumbbell, items: detailItems.filter((item) => item.schedule_type !== "competition") },
    { key: "competition", label: "試合・大会", icon: Trophy, items: detailItems.filter((item) => item.schedule_type === "competition") },
  ] : [{ key: filter, label: filter === "competition" ? "試合・大会" : "セッション", icon: filter === "competition" ? Trophy : Dumbbell, items: detailItems }];

  function moveMonth(amount: number) {
    const [year, month] = visibleMonth.split("-").map(Number);
    setVisibleMonth(monthKeyFromDate(new Date(year, month - 1 + amount, 1)));
    setSelectedDate(null);
  }

  return (
    <div className="mt-12">
      <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#101216] p-2" role="group" aria-label="予定の種類を選択">
        {([
          ["all", "すべて", items.length],
          ["session", "セッション", items.filter((item) => item.schedule_type !== "competition").length],
          ["competition", "試合・大会", items.filter((item) => item.schedule_type === "competition").length],
        ] as const).map(([value, label, count]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setSelectedDate(null); }} className={`rounded-xl px-2 py-3 text-xs font-black transition sm:text-sm ${filter === value ? "bg-orange-500 text-black" : "text-white/45 hover:bg-white/[.05] hover:text-white"}`}><span className="block sm:inline">{label}</span><span className={`ml-0 mt-1 block text-[10px] sm:ml-2 sm:mt-0 sm:inline ${filter === value ? "text-black/55" : "text-white/25"}`}>{count}件</span></button>)}
      </div>
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#101216] shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
          <button type="button" onClick={() => moveMonth(-1)} aria-label="前の月" className="rounded-full border border-white/10 p-2 text-white/65 transition hover:border-orange-400/40 hover:text-orange-300"><ChevronLeft size={20} /></button>
          <div className="text-center"><p className="text-[10px] font-black tracking-[0.2em] text-orange-400">MONTHLY SCHEDULE</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{monthLabel(visibleMonth)}</h2></div>
          <button type="button" onClick={() => moveMonth(1)} aria-label="次の月" className="rounded-full border border-white/10 p-2 text-white/65 transition hover:border-orange-400/40 hover:text-orange-300"><ChevronRight size={20} /></button>
        </div>

        <div className="grid grid-cols-7 border-b border-white/10 bg-white/[.025]">
          {weekdayLabels.map((label, index) => <div key={label} className={`py-2 text-center text-[10px] font-black ${index === 0 ? "text-rose-300" : index === 6 ? "text-sky-300" : "text-white/35"}`}>{label}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dateItems = date.key ? itemsByDate.get(date.key) ?? [] : [];
            const selected = date.key === selectedDate;
            return (
              <button key={`${date.day}-${index}`} type="button" disabled={!date.current} onClick={() => date.key && setSelectedDate(date.key === selectedDate ? null : date.key)} className={`min-h-20 border-b border-r border-white/[.07] p-1.5 text-left transition sm:min-h-28 sm:p-2 ${date.current ? "hover:bg-white/[.04]" : "bg-black/20 text-white/10"} ${selected ? "bg-orange-400/10 ring-1 ring-inset ring-orange-400/50" : ""}`}>
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${date.key === todayKey ? "bg-orange-500 text-black" : date.current ? "text-white/65" : "text-white/10"}`}>{date.day}</span>
                <span className="mt-1.5 flex flex-wrap gap-1 sm:hidden">{dateItems.slice(0, 4).map((item) => <span key={item.id} className={`h-1.5 w-1.5 rounded-full ${typeColors[item.schedule_type] ?? typeColors.other}`} />)}</span>
                <span className="mt-1 hidden space-y-1 sm:block">
                  {dateItems.slice(0, 2).map((item) => <span key={item.id} className="block truncate rounded bg-white/[.06] px-1.5 py-1 text-[9px] font-bold text-white/70"><span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${typeColors[item.schedule_type] ?? typeColors.other}`} />{item.title}</span>)}
                  {dateItems.length > 2 ? <span className="block px-1 text-[9px] font-bold text-white/30">ほか{dateItems.length - 2}件</span> : null}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4 border-b border-white/15 pb-4">
          <div><p className="text-[10px] font-black tracking-[0.18em] text-orange-400">DETAILS</p><h2 className="mt-1 text-xl font-black">{selectedDate ? `${Number(selectedDate.slice(5, 7))}月${Number(selectedDate.slice(8, 10))}日の予定` : `${monthLabel(visibleMonth)}の予定`}</h2></div>
          {selectedDate ? <button type="button" onClick={() => setSelectedDate(null)} className="text-xs font-bold text-white/45 hover:text-white">月全体を表示</button> : null}
        </div>
        {detailItems.length ? <div className="space-y-8 pt-7">{detailGroups.filter((group) => group.items.length).map((group) => { const Icon = group.icon; return <div key={group.key}><div className="flex items-center justify-between border-b border-white/10 pb-3"><h3 className="flex items-center gap-2 text-sm font-black"><Icon size={17} className={group.key === "competition" ? "text-orange-400" : "text-emerald-400"} />{group.label}</h3><span className="text-xs font-bold text-white/30">{group.items.length}件</span></div><div className="divide-y divide-white/10">{group.items.map((item) => (
          <article key={item.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${item.schedule_type === "competition" ? "border-orange-400/25 bg-orange-400/10 text-orange-300" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"}`}>{typeLabels[item.schedule_type] ?? "予定"}</span><span className="flex items-center gap-1 text-xs font-bold text-white/40"><Users size={13} />{item.audience === "all" ? "全クラス" : item.program_class ?? "クラス別"}</span></div><h4 className="mt-3 text-lg font-black">{item.title}</h4></div>
            <div className="space-y-2 text-sm text-white/60 sm:min-w-60"><p className="flex items-center gap-2"><Clock3 size={15} className={item.schedule_type === "competition" ? "text-orange-400" : "text-emerald-400"} />{Number(tokyoDateKey(item.starts_at).slice(5, 7))}月{Number(tokyoDateKey(item.starts_at).slice(8, 10))}日・{timeLabel(item)}</p><p className="flex items-center gap-2"><MapPin size={15} className={item.schedule_type === "competition" ? "text-orange-400" : "text-emerald-400"} />{item.location || "場所は調整中"}</p></div>
          </article>
        ))}</div></div>; })}</div> : <div className="py-12 text-center text-sm font-bold text-white/35">この期間の{filter === "competition" ? "試合・大会" : filter === "session" ? "セッション" : "予定"}はありません。</div>}
      </section>
    </div>
  );
}
