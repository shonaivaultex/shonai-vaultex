"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BarChart3, ChevronDown, History, Pencil, Save, SlidersHorizontal, Users } from "lucide-react";
import { abilityKeys, evaluateAthleteScan, type AthleteMeasurement, type AthleteScanEvaluation, type AthleteStandard, type TypeSettings } from "@/lib/athlete-scan";
import type { ContactProfileSettings } from "@/lib/contact-profile";

type StandardRow = AthleteStandard & { id: number; updated_at: string };
type ScanRow = { id: string; user_id: string; profile_snapshot: Record<string, unknown>; control_test_measurements: AthleteMeasurement[] | null };
type Player = { user_id: string; name: string; gender: "male" | "female" | null };
type HistoryRow = { id: number; from_version: string; to_version: string; change_kind: string; gender: string | null; test_code: string | null; field_name: string; old_value: unknown; new_value: unknown; reason: string; changed_at: string; changed_by: string };
type StandardDraft = { id: number; score100: string; score0: string; status: "active" | "pending" | "retired"; notes: string };
type ImpactItem = { userId: string; name: string; before: AthleteScanEvaluation; after: AthleteScanEvaluation };
type ImpactSummary = { changed: ImpactItem[]; athletes: number; average: number; maximum: number; typeChanges: ImpactItem[]; axes: Array<{axis:keyof typeof axisNames;before:number;after:number}> };

