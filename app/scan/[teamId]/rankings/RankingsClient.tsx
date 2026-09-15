"use client";

import { useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { controlTestByCode } from "@/lib/control-test";

type Session = { id: string; title: string; measured_on: string };
type RecordRow = { id: number; session_id: string; athlete_id: string; test_code: string; primary_value: number; athlete_name: string; gender: string | null };

export default function RankingsClient({ sessions, records }: { sessions: Session[]; records: RecordRow[] }) {
  const [scope, setScope] = useState<"session" | "overall">("session");
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const availableTests = useMemo(() => [...new Set(records.filter((row) => scope === "overall" || row.session_id === sessionId).map((row) => row.test_code))], [records, scope, sessionId]);
  const [selectedTest, setSelectedTest] = useState("");
  const testCode = availableTests.includes(selectedTest) ? selectedTest : availableTests[0] ?? "";
  const definition = controlTestByCode[testCode];

  const ranked = useMemo(() => {
    const relevant = records.filter((row) => row.test_code === testCode && (scope === "overall" || row.session_id === sessionId));
    const bestByAthlete = new Map<string, RecordRow>();
    for (const row of relevant) {
      const current = bestByAthlete.get(row.athlete_id);
      if (!current || (definition?.betterDirection === "lower" ? row.primary_value < current.primary_value : row.primary_value > current.primary_value)) bestByAthlete.set(row.athlete_id, row);
    }
    return [...bestByAthlete.values()].sort((a, b) => definition?.betterDirection === "lower" ? a.primary_value - b.primary_value : b.primary_value - a.primary_value);
  }, [definition?.betterDirection, records, scope, sessionId, testCode]);

  const groups = (["male", "female"] as const).map((gender) => ({ gender, rows: ranked.filter((row) => row.gender === gender) }));
  return <>
    <section className="mt-7 rounded-3xl border border-white/10 bg-[#101311] p-5 sm:p-7">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-black text-white/40">集計範囲<select value={scope} onChange={(event) => setScope(event.target.value as "session" | "overall")} className="mt-2 block w-full rounded-xl border border-white/15 bg-[#090b0a] px-4 py-3 text-sm text-white"><option value="session">測定会ごと</option><option value="overall">全記録のベスト</option></select></label>
        <label className="text-xs font-black text-white/40">測定会<select disabled={scope === "overall"} value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/15 bg-[#090b0a] px-4 py-3 text-sm text-white disabled:opacity-35">{sessions.map((session) => <option key={session.id} value={session.id}>{session.measured_on}　{session.title}</option>)}</select></label>
        <label className="text-xs font-black text-white/40">測定種目<select value={testCode} onChange={(event) => setSelectedTest(event.target.value)} className="mt-2 block w-full rounded-xl border border-white/15 bg-[#090b0a] px-4 py-3 text-sm text-white">{availableTests.map((code) => <option key={code} value={code}>{controlTestByCode[code]?.category ?? code}</option>)}</select></label>
      </div>
      {scope === "overall" ? <p className="mt-4 text-xs text-white/35">これまでに保存された全測定会から、選手ごとの自己ベストを比較します。</p> : null}
    </section>
    {!testCode ? <p className="mt-8 rounded-3xl border border-dashed border-white/15 p-12 text-center text-sm text-white/35">表示できる記録がまだありません。</p> : <div className="mt-6 grid gap-6 lg:grid-cols-2">{groups.map((group) => <section key={group.gender} className="overflow-hidden rounded-3xl border border-white/10 bg-[#0f1110]"><header className="flex items-center gap-3 border-b border-white/10 p-5"><Trophy className={group.gender === "male" ? "text-sky-400" : "text-rose-400"} size={20}/><div><p className="text-xs font-black tracking-[.14em] text-white/35">{group.gender === "male" ? "BOYS" : "GIRLS"}</p><h2 className="font-black">{group.gender === "male" ? "男子" : "女子"}ランキング</h2></div><span className="ml-auto text-xs text-white/35">{group.rows.length}名</span></header><ol className="divide-y divide-white/[.07]">{group.rows.length ? group.rows.map((row, index) => <li key={row.athlete_id} className="flex items-center gap-4 px-5 py-4"><span className={`grid size-9 place-items-center rounded-full text-sm font-black ${index === 0 ? "bg-orange-500 text-black" : index < 3 ? "bg-white/10 text-white" : "text-white/35"}`}>{index + 1}</span><strong>{row.athlete_name}</strong><span className="ml-auto text-xl font-black text-orange-300">{row.primary_value}<small className="ml-1 text-xs text-white/40">{definition?.unit}</small></span></li>) : <li className="p-10 text-center text-sm text-white/30">該当する記録がありません</li>}</ol></section>)}</div>}
    {ranked.some((row) => !["male", "female"].includes(row.gender ?? "")) ? <p className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-xs text-amber-200">男女区分が未設定の選手はランキングに表示されません。名簿登録時に区分を設定してください。</p> : null}
  </>;
}
