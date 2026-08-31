"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, Users } from "lucide-react";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import { programClasses } from "@/lib/program-classes";

type Props = { items: ScheduleItem[]; attendance: Array<{ schedule_id: number; status: string }>; onEdit: (item: ScheduleItem) => void; onRemove: (item: ScheduleItem) => void; onRemoveMany: (items: ScheduleItem[]) => void };
type Group = { key: string; items: ScheduleItem[] };
const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
const weekdayKeys = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function shortDate(value: string) { return new Date(value).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", timeZone: "Asia/Tokyo" }); }
function time(value: string) { return new Date(value).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }); }
function weekday(value: string) { return weekdays[weekdayKeys.indexOf(new Date(value).toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Tokyo" }))]; }

export default function RecurringScheduleList({ items, attendance, onEdit, onRemove, onRemoveMany }: Props) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const groups = useMemo(() => {
    const bySignature = items.reduce<Record<string, ScheduleItem[]>>((result, item) => { const key = [item.title, item.location ?? "", item.schedule_type, item.training_phase ?? "normal", item.audience, item.program_class ?? "", time(item.starts_at)].join("|"); (result[key] ??= []).push(item); return result; }, {});
    return Object.entries(bySignature).flatMap<Group>(([key, groupItems]) => { const sorted = groupItems.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()); const weekly = sorted.length > 1 && sorted.slice(1).every((item, index) => Math.abs(new Date(item.starts_at).getTime() - new Date(sorted[index].starts_at).getTime() - 7 * 86400000) < 3600000); return weekly ? [{ key, items: sorted }] : sorted.map((item) => ({ key: `${key}|${item.id}`, items: [item] })); }).sort((a, b) => new Date(a.items[0].starts_at).getTime() - new Date(b.items[0].starts_at).getTime());
  }, [items]);
  const sections = [{ key: "all", label: "全体対象", groups: groups.filter((group) => group.items[0].audience === "all") }, ...programClasses.map((programClass) => ({ key: programClass, label: `${programClass}対象`, groups: groups.filter((group) => group.items[0].audience === "class" && group.items[0].program_class === programClass) }))].filter((section) => section.groups.length > 0);
  function toggle(key: string) { setExpanded((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]); }
  function attendanceLabel(scheduleId: number) { const rows = attendance.filter((item) => item.schedule_id === scheduleId); const attending = rows.filter((item) => item.status === "attending").length; const absent = rows.filter((item) => item.status === "absent").length; const undecided = rows.filter((item) => item.status === "undecided").length; return rows.length ? `参加${attending}・欠席${absent}・未定${undecided}` : "回答なし"; }
  return <div className="mt-5 space-y-3 border-t border-white/10 pt-5">{sections.map((section) => {
    const isSectionOpen = openSection === section.key;
    const count = section.groups.reduce((total, group) => total + group.items.length, 0);
    return <section key={section.key} className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.01]">
      <button
        type="button"
        onClick={() => setOpenSection((current) => current === section.key ? null : section.key)}
        aria-expanded={isSectionOpen}
        className={`flex w-full items-center gap-2 px-4 py-4 text-left text-xs font-black tracking-[0.08em] transition-colors hover:bg-white/[0.03] ${section.key === "all" ? "text-orange-300" : "text-sky-300"}`}
      >
        <Users size={14} />
        <span>{section.label}</span>
        <span className="font-normal text-white/30">（{count}件）</span>
        <span className="ml-auto text-white/55">{isSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
      </button>
      {isSectionOpen && <div className="divide-y divide-white/10 border-t border-white/[0.08] px-4">{section.groups.map((group) => { const first = group.items[0]; const last = group.items.at(-1)!; const recurring = group.items.length > 1; const isOpen = expanded.includes(group.key); return <div key={group.key} className="py-4"><div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => recurring && toggle(group.key)} className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm">{first.title}</strong>{recurring ? <span className="mt-1 block text-xs text-white/45">毎週{weekday(first.starts_at)}曜 {time(first.starts_at)}・{shortDate(first.starts_at)}〜{shortDate(last.starts_at)}・全{group.items.length}回</span> : <><span className="mt-1 block text-xs text-white/40">{new Date(first.starts_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</span><span className="mt-1 block text-xs font-bold text-emerald-300/70">{attendanceLabel(first.id)}</span></>}</button>{recurring ? <><button type="button" onClick={() => toggle(group.key)} aria-label="各日程を表示" className="p-2 text-white/55">{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button><button type="button" onClick={() => onRemoveMany(group.items)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-black text-red-300"><Trash2 size={15} />全{group.items.length}件削除</button></> : <><button type="button" onClick={() => onEdit(first)} aria-label={`${first.title}を編集`} className="p-2 text-white/60"><Pencil size={16} /></button><button type="button" onClick={() => onRemove(first)} aria-label={`${first.title}を削除`} className="p-2 text-red-400"><Trash2 size={16} /></button></>}</div>{recurring && isOpen && <div className="mt-3 ml-3 border-l border-white/10 pl-4">{group.items.map((item) => <div key={item.id} className="flex items-center gap-3 border-t border-white/[0.06] py-3 first:border-0"><span className="min-w-0 flex-1 text-xs text-white/50">{new Date(item.starts_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}<strong className="mt-1 block text-emerald-300/70">{attendanceLabel(item.id)}</strong></span><button type="button" onClick={() => onEdit(item)} aria-label="この日程を編集" className="p-2 text-white/50"><Pencil size={14} /></button><button type="button" onClick={() => onRemove(item)} aria-label="この日程を削除" className="p-2 text-red-400"><Trash2 size={14} /></button></div>)}</div>}</div>; })}</div>}
    </section>;
  })}</div>;
}
