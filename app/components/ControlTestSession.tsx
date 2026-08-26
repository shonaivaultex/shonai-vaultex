"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Cloud, LoaderCircle, Plus, RotateCcw, Save, X } from "lucide-react";
import { controlTestDefinitions } from "@/lib/control-test";

type Athlete={id:string;name:string;programClass:string|null;gender:string|null;event:string|null};
type Schedule={id:number;title:string;startsAt:string;programClass:string|null;attendeeIds:string[]};
type Cell={a1?:string;a2?:string;attempts?:string[];status?:"measured"|"absent"|"foul"|"retest"};
type Entries=Record<string,Record<string,Cell>>;
const storageKey="vaultex-control-test-live-v1";

export default function ControlTestSession({athletes,schedules}:{athletes:Athlete[];schedules:Schedule[]}) {
  const [scheduleId,setScheduleId]=useState(""); const [programClass,setProgramClass]=useState("all");
  const [testCode,setTestCode]=useState(controlTestDefinitions[0].code); const [entries,setEntries]=useState<Entries>({});
  const [date,setDate]=useState(()=>new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Tokyo"}));
  const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [restored,setRestored]=useState(false);
  useEffect(()=>{const frame=requestAnimationFrame(()=>{try{const raw=localStorage.getItem(storageKey);if(raw){const draft=JSON.parse(raw);setEntries(draft.entries??{});setDate(draft.date??new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Tokyo"}));setScheduleId(draft.scheduleId??"");setProgramClass(draft.programClass??"all");}setRestored(true);}catch{setRestored(true);}});return()=>cancelAnimationFrame(frame);},[]);
  useEffect(()=>{if(restored)localStorage.setItem(storageKey,JSON.stringify({entries,date,scheduleId,programClass,updatedAt:new Date().toISOString()}));},[entries,date,scheduleId,programClass,restored]);
  const selectedSchedule=schedules.find((s)=>String(s.id)===scheduleId);
  const roster=useMemo(()=>athletes.filter((a)=>selectedSchedule?selectedSchedule.attendeeIds.includes(a.id):programClass==="all"||a.programClass===programClass),[athletes,selectedSchedule,programClass]);
  const definition=controlTestDefinitions.find((d)=>d.code===testCode)!;
  const displayTest=(athlete:Athlete)=>testCode==="standing_five_bound"&&athlete.programClass==="ジュニア"?"立三段跳":testCode==="speed_endurance_300m"&&["ジュニア","マスターズ"].includes(athlete.programClass??"")?"150m":testCode==="speed_endurance_300m"?"300m":definition.category;
  const cell=(athleteId:string)=>entries[athleteId]?.[testCode]??{};
  const setCell=(athleteId:string,patch:Partial<Cell>)=>setEntries((current)=>({...current,[athleteId]:{...(current[athleteId]??{}),[testCode]:{...(current[athleteId]?.[testCode]??{}),...patch}}}));
  const attemptValues=(item:Cell)=>item.attempts?.length?item.attempts:[item.a1??"",item.a2??""];
  const setAttempt=(athleteId:string,index:number,value:string)=>{const item=cell(athleteId);const attempts=[...attemptValues(item)];attempts[index]=value;setCell(athleteId,{attempts,a1:attempts[0]??"",a2:attempts[1]??"",status:"measured"});};
  const addAttempt=(athleteId:string)=>{const item=cell(athleteId);const attempts=attemptValues(item);if(attempts.length<10)setCell(athleteId,{attempts:[...attempts,""]});};
  const removeAttempt=(athleteId:string,index:number)=>{const item=cell(athleteId);const attempts=attemptValues(item).filter((_,attemptIndex)=>attemptIndex!==index);setCell(athleteId,{attempts,a1:attempts[0]??"",a2:attempts[1]??""});};
  const best=(item:Cell)=>{const values=attemptValues(item).map(Number).filter((n)=>Number.isFinite(n)&&n>0);if(!values.length)return null;return definition.betterDirection==="lower"?Math.min(...values):Math.max(...values);};
  const measuredCount=roster.filter((a)=>Object.values(entries[a.id]??{}).some((item)=>best(item)!==null)).length;
  async function publish(){
    const payload=roster.map((athlete)=>({
      athleteId:athlete.id,
      measurements:Object.entries(entries[athlete.id]??{}).flatMap(([code,item])=>{
        const def=controlTestDefinitions.find((d)=>d.code===code);const value=def?best(item):null;
        const attempts=attemptValues(item).map(Number).filter((attempt)=>Number.isFinite(attempt)&&attempt>0);
        return value?[{testCode:code,value,attempt1:attempts[0]??null,attempt2:attempts[1]??null,attempts}]:[];
      }),
    })).filter((athlete)=>athlete.measurements.length);
    if(!payload.length){setMessage("測定値を1件以上入力してください。");return;}
    if(!confirm(`${payload.length}名の記録を正式なVAULTEX SCANへ反映します。よろしいですか？`))return;
    setSaving(true);setMessage("");
    try{const response=await fetch("/api/coach/control-test-session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({date,scheduleId:scheduleId||null,athletes:payload})});const result=await response.json();if(!response.ok)throw new Error(result.error??"保存できませんでした。");localStorage.removeItem(storageKey);setEntries({});setMessage(`${result.saved}名のSCANへ反映しました。`);}catch(error){setMessage(error instanceof Error?error.message:"保存できませんでした。");}finally{setSaving(false);}
  }
  return <div className="mt-8 space-y-5">
    <section className="grid gap-3 rounded-3xl border border-white/10 bg-[#111] p-4 sm:grid-cols-3 sm:p-6"><label className="text-xs font-bold text-white/55">測定日<input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white [color-scheme:dark]"/></label><label className="text-xs font-bold text-white/55">参加名簿<select value={scheduleId} onChange={(e)=>setScheduleId(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0b0c0e] px-4 py-3 text-white"><option value="">クラスから選ぶ</option>{schedules.map((s)=><option key={s.id} value={s.id}>{new Date(s.startsAt).toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"})} {s.title}（参加{s.attendeeIds.length}名）</option>)}</select></label><label className="text-xs font-bold text-white/55">クラス<select disabled={!!scheduleId} value={programClass} onChange={(e)=>setProgramClass(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0b0c0e] px-4 py-3 text-white disabled:opacity-40"><option value="all">全選手</option>{["ジュニア","ユース","エリート","マスターズ"].map((c)=><option key={c}>{c}</option>)}</select></label></section>
    <nav className="flex gap-2 overflow-x-auto pb-2">{controlTestDefinitions.map((d)=><button key={d.code} onClick={()=>setTestCode(d.code)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black ${testCode===d.code?"border-orange-500 bg-orange-500 text-black":"border-white/15 bg-[#111] text-white/55"}`}>{d.category}</button>)}</nav>
    <section className="overflow-hidden rounded-3xl border border-orange-500/35 bg-[#101010]"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/10 p-5"><div><p className="text-[10px] font-black tracking-[.16em] text-orange-400">{definition.abilityEn}</p><h2 className="mt-1 text-2xl font-black">{definition.abilityJa}</h2><p className="mt-1 text-xs text-white/45">原則2本。必要な選手だけ3本目以降を追加でき、{definition.betterDirection==="lower"?"速い":"大きい"}方を自動採用します。</p></div><span className="flex items-center gap-2 text-xs text-emerald-300"><Cloud size={15}/>端末へ自動保存</span></div>
      <div className="divide-y divide-white/[.07]">{roster.length?roster.map((athlete)=>{const item=cell(athlete.id);const attempts=attemptValues(item);const adopted=best(item);return <div key={athlete.id} className="p-4 sm:p-5"><div className="flex flex-wrap items-center gap-3"><div className="min-w-[170px] flex-1"><strong>{athlete.name}</strong><span className="ml-2 text-xs text-white/35">{athlete.programClass}</span><p className="mt-1 text-[11px] text-orange-300">{displayTest(athlete)}</p></div><div className="rounded-xl border border-orange-500/20 bg-orange-500/[.07] px-4 py-3 text-center"><span className="block text-[9px] font-black tracking-[.12em] text-white/35">採用記録</span><strong className="mt-1 block text-lg text-orange-300">{adopted??"—"}</strong></div><select value={item.status??"measured"} onChange={(e)=>setCell(athlete.id,{status:e.target.value as Cell["status"],...(e.target.value!=="measured"?{a1:"",a2:"",attempts:["",""]}:{})})} className="min-w-40 rounded-xl border border-white/10 bg-[#151515] px-3 py-3 text-xs text-white"><option value="measured">測定</option><option value="foul">ファウル</option><option value="retest">再測定</option><option value="absent">欠席・未測定</option></select></div><div className="mt-4 flex flex-wrap items-end gap-2">{attempts.map((attempt,index)=><label key={index} className="relative min-w-[118px] flex-1 sm:max-w-[150px]"><span className="mb-1.5 block text-[10px] font-black tracking-[.12em] text-white/40">{index+1}本目</span><input aria-label={`${athlete.name} ${index+1}本目`} inputMode="decimal" placeholder="記録" value={attempt} onChange={(e)=>setAttempt(athlete.id,index,e.target.value)} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 text-lg font-black outline-none focus:border-orange-500"/>{index>=2?<button type="button" aria-label={`${index+1}本目を削除`} onClick={()=>removeAttempt(athlete.id,index)} className="absolute right-1 top-0 text-white/25 transition hover:text-red-300"><X size={14}/></button>:null}</label>)}<button type="button" onClick={()=>addAttempt(athlete.id)} disabled={attempts.length>=10} className="inline-flex min-h-[50px] items-center gap-2 rounded-xl border border-dashed border-orange-500/45 px-4 text-xs font-black text-orange-300 transition hover:bg-orange-500/10 disabled:opacity-30"><Plus size={16}/>{attempts.length+1}本目を追加</button></div></div>}):<p className="p-10 text-center text-sm text-white/35">参加者がいません。予定の出欠またはクラスを確認してください。</p>}</div>
    </section>
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-orange-500/30 bg-[#111]/95 p-3 shadow-2xl backdrop-blur"><span className="mr-auto text-sm font-bold">入力済み {measuredCount}/{roster.length}名</span><button onClick={()=>{if(confirm("端末に保存した入力途中の内容を消しますか？")){setEntries({});localStorage.removeItem(storageKey);}}} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold text-white/55"><RotateCcw size={15}/>下書きを消す</button><button disabled={saving} onClick={publish} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black disabled:opacity-50">{saving?<LoaderCircle size={17} className="animate-spin"/>:<Save size={17}/>}SCANへ一括反映</button></div>{message&&<p role="status" className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-200"><Check size={16} className="mr-2 inline"/>{message}</p>}
  </div>;
}