const testNames: Record<string, string> = {
  acceleration_30m: "Flying 30m", standing_long_jump: "立幅跳", standing_five_bound: "立三段跳／立五段跳",
  shot_front_throw: "フロント投げ", shot_back_throw: "バック投げ", rebound_jump: "RJ-index", speed_endurance_300m: "150m／300m",
};
const axisNames = { SPEED: "SPEED", POWER: "POWER", REACTIVE: "REACTIVE" } as const;
const format = (value: unknown) => value == null || value === "" ? "未設定" : String(value);
const signed = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(1)}`;
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

function standardUnit(row: StandardRow) {
  if (row.test_code === "rebound_jump") return "RJ-index";
  if (row.test_code === "acceleration_30m" || row.test_code === "speed_endurance_300m") return "秒";
  return "m";
}

function scoreList(evaluation: AthleteScanEvaluation) {
  return abilityKeys.flatMap((key) => evaluation.abilities[key].score == null ? [] : [evaluation.abilities[key].score!]);
}

export default function AthleteStandardAdmin({ version, label, standards, settings, scans, players, history, contactSettings }: { version: string; label: string; standards: StandardRow[]; settings: TypeSettings; scans: ScanRow[]; players: Player[]; history: HistoryRow[]; contactSettings: ContactProfileSettings | null }) {
  const [gender, setGender] = useState<"male" | "female">("male");
  const [draft, setDraft] = useState<StandardDraft | null>(null);
  const [balanced, setBalanced] = useState(String(settings.balanced_max_spread));
  const [combined, setCombined] = useState(String(settings.composite_max_gap));
  const [previewKind, setPreviewKind] = useState<"standard" | "settings" | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [quickMs,setQuickMs]=useState(String(contactSettings?.quick_upper_ms??188));
  const [balancedMs,setBalancedMs]=useState(String(contactSettings?.balanced_upper_ms??222));
  const [juniorDrop,setJuniorDrop]=useState(String(contactSettings?.junior_drop_height_cm??20));
  const [otherDrop,setOtherDrop]=useState(String(contactSettings?.elite_drop_height_cm??30));
  const playerMap = useMemo(() => new Map(players.map((player) => [player.user_id, player])), [players]);

  const candidateStandards = useMemo(() => standards.map((row) => draft && row.id === draft.id ? { ...row, score_100_value: draft.score100 === "" ? null : Number(draft.score100), score_0_value: draft.score0 === "" ? null : Number(draft.score0), status: draft.status, notes: draft.notes || null } : row), [standards, draft]);
  const candidateSettings = useMemo<TypeSettings>(() => ({ ...settings, balanced_max_spread: Number(balanced), composite_max_gap: Number(combined) }), [settings, balanced, combined]);
  const impact = useMemo(() => {
    const items: ImpactItem[] = [];
    for (const scan of scans) {
      const scanGender = String(scan.profile_snapshot?.gender ?? playerMap.get(scan.user_id)?.gender ?? "");
      if (scanGender !== "male" && scanGender !== "female") continue;
      const currentRows = standards.filter((row) => row.gender === scanGender);
      const proposedRows = candidateStandards.filter((row) => row.gender === scanGender);
      const before = evaluateAthleteScan(scan.control_test_measurements ?? [], currentRows, settings);
      const after = evaluateAthleteScan(scan.control_test_measurements ?? [], proposedRows, candidateSettings);
      items.push({ userId: scan.user_id, name: playerMap.get(scan.user_id)?.name ?? "会員", before, after });
    }
    const changed = items.filter((item) => JSON.stringify(item.before) !== JSON.stringify(item.after));
    const scoreDiffs = changed.flatMap((item) => {
      const before = scoreList(item.before); const after = scoreList(item.after);
      return before.flatMap((value, index) => after[index] == null ? [] : [after[index] - value]);
    });
    const typeChanges = changed.filter((item) => item.before.typeCode !== item.after.typeCode);
    const axes = (["SPEED", "POWER", "REACTIVE"] as const).map((axis) => {
      const before = changed.flatMap((item) => item.before.axes[axis] == null ? [] : [item.before.axes[axis]!]);
      const after = changed.flatMap((item) => item.after.axes[axis] == null ? [] : [item.after.axes[axis]!]);
      return { axis, before: mean(before), after: mean(after) };
    });
    return { items, changed, scoreDiffs, typeChanges, axes, athletes: new Set(changed.map((item) => item.userId)).size, average: mean(scoreDiffs), maximum: scoreDiffs.length ? Math.max(...scoreDiffs.map(Math.abs)) : 0 };
  }, [scans, playerMap, standards, candidateStandards, settings, candidateSettings]);

  const dashboard = useMemo(() => {
    const evaluations = scans.flatMap((scan) => {
      const scanGender = String(scan.profile_snapshot?.gender ?? playerMap.get(scan.user_id)?.gender ?? "");
      if (scanGender !== "male" && scanGender !== "female") return [];
      return [evaluateAthleteScan(scan.control_test_measurements ?? [], standards.filter((row) => row.gender === scanGender), settings)];
    });
    const distribution: Record<string, number> = {};
    evaluations.forEach((item) => { if (item.typeCode) distribution[item.typeCode] = (distribution[item.typeCode] ?? 0) + 1; });
    return { athletes: new Set(scans.map((scan) => scan.user_id)).size, complete: evaluations.filter((item) => item.typeCode).length, incomplete: evaluations.filter((item) => !item.typeCode).length, beyond: evaluations.filter((item) => scoreList(item).some((score) => score >= 100)).length, distribution };
  }, [scans, playerMap, standards, settings]);

  function resetPreview() { setPreviewKind(null); setConfirmed(false); setMessage(""); }
  function edit(row: StandardRow) { setDraft({ id: row.id, score100: row.score_100_value == null ? "" : String(row.score_100_value), score0: row.score_0_value == null ? "" : String(row.score_0_value), status: row.status as StandardDraft["status"], notes: row.notes ?? "" }); resetPreview(); }
  function validDraft() { if (!draft) return false; const hundred = draft.score100 === "" ? null : Number(draft.score100); const zero = draft.score0 === "" ? null : Number(draft.score0); return (hundred == null || (Number.isFinite(hundred) && hundred >= 0)) && (zero == null || (Number.isFinite(zero) && zero >= 0)); }

  async function save() {
    if (!previewKind || !confirmed || reason.trim().length < 3) return;
    setSaving(true); setMessage("");
    const change = previewKind === "standard" && draft ? { kind: "standard", standardId: draft.id, score100: draft.score100 === "" ? null : Number(draft.score100), score0: draft.score0 === "" ? null : Number(draft.score0), status: draft.status, notes: draft.notes || null } : { kind: "type_settings", balanced: Number(balanced), combined: Number(combined) };
    try {
      const response = await fetch("/api/admin/athlete-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ change, reason, confirmed: true }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "保存できませんでした。");
      setMessage(`${result.label}として保存しました。再読み込みします。`);
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存できませんでした。"); }
    finally { setSaving(false); }
  }

  async function saveContactSettings(){
    if(!contactSettings||!(Number(quickMs)>0)||!(Number(balancedMs)>Number(quickMs))||!(Number(juniorDrop)>0)||!(Number(otherDrop)>0)){setMessage("CONTACT PROFILE設定値を確認してください。");return;}
    const reasonText=window.prompt("変更理由を入力してください（3文字以上）", "CONTROL TEST Ver.2設定更新")?.trim()??"";
    if(reasonText.length<3)return;
    setSaving(true);setMessage("");
    try{const response=await fetch("/api/admin/athlete-scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({change:{kind:"contact_settings",quickMs:Number(quickMs),balancedMs:Number(balancedMs),juniorDrop:Number(juniorDrop),otherDrop:Number(otherDrop)},reason:reasonText,confirmed:true})});const result=await response.json();if(!response.ok)throw new Error(result.error??"保存できませんでした。");setMessage("CONTACT PROFILE設定を保存しました。");window.setTimeout(()=>window.location.reload(),700);}catch(error){setMessage(error instanceof Error?error.message:"保存できませんでした。");}finally{setSaving(false);}
  }

  return <div className="space-y-8">
    <section className="rounded-3xl border border-orange-500/35 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.15),transparent_35%),#111] p-6 sm:p-8">
      <p className="text-[10px] font-black tracking-[.22em] text-orange-400">VAULTEX ATHLETE SCAN BETA</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">STANDARD CONTROL</h1><p className="mt-3 text-sm text-white/50">{label}（{version}）</p>
      <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-5"><Metric label="REGISTERED SCANS" value={scans.length}/><Metric label="ATHLETES" value={dashboard.athletes}/><Metric label="COMPLETE" value={dashboard.complete}/><Metric label="INCOMPLETE" value={dashboard.incomplete}/><Metric label="BEYOND STANDARD" value={dashboard.beyond}/></div>
      <details className="group mt-4 rounded-xl border border-white/10 bg-black/20 p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold"><BarChart3 size={17} className="text-orange-400"/>ATHLETE TYPE DISTRIBUTION<ChevronDown className="ml-auto transition group-open:rotate-180" size={16}/></summary><div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">{Object.entries(dashboard.distribution).map(([type,count])=><Data key={type} label={type} value={`${count}人`}/>)}</div></details>
    </section>

    <section className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">VAULTEX 100 STANDARD</p><h2 className="mt-1 text-2xl font-black">STANDARD一覧</h2></div><div className="flex rounded-full border border-white/10 p-1">{(["male","female"] as const).map((item)=><button key={item} onClick={()=>{setGender(item);setDraft(null);resetPreview();}} className={`rounded-full px-5 py-2 text-xs font-black ${gender===item?"bg-orange-500 text-black":"text-white/45"}`}>{item==="male"?"男子":"女子"}</button>)}</div></div>
      <div className="mt-5 grid gap-3">{standards.filter((row)=>row.gender===gender).map((row)=><article key={row.id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-black">{testNames[row.test_code]??row.test_code}</h3><p className="mt-1 text-xs text-white/40">{[row.equipment,row.weight_kg!=null?`${row.weight_kg}kg`:null,row.distance_m!=null?`${row.distance_m}m`:null,row.jump_count!=null?`${row.jump_count}回`:null].filter(Boolean).join(" ・ ")||"標準条件"}</p></div><button onClick={()=>edit(row)} className="inline-flex items-center gap-1 rounded-lg border border-orange-500/30 px-3 py-2 text-xs font-bold text-orange-300"><Pencil size={13}/>編集</button></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"><Data label="100 STANDARD" value={`${format(row.score_100_value)} ${standardUnit(row)}`}/><Data label="0 STANDARD" value={`${format(row.score_0_value)} ${standardUnit(row)}`}/><Data label="判定" value={row.higher_is_better?"大きいほど良い":"小さいほど良い"}/><Data label="状態・更新" value={`${row.status} ・ ${new Date(row.updated_at).toLocaleDateString("ja-JP")}`}/></div></article>)}</div>
    </section>

    {draft?<section className="rounded-3xl border border-orange-500/35 bg-orange-500/[.045] p-5 sm:p-7"><p className="text-[10px] font-black tracking-[.2em] text-orange-300">EDIT STANDARD</p><h2 className="mt-1 text-xl font-black">{testNames[standards.find((row)=>row.id===draft.id)?.test_code??""]}</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="100 STANDARD" value={draft.score100} onChange={(value)=>{setDraft({...draft,score100:value});resetPreview();}}/><Field label="0 STANDARD" value={draft.score0} onChange={(value)=>{setDraft({...draft,score0:value});resetPreview();}}/><label className="text-xs font-bold text-white/55">状態<select value={draft.status} onChange={(event)=>{setDraft({...draft,status:event.target.value as StandardDraft["status"]});resetPreview();}} className="mt-2 w-full rounded-xl border border-white/15 bg-[#090a0c] px-4 py-3 text-white"><option value="active">有効</option><option value="pending">未設定</option><option value="retired">無効</option></select></label><label className="text-xs font-bold text-white/55">備考<input value={draft.notes} onChange={(event)=>{setDraft({...draft,notes:event.target.value});resetPreview();}} maxLength={500} className="mt-2 w-full rounded-xl border border-white/15 bg-[#090a0c] px-4 py-3 text-white"/></label></div><button disabled={!validDraft()} onClick={()=>{setPreviewKind("standard");setConfirmed(false);}} className="mt-5 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black disabled:opacity-40">変更の影響をプレビュー</button></section>:null}

    <section className="rounded-3xl border border-cyan-400/20 bg-[#111] p-5 sm:p-7"><div className="flex items-center gap-3"><SlidersHorizontal className="text-cyan-300"/><div><p className="text-[10px] font-black tracking-[.18em] text-cyan-300">ATHLETE TYPE SETTINGS</p><h2 className="text-xl font-black">TYPE判定閾値</h2></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="BALANCED｜3軸最大差" value={balanced} onChange={(value)=>{setBalanced(value);resetPreview();}}/><Field label="COMBINED TYPE｜上位2軸差" value={combined} onChange={(value)=>{setCombined(value);resetPreview();}}/></div><button disabled={!Number.isFinite(Number(balanced))||!Number.isFinite(Number(combined))||Number(balanced)<0||Number(combined)<0} onClick={()=>{setPreviewKind("settings");setConfirmed(false);}} className="mt-5 rounded-xl border border-cyan-400/40 px-5 py-3 text-sm font-black text-cyan-200 disabled:opacity-40">TYPE変更の影響をプレビュー</button></section>

    <section className="rounded-3xl border border-violet-400/25 bg-[#111] p-5 sm:p-7"><p className="text-[10px] font-black tracking-[.18em] text-violet-300">CONTACT PROFILE SETTINGS</p><h2 className="mt-1 text-xl font-black">接地特性の判定・台高</h2><p className="mt-2 text-xs text-white/40">{contactSettings?.version??"未設定"}。接地時間は整数msで判定し、既存SCANの保存済み結果は変更しません。</p><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="QUICK上限（未満・ms）" value={quickMs} onChange={setQuickMs}/><Field label="BALANCED上限（未満・ms）" value={balancedMs} onChange={setBalancedMs}/><Field label="JUNIOR台高（cm）" value={juniorDrop} onChange={setJuniorDrop}/><Field label="その他クラス台高（cm）" value={otherDrop} onChange={setOtherDrop}/></div><div className="mt-4 grid grid-cols-3 gap-2 text-xs"><Data label="QUICK" value={`< ${quickMs}ms`}/><Data label="BALANCED" value={`${quickMs}〜${Number(balancedMs)-1}ms`}/><Data label="FORCE" value={`≥ ${balancedMs}ms`}/></div><button onClick={saveContactSettings} disabled={saving||!contactSettings} className="mt-5 rounded-xl border border-violet-400/40 px-5 py-3 text-sm font-black text-violet-200 disabled:opacity-40">CONTACT設定を保存</button></section>

    {previewKind?<ImpactPreview impact={impact} reason={reason} confirmed={confirmed} saving={saving} message={message} onReason={setReason} onConfirm={setConfirmed} onSave={save}/>:null}

    <section className="rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-7"><div className="flex items-center gap-3"><History className="text-orange-400"/><div><p className="text-[10px] font-black tracking-[.18em] text-orange-400">STANDARD HISTORY</p><h2 className="text-xl font-black">変更履歴</h2></div></div><div className="mt-5 grid gap-3">{history.length?history.map((item)=><article key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap justify-between gap-2"><strong>{item.change_kind==="standard"?`${item.gender==="male"?"男子":"女子"} ${testNames[item.test_code??""]??item.test_code}`:"ATHLETE TYPE SETTINGS"}</strong><span className="text-xs text-white/35">{new Date(item.changed_at).toLocaleString("ja-JP")}</span></div><p className="mt-2 text-sm"><span className="text-white/40">{item.field_name}</span>　{format(item.old_value)} → <b className="text-orange-300">{format(item.new_value)}</b></p><p className="mt-2 text-xs leading-5 text-white/45">理由：{item.reason}</p><p className="mt-1 text-[10px] text-white/25">{item.from_version} → {item.to_version}</p></article>):<p className="text-sm text-white/35">変更履歴はまだありません。</p>}</div></section>
  </div>;
}

function ImpactPreview({impact,reason,confirmed,saving,message,onReason,onConfirm,onSave}:{impact:ImpactSummary;reason:string;confirmed:boolean;saving:boolean;message:string;onReason:(value:string)=>void;onConfirm:(value:boolean)=>void;onSave:()=>void}) {
  return <section className="rounded-3xl border border-red-400/35 bg-red-500/[.045] p-5 sm:p-7"><div className="flex items-center gap-3 text-red-300"><AlertTriangle/><div><p className="text-[10px] font-black tracking-[.2em]">IMPACT PREVIEW</p><h2 className="text-xl font-black text-white">この変更による影響</h2></div></div><div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5"><Metric label="対象SCAN" value={impact.changed.length}/><Metric label="対象選手" value={impact.athletes}/><Metric label="平均スコア変化" value={signed(impact.average)}/><Metric label="最大スコア変化" value={impact.maximum.toFixed(1)}/><Metric label="TYPE変更" value={impact.typeChanges.length}/></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-white/10 p-4"><h3 className="font-black">PHYSICAL PROFILE IMPACT</h3><div className="mt-3 grid gap-2">{impact.axes.map((item)=><Data key={item.axis} label={axisNames[item.axis]} value={`${item.before.toFixed(1)} → ${item.after.toFixed(1)}（${signed(item.after-item.before)}）`}/>)}</div></div><div className="rounded-xl border border-white/10 p-4"><h3 className="font-black">TYPE CHANGES</h3><div className="mt-3 max-h-56 space-y-2 overflow-auto">{impact.typeChanges.length?impact.typeChanges.slice(0,20).map((item,index)=><Data key={`${item.userId}-${index}`} label={item.name} value={`${item.before.typeCode??"未確定"} → ${item.after.typeCode??"未確定"}`}/>):<p className="text-xs text-white/40">TYPE変更はありません。</p>}</div></div></div><details className="group mt-4 rounded-xl border border-white/10 p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-black"><Users size={17}/>選手別プレビュー（最大20件）<ChevronDown className="ml-auto transition group-open:rotate-180" size={16}/></summary><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="text-white/35"><tr><th className="p-2">選手</th><th>現在平均</th><th>変更後平均</th><th>差</th></tr></thead><tbody>{impact.changed.slice(0,20).map((item,index)=>{const before=mean(scoreList(item.before));const after=mean(scoreList(item.after));return <tr key={`${item.userId}-${index}`} className="border-t border-white/10"><td className="p-2 font-bold">{item.name}</td><td>{before.toFixed(1)}</td><td>{after.toFixed(1)}</td><td className="text-orange-300">{signed(after-before)}</td></tr>})}</tbody></table></div></details><label className="mt-5 block text-xs font-bold text-white/55">変更理由 / メモ<textarea value={reason} onChange={(event)=>onReason(event.target.value)} maxLength={1000} rows={3} placeholder="実測データを確認して調整する理由を入力" className="mt-2 w-full rounded-xl border border-white/15 bg-[#090a0c] px-4 py-3 text-white"/></label><label className="mt-4 flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-500/[.06] p-4 text-xs leading-5 text-white/65"><input type="checkbox" checked={confirmed} onChange={(event)=>onConfirm(event.target.checked)} className="mt-1"/><span><b className="text-red-200">この変更は既存ATHLETE SCANの現在評価結果に影響します。</b><br/>実測値と測定当時のSTANDARD VERSIONは変更されないことを確認しました。</span></label>{message?<p className="mt-3 text-sm text-orange-200">{message}</p>:null}<button disabled={!confirmed||reason.trim().length<3||saving} onClick={onSave} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-black text-white disabled:opacity-35">{saving?<SlidersHorizontal className="animate-spin" size={17}/>:<Save size={17}/>}確認して新バージョンを保存</button></section>;
}

function Metric({label,value}:{label:string;value:string|number}) { return <div className="rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-[9px] font-black tracking-wider text-white/35">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>; }
function Data({label,value}:{label:string;value:string}) { return <div className="rounded-lg bg-white/[.035] p-3"><p className="text-[10px] text-white/35">{label}</p><p className="mt-1 break-words font-bold text-white/70">{value}</p></div>; }
function Field({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}) { return <label className="text-xs font-bold text-white/55">{label}<input type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(event)=>onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#090a0c] px-4 py-3 text-lg font-black text-white outline-none focus:border-orange-500"/></label>; }
