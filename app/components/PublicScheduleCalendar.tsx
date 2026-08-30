"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock3, MapPin, Users } from "lucide-react";

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

  const itemsByDate = useMemo(() => {
    const result = new Map<string, PublicScheduleItem[]>();
    for (const item of items) {
      const key = tokyoDateKey(item.starts_at);
      result.set(key, [...(result.get(key) ?? []), item]);
    }
    return result;
  }, [items]);

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

  const monthItems = items.filter((item) => tokyoDateKey(item.starts_at).startsWith(visibleMonth));
  const detailItems = selectedDate ? itemsByDate.get(selectedDate) ?? [] : monthItems;

  function moveMonth(amount: number) {
    const [year, month] = visibleMonth.split("-").map(Number);
    setVisibleMonth(monthKeyFromDate(new Date(year, month - 1 + amount, 1)));
    setSelectedDate(null);
  }

  return (
    <div className="mt-12">
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
        {detailItems.length ? <div className="divide-y divide-white/10">{detailItems.map((item) => (
          <article key={item.id} className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-orange-400/25 bg-orange-400/10 px-2.5 py-1 text-[10px] font-black text-orange-300">{typeLabels[item.schedule_type] ?? "予定"}</span><span className="flex items-center gap-1 text-xs font-bold text-white/40"><Users size={13} />{item.audience === "all" ? "全クラス" : item.program_class ?? "クラス別"}</span></div><h3 className="mt-3 text-lg font-black">{item.title}</h3></div>
            <div className="space-y-2 text-sm text-white/60 sm:min-w-60"><p className="flex items-center gap-2"><Clock3 size={15} className="text-orange-400" />{Number(tokyoDateKey(item.starts_at).slice(5, 7))}月{Number(tokyoDateKey(item.starts_at).slice(8, 10))}日・{timeLabel(item)}</p><p className="flex items-center gap-2"><MapPin size={15} className="text-orange-400" />{item.location || "場所は調整中"}</p></div>
          </article>
        ))}</div> : <div className="py-12 text-center text-sm font-bold text-white/35">この期間の予定はありません。</div>}
      </section>
    </div>
  );
}
