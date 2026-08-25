"use client";

import { Plus, Trash2 } from "lucide-react";
import { barSummary, combinedEventCoefficients, combinedPoints, type BarHeightRow, type CombinedEventResult } from "@/lib/advanced-performance-details";

export function BarAttemptEditor({ rows, onChange }: { rows: BarHeightRow[]; onChange: (rows: BarHeightRow[]) => void }) {
  const summary = barSummary(rows);
  const update = (index: number, row: BarHeightRow) => onChange(rows.map((item, itemIndex) => itemIndex === index ? row : item));
  return <section className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.045] p-4">
    <p className="text-xs font-black tracking-[.15em] text-orange-300">高さ別の試技</p>
    <p className="mt-1 text-xs leading-5 text-white/45">高さを入力し、各試技を○・×・パスで残します。3回連続の×で終了します。</p>
    <div className="mt-4 space-y-3">{rows.map((row, index) => <div key={index} className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-3">
      <label className="relative w-28"><span className="sr-only">{index + 1}段目の高さ</span><input inputMode="decimal" value={row.height} onChange={(event) => update(index, { ...row, height: event.target.value })} placeholder="高さ" className="w-full rounded-lg border border-white/15 bg-[#101216] px-3 py-2 pr-8 font-bold text-white"/><span className="absolute right-2 top-2.5 text-xs text-white/35">m</span></label>
      {row.attempts.map((attempt, attemptIndex) => <div key={attemptIndex} className="flex gap-1"><span className="sr-only">{attemptIndex + 1}回目</span>{(["o","x","pass"] as const).map((result) => <button key={result} type="button" onClick={() => { const attempts = [...row.attempts] as BarHeightRow["attempts"]; attempts[attemptIndex] = attempt === result ? null : result; update(index, { ...row, attempts }); }} className={`h-9 min-w-9 rounded-lg border text-xs font-black ${attempt === result ? result === "o" ? "border-emerald-400 bg-emerald-400/20 text-emerald-200" : result === "x" ? "border-red-400 bg-red-400/20 text-red-200" : "border-white/40 bg-white/10 text-white" : "border-white/15 text-white/40"}`}>{result === "o" ? "○" : result === "x" ? "×" : "—"}</button>)}</div>)}
      {rows.length > 1 ? <button type="button" aria-label="この高さを削除" onClick={() => onChange(rows.filter((_, itemIndex) => itemIndex !== index))} className="ml-auto p-2 text-red-300"><Trash2 size={16}/></button> : null}
    </div>)}</div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={() => onChange([...rows, { height: "", attempts: [null,null,null] }])} className="inline-flex items-center gap-1 rounded-lg border border-orange-400/35 px-3 py-2 text-xs font-black text-orange-300"><Plus size={14}/>高さを追加</button><p className="text-sm font-black text-emerald-300">記録：{summary.bestHeight ? `${summary.bestHeight}m` : "—"}{summary.endedByThreeMisses ? "（3連続×で終了）" : ""}</p></div>
  </section>;
}

export function CombinedEventEditor({ discipline, results, onChange }: { discipline: string; results: CombinedEventResult[]; onChange: (results: CombinedEventResult[]) => void }) {
  const coefficients = combinedEventCoefficients(discipline);
  const normalized = coefficients.map((coefficient, index) => results[index] ?? { event: coefficient.event, value: "", points: null });
  const total = normalized.reduce((sum, item) => sum + (item.points ?? 0), 0);
  const complete = normalized.every((item) => item.value !== "" && item.points !== null);
  const update = (index: number, value: string) => onChange(normalized.map((item, itemIndex) => itemIndex === index ? { ...item, value, points: combinedPoints(coefficients[index], Number(value)) } : item));
  return <section className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.045] p-4">
    <p className="text-xs font-black tracking-[.15em] text-orange-300">種目別記録・得点計算</p><p className="mt-1 text-xs text-white/45">各記録からWorld Athleticsの混成競技得点式で自動計算します。未実施は空欄のままにできます。</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">{normalized.map((item,index) => <label key={item.event} className="grid grid-cols-[1fr_110px_58px] items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-3"><strong className="text-sm">{item.event}</strong><input inputMode="decimal" value={item.value} onChange={(event) => update(index,event.target.value)} placeholder="記録" className="min-w-0 rounded-lg border border-white/15 bg-[#101216] px-3 py-2 text-white"/><span className="text-right text-xs font-black text-orange-300">{item.points ?? "—"}点</span></label>)}</div>
    <p className={`mt-4 text-right text-lg font-black ${complete ? "text-emerald-300" : "text-orange-300"}`}>{complete ? "合計" : "入力済み小計"} {total}点</p>
  </section>;
}
