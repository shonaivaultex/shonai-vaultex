"use client";

import { Plus, Trash2 } from "lucide-react";
import type { CompetitionDetailInput, CompetitionDetailStatus } from "@/lib/competition-details";
import { attemptStatusLabels } from "@/lib/competition-details";

type Props = {
  mode: "attempt" | "round";
  details: CompetitionDetailInput[];
  onChange: (details: CompetitionDetailInput[]) => void;
  unit: string;
  needsWind: boolean;
};

const roundOptions = ["予選", "準決勝", "決勝", "タイムレース", "その他"];

export default function CompetitionDetailEditor({ mode, details, onChange, unit, needsWind }: Props) {
  const update = (index: number, patch: Partial<CompetitionDetailInput>) => onChange(details.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  const addRound = () => {
    if (details.length >= 6) return;
    const used = new Set(details.map((item) => item.roundName));
    const roundName = roundOptions.find((option) => !used.has(option)) ?? "その他";
    onChange([...details, { sequenceNumber: details.length + 1, roundName, value: "", windSpeed: "", place: "", status: "valid" }]);
  };
  const removeRound = (index: number) => onChange(details.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, sequenceNumber: itemIndex + 1 })));

  return <section className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.045] p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black tracking-[.16em] text-orange-300">{mode === "attempt" ? "試技ごとの記録" : "ラウンドごとの記録"}</p><p className="mt-1 text-xs leading-5 text-white/45">{mode === "attempt" ? "1〜6回目を残し、最高記録を代表記録にします。" : "準決勝がない場合は追加不要です。最も良いタイムを代表記録にします。"}</p></div>{mode === "round" && details.length < 6 ? <button type="button" onClick={addRound} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-orange-400/40 px-3 py-2 text-xs font-black text-orange-300"><Plus size={14}/>ラウンド追加</button> : null}</div>
    <div className="mt-4 space-y-3">{details.map((detail, index) => <div key={`${mode}-${index}`} className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-center gap-2">
        {mode === "attempt" ? <strong className="min-w-16 text-sm text-white">{index + 1}回目</strong> : <select aria-label={`${index + 1}番目のラウンド`} value={detail.roundName ?? "予選"} onChange={(event) => update(index, { roundName: event.target.value })} className="min-w-28 rounded-lg border border-white/15 bg-[#101216] px-3 py-2 text-sm font-bold text-white">{roundOptions.map((option) => <option key={option}>{option}</option>)}</select>}
        <select aria-label={`${index + 1}番目の状態`} value={detail.status} onChange={(event) => update(index, { status: event.target.value as CompetitionDetailStatus, value: event.target.value === "valid" ? detail.value : "", windSpeed: event.target.value === "valid" ? detail.windSpeed : "" })} className="rounded-lg border border-white/15 bg-[#101216] px-3 py-2 text-sm text-white">{(mode === "attempt" ? ["valid", "foul", "pass"] : ["valid", "dns", "dnf", "dq"]).map((status) => <option key={status} value={status}>{attemptStatusLabels[status as CompetitionDetailStatus]}</option>)}</select>
        {mode === "round" && details.length > 1 ? <button type="button" onClick={() => removeRound(index)} aria-label="このラウンドを削除" className="ml-auto p-2 text-red-300"><Trash2 size={16}/></button> : null}
      </div>
      {detail.status === "valid" ? <div className={`mt-3 grid gap-2 ${needsWind || mode === "round" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <label className="relative"><span className="sr-only">記録</span><input inputMode="decimal" value={detail.value ?? ""} onChange={(event) => update(index, { value: event.target.value })} placeholder="記録" className="w-full rounded-lg border border-white/15 bg-[#101216] px-3 py-3 pr-14 font-bold text-white outline-none focus:border-orange-400"/><span className="pointer-events-none absolute right-3 top-3 text-xs text-white/35">{unit}</span></label>
        {needsWind ? <label className="relative"><span className="sr-only">風速</span><input inputMode="decimal" value={detail.windSpeed ?? ""} onChange={(event) => update(index, { windSpeed: event.target.value })} placeholder="風速" className="w-full rounded-lg border border-white/15 bg-[#101216] px-3 py-3 pr-12 font-bold text-white outline-none focus:border-orange-400"/><span className="pointer-events-none absolute right-3 top-3 text-xs text-white/35">m/s</span></label> : null}
        {mode === "round" ? <label className="relative"><span className="sr-only">順位</span><input inputMode="numeric" value={detail.place ?? ""} onChange={(event) => update(index, { place: event.target.value })} placeholder="順位（任意）" className="w-full rounded-lg border border-white/15 bg-[#101216] px-3 py-3 pr-8 font-bold text-white outline-none focus:border-orange-400"/><span className="pointer-events-none absolute right-3 top-3 text-xs text-white/35">位</span></label> : null}
      </div> : null}
    </div>)}</div>
  </section>;
}
