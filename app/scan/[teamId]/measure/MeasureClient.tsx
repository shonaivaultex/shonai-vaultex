"use client";

import { useMemo, useState } from "react";
import { Check, CheckSquare2, LoaderCircle, Save, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { controlTestDefinitions } from "@/lib/control-test";

type Athlete = { id: string; name: string; grade: string | null };
type Values = Record<string, Record<string, string[]>>;

export default function MeasureClient({ teamId, athletes }: { teamId: string; athletes: Athlete[] }) {
  const router = useRouter();
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() => controlTestDefinitions.map((item) => item.code));
  const [testCode, setTestCode] = useState(controlTestDefinitions[0].code);
  const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" }));
  const [values, setValues] = useState<Values>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const selectedTests = controlTestDefinitions.filter((item) => selectedCodes.includes(item.code));
  const definition = controlTestDefinitions.find((item) => item.code === testCode) ?? selectedTests[0];
  const get = (athleteId: string) => values[athleteId]?.[definition.code] ?? ["", ""];
  const setAttempt = (athleteId: string, index: number, value: string) => setValues((current) => ({ ...current, [athleteId]: { ...(current[athleteId] ?? {}), [definition.code]: get(athleteId).map((item, attemptIndex) => attemptIndex === index ? value : item) } }));
  const count = useMemo(() => Object.values(values).filter((tests) => selectedCodes.some((code) => tests[code]?.some(Boolean))).length, [selectedCodes, values]);

  function toggleTest(code: string) {
    setSelectedCodes((current) => {
      const next = current.includes(code) ? current.filter((item) => item !== code) : [...current, code];
      if (code === testCode && !next.includes(code) && next.length) setTestCode(next[0]);
      setMessage(next.length ? "" : "測定種目を1つ以上選択してください。");
      return next;
    });
  }

  function selectAll() {
    if (selectedCodes.length === controlTestDefinitions.length) { setSelectedCodes([]); setMessage("測定種目を1つ以上選択してください。"); }
    else { setSelectedCodes(controlTestDefinitions.map((item) => item.code)); setTestCode(controlTestDefinitions[0].code); setMessage(""); }
  }

  async function save() {
    const entries = Object.entries(values).flatMap(([athleteId, tests]) => Object.entries(tests).flatMap(([code, attempts]) => selectedCodes.includes(code) && attempts.some(Boolean) ? [{ athleteId, testCode: code, attempts: attempts.map(Number).filter((item) => Number.isFinite(item) && item > 0) }] : [])).filter((entry) => entry.attempts.length);
    if (!selectedCodes.length) { setMessage("本日測定する種目を1つ以上選択してください。"); return; }
    if (!entries.length) { setMessage("記録を1件以上入力してください。"); return; }
    setSaving(true); setMessage("");
    try {
      const response = await fetch(`/api/scan/teams/${teamId}/sessions`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date, entries }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error);
      setMessage(`${result.count}件の記録を保存しました。`);
      setTimeout(() => { router.push(`/scan/${teamId}`); router.refresh(); }, 700);
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存できませんでした。"); }
    finally { setSaving(false); }
  }

  return <div className="mt-8">
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[.05] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.16em] text-emerald-300">TODAY&apos;S TEST</p><h2 className="mt-1 text-xl font-black">本日測定する種目</h2><p className="mt-1 text-xs text-white/40">実施する種目だけ選択してください。</p></div><button type="button" onClick={selectAll} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/60">{selectedCodes.length === controlTestDefinitions.length ? "すべて解除" : "すべて選択"}</button></div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{controlTestDefinitions.map((item) => { const selected = selectedCodes.includes(item.code); return <button type="button" key={item.code} onClick={() => toggleTest(item.code)} aria-pressed={selected} className={`flex items-center gap-3 rounded-xl border p-3 text-left text-sm font-bold transition ${selected ? "border-emerald-400/50 bg-emerald-400/10 text-white" : "border-white/10 bg-black/20 text-white/35"}`}>{selected ? <CheckSquare2 size={18} className="shrink-0 text-emerald-300" /> : <Square size={18} className="shrink-0" />}<span>{item.category}{item.code === "speed_endurance_300m" ? "（150m・300m）" : ""}</span></button>; })}</div>
      <p className="mt-3 text-right text-xs font-bold text-emerald-300">{selectedCodes.length}種目を選択中</p>
    </section>
    <div className="mt-4 flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-[#111] p-4"><label className="text-xs font-bold text-white/45">測定日<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-2 block rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white [color-scheme:dark]" /></label><div className="min-w-0 flex-1"><span className="text-xs font-bold text-white/45">入力する種目</span><div className="mt-2 flex gap-2 overflow-x-auto pb-1">{selectedTests.map((item) => <button key={item.code} onClick={() => setTestCode(item.code)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black ${definition.code === item.code ? "border-orange-500 bg-orange-500 text-black" : "border-white/15 text-white/50"}`}>{item.category}</button>)}</div></div></div>
    {definition && selectedCodes.length ? <section className="mt-5 overflow-hidden rounded-3xl border border-orange-500/25 bg-[#101210]"><header className="border-b border-white/10 p-5"><p className="text-xs font-black tracking-[.16em] text-orange-400">{definition.abilityEn}</p><h2 className="mt-1 text-2xl font-black">{definition.category}</h2><p className="mt-2 text-xs text-white/40">2本を入力すると、{definition.betterDirection === "lower" ? "速い" : "大きい"}記録を自動採用します。</p></header><div className="divide-y divide-white/[.07]">{athletes.map((athlete) => <div key={athlete.id} className="grid items-end gap-3 p-4 sm:grid-cols-[1fr_150px_150px_120px]"><div><strong>{athlete.name}</strong><span className="ml-2 text-xs text-white/30">{athlete.grade}</span></div>{get(athlete.id).map((attempt, index) => <label key={index} className="text-[10px] font-black text-white/35">{index + 1}本目<input inputMode="decimal" value={attempt} onChange={(event) => setAttempt(athlete.id, index, event.target.value)} placeholder="記録" className="mt-1 block w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-lg font-black text-white outline-none focus:border-orange-500" /></label>)}<div className="rounded-xl bg-orange-500/10 px-3 py-3 text-center text-xs text-white/35">採用 <strong className="ml-1 text-lg text-orange-300">{(() => { const numbers = get(athlete.id).map(Number).filter((item) => item > 0); return numbers.length ? (definition.betterDirection === "lower" ? Math.min(...numbers) : Math.max(...numbers)) : "—"; })()}</strong></div></div>)}</div></section> : <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/35">上から本日測定する種目を選択してください。</div>}
    <div className="sticky bottom-3 mt-5 flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-[#101411]/95 p-4 backdrop-blur"><span className="mr-auto text-sm font-bold">入力済み {count}/{athletes.length}名</span><button disabled={saving || !selectedCodes.length} onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-black text-black disabled:opacity-40">{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}測定会を保存</button></div>
    {message ? <p className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200"><Check className="mr-2 inline" size={16} />{message}</p> : null}
  </div>;
}
