"use client";

import { useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { schedulePhase, schedulePhases } from "@/lib/schedule-phases";
import type { SchedulePeriod } from "@/lib/schedule-periods";

const today = () => new Date().toISOString().slice(0, 10);

export default function SchedulePeriodManager({ initialPeriods, userId, initialEditingId }: { initialPeriods: SchedulePeriod[]; userId: string; initialEditingId?: number | null }) {
  const router = useRouter();
  const [periods, setPeriods] = useState(initialPeriods);
  const initialEditing = initialPeriods.find((period) => period.id === initialEditingId);
  const [open, setOpen] = useState(Boolean(initialEditing));
  const [editingId, setEditingId] = useState<number | null>(initialEditing?.id ?? null);
  const [phase, setPhase] = useState(initialEditing?.phase ?? "build");
  const [label, setLabel] = useState(initialEditing?.label ?? "");
  const [startsOn, setStartsOn] = useState(initialEditing?.starts_on ?? today());
  const [endsOn, setEndsOn] = useState(initialEditing?.ends_on ?? today());
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

  return <section className="rounded-2xl border border-orange-500/25 bg-[#111] p-5 text-white sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black tracking-[0.2em] text-orange-400">MY TRAINING PERIOD</p><h2 className="mt-1 text-lg font-black">自分用の期間カラー</h2><p className="mt-1 text-xs leading-5 text-white/40">自分のカレンダーだけに表示されます。ほかの会員には共有されません。</p></div><button type="button" onClick={() => { if (open) reset(); else setOpen(true); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-black text-black">{open ? <X size={15}/> : <Plus size={15}/>} {open ? "閉じる" : "期間を追加"}</button></div>
    {open && <form onSubmit={submit} className="mt-5 border-t border-white/10 pt-5"><div className="grid gap-3 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1 block text-[11px] text-white/45">色・テーマ</span><select value={phase} onChange={(event) => setPhase(event.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3">{schedulePhases.slice(1).map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label><span className="mb-1 block text-[11px] text-white/45">開始日</span><input required type="date" value={startsOn} onChange={(event) => { setStartsOn(event.target.value); if (endsOn < event.target.value) setEndsOn(event.target.value); }} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]"/></label><label><span className="mb-1 block text-[11px] text-white/45">終了日</span><input required type="date" min={startsOn} value={endsOn} onChange={(event) => setEndsOn(event.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]"/></label><label className="sm:col-span-2"><span className="mb-1 block text-[11px] text-white/45">表示名（任意）</span><input maxLength={100} value={label} onChange={(event) => setLabel(event.target.value)} placeholder={`${schedulePhase(phase).label}（未入力でもOK）`} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3"/></label></div><button disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-black disabled:opacity-40"><Save size={17}/>{saving ? "保存中…" : editingId ? "期間を更新" : "期間を保存"}</button></form>}
    {!open && periods.length > 0 && <p className="mt-4 border-t border-white/10 pt-4 text-xs leading-5 text-white/40">登録済みの期間は、カレンダーの色が付いた日を選ぶと編集・削除できます。</p>}
  </section>;
}
