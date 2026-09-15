"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type RecordItem = { code: string; label: string; unit: string; value: number; lower: boolean; attempts: number[]; rank: number | null; total: number | null };
type History = { id: string; title: string; measured_on: string; submitted: boolean; rankingReady: boolean; records: RecordItem[] };
export default function Dashboard({ joinCode }: { joinCode: string }) {
  const [data, setData] = useState<{ name: string; history: History[] } | null>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const saved = JSON.parse(localStorage.getItem(`control-test-student-${joinCode}`) ?? "null");
        if (!saved?.token) throw new Error("入力画面で名前と暗証番号を確認してください。");
        const response = await fetch(`/api/scan/join/${joinCode}/dashboard`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token: saved.token, athleteId: saved.athleteId }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (active) { setData(result); setError(""); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "読み込めませんでした。"); }
    }
    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void load(); }, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, [joinCode]);
  const best = new Map<string, RecordItem>();
  for (const h of data?.history ?? []) for (const r of h.records) {
    const old = best.get(r.code);
    if (!old || (r.lower ? r.value < old.value : r.value > old.value)) best.set(r.code, r);
  }
  const selected = best.get(code) ?? [...best.values()][0];
  const points = [...(data?.history ?? [])].reverse().flatMap(h => h.records.filter(r => r.code === selected?.code).map(r => ({ date: h.measured_on, value: r.value })));
  const min = Math.min(...points.map(p => p.value));
  const max = Math.max(...points.map(p => p.value));
  return <main className="mx-auto max-w-3xl px-5 pb-24 pt-28">
    <p className="text-xs font-bold tracking-widest text-emerald-300">MY CONTROL TEST</p>
    <h1 className="mt-2 text-3xl font-black">選手マイページ</h1>
    <p className="mt-3 text-white/60">{data ? `${data.name}さん` : ""}</p>
    <Link className="mt-5 inline-block rounded-xl border border-white/20 px-4 py-3" href={`/scan/join/${joinCode}`}>今回の入力・提出結果へ</Link>
    {error ? <p role="alert" className="mt-6 text-orange-300">{error}</p> : !data ? <p className="mt-6">記録を読み込んでいます…</p> : <>
      <section className="mt-8 rounded-2xl border border-white/10 bg-[#101311] p-5"><h2 className="text-xl font-bold">自己ベスト</h2><div className="mt-4 grid grid-cols-2 gap-3">{[...best.values()].map(r => <div key={r.code} className="rounded-xl bg-black/30 p-4"><p className="text-sm text-white/60">{r.label}</p><p className="mt-2 text-2xl font-bold text-emerald-300">{r.value}<span className="ml-1 text-sm">{r.unit}</span></p></div>)}</div>{!best.size && <p className="mt-4 text-white/50">測定記録はまだありません。</p>}</section>
      {selected && <section className="mt-6 rounded-2xl border border-white/10 p-5"><h2 className="text-xl font-bold">記録の推移</h2><select aria-label="推移を見る種目" className="mt-4 w-full rounded-xl bg-[#101311] p-3" value={selected.code} onChange={e => setCode(e.target.value)}>{[...best.values()].map(r => <option key={r.code} value={r.code}>{r.label}</option>)}</select>
        {points.length > 1 ? <svg role="img" aria-label={`${selected.label}の記録推移。詳細は下の一覧で確認できます。`} viewBox="0 0 400 140" className="mt-4 w-full"><polyline fill="none" stroke="#34d399" strokeWidth="3" points={points.map((p, i) => `${20 + i * 360 / (points.length - 1)},${120 - (p.value - min) / (max - min || 1) * 100}`).join(" ")}/>{points.map((p, i) => <circle key={i} cx={20 + i * 360 / (points.length - 1)} cy={120 - (p.value - min) / (max - min || 1) * 100} r="4" fill="#fb923c"/>)}</svg> : <p className="mt-4 text-sm text-white/50">2回目の測定から推移グラフが表示されます。</p>}
        <ul className="mt-3 text-sm">{points.map((p, i) => <li key={i} className="flex justify-between border-b border-white/10 py-2"><span>{p.date}</span><strong>{p.value} {selected.unit}</strong></li>)}</ul></section>}
      <section className="mt-8"><h2 className="text-xl font-bold">今までの記録</h2>{data.history.map(h => <details key={h.id} className="mt-3 rounded-2xl border border-white/10 bg-[#101311] p-5"><summary className="cursor-pointer font-bold">{h.measured_on}　{h.title}<span className="ml-2 text-xs text-emerald-300">{h.submitted ? "提出済み" : "入力中"}</span></summary><p className="mt-3 text-xs text-white/50">{h.rankingReady ? "男女別順位を公開中" : "ランキングは全員の提出完了後に表示します。"}</p><div className="mt-4 space-y-3">{h.records.map(r => <div key={r.code} className="border-t border-white/10 pt-3"><p>{r.label} <strong className="float-right text-orange-300">{r.value} {r.unit}</strong></p>{r.rank !== null && <p className="mt-2 text-sm text-emerald-300">男女別 {r.rank}位 / {r.total}名</p>}<p className="mt-1 text-xs text-white/50">試技：{Array.isArray(r.attempts) ? r.attempts.join(" / ") : "—"}</p></div>)}{!h.records.length && <p>まだ提出された記録はありません。</p>}</div></details>)}</section>
    </>}
  </main>;
}
