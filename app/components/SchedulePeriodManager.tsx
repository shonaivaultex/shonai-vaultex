"use client";

import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { schedulePhase, schedulePhases } from "@/lib/schedule-phases";
import type { SchedulePeriod } from "@/lib/schedule-periods";

const today = () => new Date().toISOString().slice(0, 10);

export default function SchedulePeriodManager({ initialPeriods, userId, initialEditingId, initialDate }: { initialPeriods: SchedulePeriod[]; userId: string; initialEditingId?: number | null; initialDate?: string }) {
  const router = useRouter();
  const [, setPeriods] = useState(initialPeriods);
  const initialEditing = initialPeriods.find((period) => period.id === initialEditingId);
  const [open, setOpen] = useState(Boolean(initialEditing || initialDate));
  const [editingId, setEditingId] = useState<number | null>(initialEditing?.id ?? null);
  const [phase, setPhase] = useState(initialEditing?.phase ?? "build");
  const [label, setLabel] = useState(initialEditing?.label ?? "");
  const [startsOn, setStartsOn] = useState(initialEditing?.starts_on ?? initialDate ?? today());
  const [endsOn, setEndsOn] = useState(initialEditing?.ends_on ?? initialDate ?? today());
  const [saving, setSaving] = useState(false);

  function reset() {
    setEditingId(null); setPhase("build"); setLabel(""); setStartsOn(today()); setEndsOn(today()); setOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (endsOn < startsOn) { alert("終了日は開始日以降にしてください。"); return; }
    setSaving(true);
    const supabase = createClient();
    const row = { author_id: userId, label: label.trim() || null, phase, starts_on: startsOn, ends_on: endsOn, audience: "all", program_class: null, updated_at: new Date().toISOString() };
    const query = editingId ? supabase.from("schedule_periods").update(row).eq("id", editingId).eq("author_id", userId) : supabase.from("schedule_periods").insert(row);
    const { data, error } = await query.select("*").single();
    setSaving(false);
    if (error) { alert(`期間を保存できませんでした。${error.message}`); return; }
    setPeriods((current) => editingId ? current.map((item) => item.id === editingId ? data as SchedulePeriod : item) : [...current, data as SchedulePeriod].sort((a, b) => a.starts_on.localeCompare(b.starts_on)));
    reset(); router.refresh();
  }

  return <section className={`border bg-[#111] text-white transition ${open ? "rounded-2xl border-orange-500/25 p-5 sm:p-6" : "rounded-xl border-white/10 px-4 py-3"}`}>
    <div className={`flex justify-between gap-4 ${open ? "items-start" : "items-center"}`}><div>{open ? <p className="text-[10px] font-black tracking-[0.2em] text-orange-400">MY TRAINING PERIOD</p> : null}<h2 className={`${open ? "mt-1 text-lg" : "text-sm"} font-black`}>{open ? "自分用の期間カラー" : "期間カラーを設定"}</h2>{open ? <p className="mt-1 text-xs leading-5 text-white/40">自分のカレンダーだけに表示されます。ほかの会員には共有されません。</p> : <p className="mt-0.5 text-[10px] text-white/35">強化期・調整期などを自分のカレンダーに色分け</p>}</div><button type="button" onClick={() => { if (open) reset(); else setOpen(true); }} className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black ${open ? "bg-orange-500 text-black" : "border border-orange-500/30 bg-orange-500/10 text-orange-300"}`}>{open ? <X size={15}/> : <Plus size={15}/>} {open ? "閉じる" : "設定する"}</button></div>
    {open && <form onSubmit={submit} className="mt-5 border-t border-white/10 pt-5"><div className="grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-[11px] text-white/45">色・テーマ</span><select value={phase} onChange={(event) => setPhase(event.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3">{schedulePhases.slice(1).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label><span className="mb-1 block text-[11px] text-white/45">開始日</span><input required type="date" value={startsOn} onChange={(event) => { setStartsOn(event.target.value); if (endsOn < event.target.value) setEndsOn(event.target.value); }} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]"/></label><label><span className="mb-1 block text-[11px] text-white/45">終了日</span><input required type="date" min={startsOn} value={endsOn} onChange={(event) => setEndsOn(event.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]"/></label><label className="sm:col-span-2"><span className="mb-1 block text-[11px] text-white/45">表示名（任意）</span><input maxLength={100} value={label} onChange={(event) => setLabel(event.target.value)} placeholder={`${schedulePhase(phase).label}（未入力でもOK）`} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3"/></label></div><button disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-black disabled:opacity-40"><Save size={17}/>{saving ? "保存中…" : editingId ? "期間を更新" : "期間を保存"}</button></form>}
  </section>;
}
