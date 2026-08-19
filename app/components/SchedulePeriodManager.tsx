"use client";

import { useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { schedulePhase, schedulePhases } from "@/lib/schedule-phases";
import type { SchedulePeriod } from "@/lib/schedule-periods";

const classes = ["ジュニア", "ユース", "エリート", "マスターズ"];
const today = () => new Date().toISOString().slice(0, 10);

export default function SchedulePeriodManager({ initialPeriods, coachId }: { initialPeriods: SchedulePeriod[]; coachId: string }) {
  const router = useRouter();
  const [periods, setPeriods] = useState(initialPeriods);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [phase, setPhase] = useState("build");
  const [label, setLabel] = useState("");
  const [startsOn, setStartsOn] = useState(today());
  const [endsOn, setEndsOn] = useState(today());
  const [audience, setAudience] = useState<"all" | "class">("all");
  const [programClass, setProgramClass] = useState("ジュニア");
  const [saving, setSaving] = useState(false);

  function reset() {
    setEditingId(null); setPhase("build"); setLabel(""); setStartsOn(today()); setEndsOn(today()); setAudience("all"); setProgramClass("ジュニア"); setOpen(false);
  }

  function edit(period: SchedulePeriod) {
    setEditingId(period.id); setPhase(period.phase); setLabel(period.label ?? ""); setStartsOn(period.starts_on); setEndsOn(period.ends_on); setAudience(period.audience); setProgramClass(period.program_class ?? "ジュニア"); setOpen(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (endsOn < startsOn) { alert("終了日は開始日以降にしてください。"); return; }
    setSaving(true);
    const supabase = createClient();
    const row = { author_id: coachId, label: label.trim() || null, phase, starts_on: startsOn, ends_on: endsOn, audience, program_class: audience === "class" ? programClass : null, updated_at: new Date().toISOString() };
    const query = editingId ? supabase.from("schedule_periods").update(row).eq("id", editingId).eq("author_id", coachId) : supabase.from("schedule_periods").insert(row);
    const { data, error } = await query.select("*").single();
    setSaving(false);
    if (error) { alert(`期間を保存できませんでした。${error.message}`); return; }
    setPeriods((current) => editingId ? current.map((item) => item.id === editingId ? data as SchedulePeriod : item) : [...current, data as SchedulePeriod].sort((a, b) => a.starts_on.localeCompare(b.starts_on)));
    reset(); router.refresh();
  }

  async function remove(period: SchedulePeriod) {
    if (!confirm(`「${period.label || schedulePhase(period.phase).label}」の期間設定を削除しますか？\n予定自体は削除されません。`)) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("schedule_periods").delete().eq("id", period.id).eq("author_id", coachId).select("id").maybeSingle();
    if (error || !data) { alert(error?.message ?? "期間を削除できませんでした。"); return; }
    setPeriods((current) => current.filter((item) => item.id !== period.id)); router.refresh();
  }

  return <section className="rounded-2xl border border-orange-500/25 bg-[#111] p-5 text-white sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black tracking-[0.2em] text-orange-400">TRAINING PERIOD</p><h2 className="mt-1 text-lg font-black">期間カラー</h2><p className="mt-1 text-xs leading-5 text-white/40">予定を作らず、期間だけをカレンダーへ色付けします。</p></div><button type="button" onClick={() => { if (open) reset(); else setOpen(true); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-black text-black">{open ? <X size={15}/> : <Plus size={15}/>} {open ? "閉じる" : "期間を追加"}</button></div>
    {open && <form onSubmit={submit} className="mt-5 border-t border-white/10 pt-5"><div className="grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-[11px] text-white/45">色・テーマ</span><select value={phase} onChange={(event) => setPhase(event.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3">{schedulePhases.slice(1).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label><span className="mb-1 block text-[11px] text-white/45">開始日</span><input required type="date" value={startsOn} onChange={(event) => { setStartsOn(event.target.value); if (endsOn < event.target.value) setEndsOn(event.target.value); }} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]"/></label><label><span className="mb-1 block text-[11px] text-white/45">終了日</span><input required type="date" min={startsOn} value={endsOn} onChange={(event) => setEndsOn(event.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]"/></label><label className="sm:col-span-2"><span className="mb-1 block text-[11px] text-white/45">表示名（任意）</span><input maxLength={100} value={label} onChange={(event) => setLabel(event.target.value)} placeholder={`${schedulePhase(phase).label}（未入力でもOK）`} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3"/></label><select value={audience} onChange={(event) => setAudience(event.target.value as "all" | "class")} className="rounded-lg border border-white/15 bg-black/30 px-4 py-3"><option value="all">全会員</option><option value="class">クラス別</option></select>{audience === "class" && <select value={programClass} onChange={(event) => setProgramClass(event.target.value)} className="rounded-lg border border-white/15 bg-black/30 px-4 py-3">{classes.map((item) => <option key={item}>{item}</option>)}</select>}</div><button disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-black disabled:opacity-40"><Save size={17}/>{saving ? "保存中…" : editingId ? "期間を更新" : "期間を保存"}</button></form>}
    {periods.length > 0 && <div className="mt-5 space-y-2 border-t border-white/10 pt-4">{periods.map((period) => { const theme = schedulePhase(period.phase); return <div key={period.id} className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${theme.badge}`}><i className={`h-3 w-3 shrink-0 rounded-full ${theme.dot}`}/><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{period.label || theme.label}</strong><span className="text-[11px] opacity-70">{period.starts_on.replaceAll("-", "/")}〜{period.ends_on.replaceAll("-", "/")} ・ {period.audience === "all" ? "全会員" : period.program_class}</span></div><button type="button" onClick={() => edit(period)} aria-label="期間を編集" className="p-2 opacity-70 hover:opacity-100"><Pencil size={15}/></button><button type="button" onClick={() => remove(period)} aria-label="期間を削除" className="p-2 text-red-300 opacity-70 hover:opacity-100"><Trash2 size={15}/></button></div>; })}</div>}
  </section>;
}
