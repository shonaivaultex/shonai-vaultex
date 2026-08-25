"use client";

import { Plus, Trash2 } from "lucide-react";
import { barSummary, combinedEventCoefficients, combinedPoints, type BarHeightRow, type CombinedEventResult } from "@/lib/advanced-performance-details";

export function BarAttemptEditor({ rows, onChange }: { rows: BarHeightRow[]; onChange: (rows: BarHeightRow[]) => void }) {
  const summary = barSummary(rows);
  const update = (index: number, row: BarHeightRow) => onChange(rows.map((item, itemIndex) => itemIndex === index ? row : item));
  return <section className="overflow-hidden rounded-2xl border border-orange-500/35 bg-[#111214] shadow-[0_16px_50px_rgba(0,0,0,.28)]">
    <div className="border-b border-white/10 bg-gradient-to-r from-orange-500/10 to-transparent p-4">
      <p className="text-xs font-black tracking-[.18em] text-orange-300">BAR EVENT ATTEMPTS</p>
      <h3 className="mt-1 text-lg font-black text-white">高さ別の試技記録</h3>
      <p className="mt-1 text-xs leading-5 text-white/45">○＝成功　×＝失敗　—＝パス。3回連続の×で記録を確定します。</p>
    </div>
    <div className="overflow-x-auto p-3 sm:p-4"><div className="min-w-[560px]">
      <div className="grid grid-cols-[140px_repeat(3,minmax(112px,1fr))_40px] gap-2 px-2 pb-2 text-center text-[10px] font-black tracking-[.12em] text-white/45"><span className="text-left">HEIGHT</span><span>1回目</span><span>2回目</span><span>3回目</span><span/></div>
      <div className="space-y-2">{rows.map((row, index) => <div key={index} className="grid grid-cols-[140px_repeat(3,minmax(112px,1fr))_40px] items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2">
        <label className="relative"><span className="sr-only">{index + 1}段目の高さ</span><input inputMode="decimal" value={row.height} onChange={(event) => update(index, { ...row, height: event.target.value })} placeholder="1.80" className="h-12 w-full rounded-lg border border-orange-400/35 bg-[#0d0e10] px-3 pr-8 text-lg font-black text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/15"/><span className="absolute right-2 top-4 text-xs font-bold text-white/35">m</span></label>
        {row.attempts.map((attempt, attemptIndex) => <div key={attemptIndex} className="grid h-12 grid-cols-3 overflow-hidden rounded-lg border border-white/10 bg-[#0d0e10]" aria-label={`${attemptIndex + 1}回目`}>{(["o","x","pass"] as const).map((result) => <button key={result} type="button" title={result === "o" ? "成功" : result === "x" ? "失敗" : "パス"} onClick={() => { const attempts = [...row.attempts] as BarHeightRow["attempts"]; attempts[attemptIndex] = attempt === result ? null : result; update(index, { ...row, attempts }); }} className={`border-r border-white/10 text-base font-black transition last:border-r-0 ${attempt === result ? result === "o" ? "bg-emerald-400 text-[#07120e]" : result === "x" ? "bg-red-500 text-white" : "bg-white/20 text-white" : "text-white/30 hover:bg-white/[.07] hover:text-white"}`}>{result === "o" ? "○" : result === "x" ? "×" : "—"}</button>)}</div>)}
        {rows.length > 1 ? <button type="button" aria-label="この高さを削除" onClick={() => onChange(rows.filter((_, itemIndex) => itemIndex !== index))} className="grid h-10 w-10 place-items-center rounded-lg text-red-300/70 transition hover:bg-red-500/10 hover:text-red-300"><Trash2 size={16}/></button> : <span/>}
      </div>)}</div>
    </div></div>
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3"><button type="button" onClick={() => onChange([...rows, { height: "", attempts: [null,null,null] }])} className="inline-flex items-center gap-1 rounded-lg border border-orange-400/35 px-3 py-2 text-xs font-black text-orange-300"><Plus size={14}/>高さを追加</button><p className="text-sm font-black text-emerald-300">記録：{summary.bestHeight ? `${summary.bestHeight}m` : "—"}{summary.endedByThreeMisses ? "（3連続×で終了）" : ""}</p></div>
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
