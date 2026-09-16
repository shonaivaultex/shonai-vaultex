"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function EditMeasurement({ teamId, sessionId, measurementId, attempts, updatedAt, unit, label }: {
  teamId: string; sessionId: string; measurementId: string; attempts: number[]; updatedAt: string; unit: string; label: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(attempts.map(String));
  const [saving, setSaving] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const busy = saving || refreshing;
  return <div className="mt-4">
    {!editing ? <button type="button" disabled={busy} onClick={() => { setValues(attempts.map(String)); setMessage(""); setEditing(true); }} className="rounded-xl border border-orange-400/40 px-4 py-2 text-sm font-bold text-orange-300 disabled:opacity-50">記録を編集</button> :
      <form aria-label={`${label}の記録編集`} onSubmit={async event => {
        event.preventDefault();
        const numbers = values.map(Number);
        if (values.some(v => !v.trim()) || numbers.some(n => !Number.isFinite(n) || n <= 0 || n >= 100000)) { setMessage("すべての試技に有効な数値を入力してください。"); return; }
        setSaving(true); setMessage("");
        try {
          const response = await fetch(`/api/scan/teams/${teamId}/sessions/${sessionId}/measurements/${measurementId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attempts: numbers, updatedAt }) });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || "保存できませんでした。");
          setEditing(false); setMessage("保存しました。"); startTransition(() => router.refresh());
        } catch (error) { setMessage(error instanceof Error ? error.message : "通信に失敗しました。再度保存してください。"); }
        finally { setSaving(false); }
      }}>
        <fieldset disabled={busy} className="space-y-3">
          <legend className="mb-2 text-sm font-bold">試技を修正（{unit}）</legend>
          {values.map((value, index) => <label key={index} className="flex items-center gap-2 text-sm">{index + 1}回目<input required type="number" inputMode="decimal" step="any" min="0.000001" max="99999.999999" value={value} onChange={event => setValues(values.map((v, i) => i === index ? event.target.value : v))} className="min-w-0 flex-1 rounded-lg border border-white/20 bg-black px-3 py-2 text-white"/><button type="button" disabled={values.length === 1} onClick={() => setValues(values.filter((_, i) => i !== index))} className="p-2 text-white/60 disabled:opacity-30" aria-label={`${index + 1}回目を取り除く`}>削除</button></label>)}
          <button type="button" disabled={values.length >= 10} onClick={() => setValues([...values, ""])} className="text-sm text-orange-300 disabled:opacity-30">＋ 試技を追加</button>
          <p className="text-xs text-white/50">代表記録は種目に応じて自動計算されます。</p>
          <div className="flex gap-3"><button type="submit" className="rounded-lg bg-orange-500 px-4 py-2 font-bold text-black">{busy ? "保存中…" : "保存"}</button><button type="button" onClick={() => { setEditing(false); setMessage(""); }} className="px-3 py-2 text-sm">キャンセル</button></div>
        </fieldset>
      </form>}
    {message && <p role="status" className="mt-2 text-sm text-orange-200">{message}</p>}
  </div>;
}
