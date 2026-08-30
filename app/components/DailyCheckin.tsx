"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronRight, Gauge, History, LoaderCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export type DailyCheckinValue = {
  condition_score: number;
  fatigue_score: number;
  mood_score: number;
  note: string | null;
};

const scales = [
  { key: "condition_score" as const, label: "体調", low: "重い", high: "絶好調" },
  { key: "fatigue_score" as const, label: "疲労", low: "少ない", high: "強い" },
  { key: "mood_score" as const, label: "気分", low: "低め", high: "高い" },
];

const scoreLabels: Record<number, string> = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5" };

export default function DailyCheckin({ userId, date, initialValue }: { userId: string; date: string; initialValue: DailyCheckinValue | null }) {
  const [value, setValue] = useState<DailyCheckinValue | null>(initialValue);
  const [draft, setDraft] = useState<DailyCheckinValue>(initialValue ?? { condition_score: 3, fatigue_score: 3, mood_score: 3, note: null });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startEditing() {
    setDraft(value ?? { condition_score: 3, fatigue_score: 3, mood_score: 3, note: null });
    setError("");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    setError("");
    const supabase = createClient();
    const row = { user_id: userId, checkin_date: date, ...draft, note: draft.note?.trim() || null, updated_at: new Date().toISOString() };
    const { data, error: saveError } = await supabase.from("daily_checkins").upsert(row, { onConflict: "user_id,checkin_date" }).select("condition_score,fatigue_score,mood_score,note").single();
    setSaving(false);
    if (saveError) {
      setError("保存できませんでした。通信状況を確認して、もう一度お試しください。");
      return;
    }
    setValue(data as DailyCheckinValue);
    setOpen(false);
  }

  return <>
    <button type="button" onClick={startEditing} className={`group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${value ? "border-emerald-400/25 bg-emerald-400/[.06] hover:border-emerald-300/45" : "border-orange-400/30 bg-orange-400/[.08] hover:border-orange-300/55"}`}>
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${value ? "bg-emerald-400/15 text-emerald-300" : "bg-orange-500/15 text-orange-300"}`}>{value ? <Check size={20}/> : <Gauge size={20}/>}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[9px] font-black tracking-[.18em] ${value ? "text-emerald-300" : "text-orange-300"}`}>TODAY&apos;S CHECK-IN</span>
        <strong className="mt-0.5 block text-sm">{value ? "今日のチェックイン済み" : "30秒で今日の状態を記録"}</strong>
        {value ? <span className="mt-1 block truncate text-[10px] text-white/40">体調 {value.condition_score} ・ 疲労 {value.fatigue_score} ・ 気分 {value.mood_score}{value.note ? ` ・ ${value.note}` : ""}</span> : <span className="mt-1 block text-[10px] text-white/40">体調・疲労・気分を残して、自分の変化を知る</span>}
      </span>
      <ChevronRight size={17} className="shrink-0 text-white/30 transition group-hover:translate-x-0.5"/>
    </button>
    <div className="mt-2 flex justify-end"><Link href="/mypage/checkins" className="inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-white/40 transition hover:text-orange-300"><History size={13}/>これまでの状態を見る</Link></div>

    {open ? <div className="fixed inset-0 z-[120] grid place-items-end bg-black/75 p-2 backdrop-blur-sm sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="daily-checkin-title">
      <div className="max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-[26px] border border-orange-400/35 bg-[#111] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">TODAY&apos;S CHECK-IN</p><h2 id="daily-checkin-title" className="mt-1 text-2xl font-black">今日の状態を記録</h2><p className="mt-2 text-xs leading-5 text-white/45">考えすぎず、今の感覚に近い数字を選んでください。</p></div><button type="button" onClick={() => setOpen(false)} aria-label="閉じる" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[.07] text-white/60"><X size={19}/></button></div>
        <div className="mt-6 space-y-5">{scales.map((scale) => <fieldset key={scale.key}><div className="flex items-end justify-between"><legend className="font-black">{scale.label}</legend><span className="text-[10px] text-white/35">{scale.low} ← → {scale.high}</span></div><div className="mt-2 grid grid-cols-5 gap-2">{[1,2,3,4,5].map((score) => <button key={score} type="button" onClick={() => setDraft((current) => ({ ...current, [scale.key]: score }))} aria-pressed={draft[scale.key] === score} className={`min-h-12 rounded-xl border text-sm font-black transition ${draft[scale.key] === score ? "border-orange-400 bg-orange-500 text-black" : "border-white/10 bg-white/[.025] text-white/45 hover:border-white/25"}`}>{scoreLabels[score]}</button>)}</div></fieldset>)}</div>
        <label className="mt-6 block"><span className="text-sm font-black">今日のひとこと <small className="font-normal text-white/35">（任意）</small></span><textarea value={draft.note ?? ""} maxLength={200} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))} placeholder="例：身体は軽い。今日はリズムを大切にする" className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-black/25 p-3 text-sm outline-none transition placeholder:text-white/25 focus:border-orange-400"/></label>
        {error ? <p role="alert" className="mt-3 text-xs font-bold text-rose-300">{error}</p> : null}
        <button type="button" disabled={saving} onClick={save} className="mt-5 flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-black text-black transition hover:bg-orange-400 disabled:opacity-50">{saving ? <LoaderCircle size={18} className="animate-spin"/> : <Check size={18}/>}チェックインを保存</button>
      </div>
    </div> : null}
  </>;
}
