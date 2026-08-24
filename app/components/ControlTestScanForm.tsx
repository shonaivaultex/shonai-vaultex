"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, Save } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { controlTestDefinitions, performanceCategoryForMeasurement } from "@/lib/control-test";
import { classifyContactProfile, type ContactProfileSettings } from "@/lib/contact-profile";

type Values = Record<string, string>;
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
const numberOrNull = (value: string) => value.trim() ? Number(value.trim().replace(/[，,]/g, ".")) : null;
const primaryKey = (code: string, metric: string) => `${code}_${metric}`;

type InitialSettings = {
  shot_front_throw_weight?: number;
  shot_back_throw_weight?: number;
  speed_endurance_distance_m?: number;
  standing_bound_jump_count?: number;
  rj_jump_count?: number;
  drop_jump_height_cm?: number;
};

export default function ControlTestScanForm({ initialSettings = {}, programClass = null, standardVersion = null, contactSettings = null }: { initialSettings?: InitialSettings; programClass?: string | null; standardVersion?: string | null; contactSettings?: ContactProfileSettings | null }) {
  const router = useRouter();
  const isJunior = programClass === "ジュニア";
  const standingJumpCount = initialSettings.standing_bound_jump_count ?? (isJunior ? 3 : 5);
  const [rjJumpCount,setRjJumpCount]=useState(initialSettings.rj_jump_count ?? 5);
  const [date,setDate]=useState(today);
  const [notes,setNotes]=useState("");
  const [values,setValues]=useState<Values>(() => ({
    ...(initialSettings.shot_front_throw_weight ? { shot_front_throw_weight: String(initialSettings.shot_front_throw_weight) } : {}),
    ...(initialSettings.shot_back_throw_weight ? { shot_back_throw_weight: String(initialSettings.shot_back_throw_weight) } : {}),
    speed_endurance_distance_m: String(initialSettings.speed_endurance_distance_m ?? 300),
    drop_jump_drop_height_cm: String(initialSettings.drop_jump_height_cm ?? (isJunior ? 20 : 30)),
  }));
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const set=(key:string,value:string)=>setValues((current)=>({...current,[key]:value}));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const cmjTrials=[1,2,3].flatMap((trial)=>{const jump=numberOrNull(values[`vertical_jump_height_${trial}`]??"");return jump&&jump>0?[{trial,jump}]:[];});
    const djTrials=[1,2,3].flatMap((trial)=>{const jump=numberOrNull(values[`drop_jump_height_${trial}`]??"");const contact=numberOrNull(values[`drop_jump_contact_${trial}`]??"");const manual=numberOrNull(values[`drop_jump_rsi_${trial}`]??"");const rsi=manual??(jump&&contact?(jump*10)/contact:null);return jump&&contact&&rsi&&rsi>0?[{trial,jump,contact,rsi}]:[];});
    const entries = controlTestDefinitions.flatMap((definition) => {
      const derived=definition.code==="vertical_jump"?(cmjTrials.length?Math.max(...cmjTrials.map((item)=>item.jump)):null):definition.code==="drop_jump"?(djTrials.length?Math.max(...djTrials.map((item)=>item.rsi)):null):null;
      const primary = derived ?? numberOrNull(values[primaryKey(definition.code, definition.primaryMetric)] ?? "");
      return primary !== null && Number.isFinite(primary) && primary > 0 ? [{ definition, primary }] : [];
    });
    if (!entries.length) { setError("1種目以上の測定値を入力してください。"); return; }
    const invalidWeight = entries.some(({definition})=>definition.code.startsWith("shot_") && !(Number(values[`${definition.code}_weight`])>0));
    if (invalidWeight) { setError("投げ種目を登録する場合は、使用重量も入力してください。"); return; }
    setSaving(true);
    const supabase=createClient();
    try {
      const {data:{user}}=await supabase.auth.getUser(); if(!user){setError("ログインが必要です。");return;}
      const {data:player}=await supabase.from("players").select("*").eq("user_id",user.id).maybeSingle();
      const profileSnapshot = player ? { program_class: player.program_class ?? null, gender: player.gender ?? null, grade: player.grade ?? null, age: player.age ?? null, birth_date: player.birth_date ?? null, height_cm: player.height_cm ?? null, weight_kg: player.weight_kg ?? null } : {};
      const {data:scan,error:scanError}=await supabase.from("control_test_scans").insert({user_id:user.id,scan_number:0,measured_on:date,version:4,status:"complete",profile_snapshot:profileSnapshot,notes:notes.trim()||null,athlete_standard_version:standardVersion,athlete_evaluated_at:standardVersion?new Date().toISOString():null,control_test_version:"v2",protocol_version:2,contact_profile_version:contactSettings?.version??null}).select("id").single();
      if(scanError||!scan){setError(scanError?.message??"SCANを作成できませんでした。");return;}
      const speedDistance = numberOrNull(values.speed_endurance_distance_m ?? "") ?? 300;
      const equipmentFor = (testCode: string) => testCode.startsWith("shot_") ? (isJunior ? "2kgメディシンボール" : "砲丸") : testCode === "rebound_jump" || testCode === "drop_jump" || testCode === "vertical_jump" ? "S-CADE等のジャンプマット" : testCode === "acceleration_30m" ? "光電管" : null;
      const jumpCountFor = (testCode: string) => testCode === "standing_five_bound" ? standingJumpCount : testCode === "rebound_jump" ? rjJumpCount : null;
      const categoryFor = (testCode: string) => performanceCategoryForMeasurement(testCode,{distanceM:speedDistance,jumpCount:jumpCountFor(testCode),equipment:equipmentFor(testCode)});
      const recordRows=entries.map(({definition,primary})=>({user_id:user.id,category:categoryFor(definition.code),value:primary,date,record_kind:"control-test"}));
      const {data:records,error:recordError}=await supabase.from("performance_records").insert(recordRows).select("id, category");
      if(recordError||!records){await supabase.from("control_test_scans").delete().eq("id",scan.id);setError(recordError?.message??"記録を保存できませんでした。");return;}
      const recordIdByCategory=new Map(records.map((row)=>[row.category,row.id]));
      const measurementRows=entries.map(({definition,primary})=>{
        const metrics:Record<string,number>={[definition.primaryMetric]:primary};
        if(definition.code==="acceleration_30m"){const accelerationTime=numberOrNull(values.acceleration_time_0_30m??"");if(accelerationTime)metrics.acceleration_time_0_30m=accelerationTime;}
        if(definition.code==="rebound_jump"){
          metrics.trial_count=rjJumpCount;
        }
        if(definition.code==="drop_jump"){
          const representative=[...djTrials].sort((a,b)=>b.rsi-a.rsi)[0];
          const dropHeight=numberOrNull(values.drop_jump_drop_height_cm??"");
          const jumpHeight=representative?.jump??null;
          const contactTime=representative?.contact??null;
          if(dropHeight)metrics.drop_height_cm=dropHeight;
          if(jumpHeight)metrics.jump_height_cm=jumpHeight;
          if(contactTime)metrics.contact_time_ms=contactTime;
        }
        if(definition.code==="speed_endurance_300m"){metrics.distance_m=speedDistance;}
        metrics.protocol_version=definition.code==="rebound_jump"||definition.code==="vertical_jump"||definition.code==="drop_jump"?2:3; metrics.attempt_limit=definition.code==="speed_endurance_300m"?1:definition.code==="vertical_jump"||definition.code==="drop_jump"?3:2;
        if(definition.code==="standing_five_bound")metrics.jump_count=standingJumpCount;
        return {scan_id:scan.id,user_id:user.id,test_code:definition.code,performance_record_id:recordIdByCategory.get(categoryFor(definition.code)),primary_value:primary,metrics,protocol_version:definition.code==="rebound_jump"||definition.code==="vertical_jump"||definition.code==="drop_jump"?2:3,attempt_count:definition.code==="speed_endurance_300m"?1:definition.code==="vertical_jump"?cmjTrials.length:definition.code==="drop_jump"?djTrials.length:2,distance_m:definition.code==="speed_endurance_300m"?speedDistance:null,jump_count:jumpCountFor(definition.code),implement_name:equipmentFor(definition.code),implement_weight_kg:definition.code.startsWith("shot_")?numberOrNull(values[`${definition.code}_weight`]??""):null,equipment:equipmentFor(definition.code)};
      });
      const {data:savedMeasurements,error:measurementError}=await supabase.from("control_test_measurements").insert(measurementRows).select("id,test_code");
      if(measurementError){await supabase.from("performance_records").delete().in("id",records.map((row)=>row.id));await supabase.from("control_test_scans").delete().eq("id",scan.id);setError(measurementError.message);return;}
      const measurementIds=new Map((savedMeasurements??[]).map((row)=>[row.test_code,row.id]));
      const jumpRows=[...cmjTrials.map((item)=>({measurement_id:measurementIds.get("vertical_jump"),scan_id:scan.id,user_id:user.id,test_code:"vertical_jump",trial_number:item.trial,drop_height_cm:null,jump_height_cm:item.jump,contact_time_ms:null,rsi:null,is_valid:true,equipment:"S-CADE等のジャンプマット",protocol_version:2,measured_at:new Date(`${date}T12:00:00+09:00`).toISOString()})),...djTrials.map((item)=>({measurement_id:measurementIds.get("drop_jump"),scan_id:scan.id,user_id:user.id,test_code:"drop_jump",trial_number:item.trial,drop_height_cm:numberOrNull(values.drop_jump_drop_height_cm??""),jump_height_cm:item.jump,contact_time_ms:item.contact,rsi:item.rsi,is_valid:true,equipment:"S-CADE等のジャンプマット",protocol_version:2,measured_at:new Date(`${date}T12:00:00+09:00`).toISOString()}))].filter((row)=>row.measurement_id);
      if(jumpRows.length){const {error:trialError}=await supabase.from("control_test_jump_trials").insert(jumpRows);if(trialError){await supabase.from("performance_records").delete().in("id",records.map((row)=>row.id));await supabase.from("control_test_scans").delete().eq("id",scan.id);setError(trialError.message);return;}}
      const representative=[...djTrials].sort((a,b)=>b.rsi-a.rsi)[0];
      const contact=classifyContactProfile(representative?.contact,contactSettings);
      const {error:profileError}=await supabase.from("control_test_scans").update({contact_profile_code:contact.code,contact_profile_snapshot:{...contact,quick_upper_ms:contactSettings?.quick_upper_ms??null,balanced_upper_ms:contactSettings?.balanced_upper_ms??null,representative_rsi:representative?.rsi??null}}).eq("id",scan.id);
      if(profileError){await supabase.from("performance_records").delete().in("id",records.map((row)=>row.id));await supabase.from("control_test_scans").delete().eq("id",scan.id);setError(profileError.message);return;}
      router.push(`/mypage/control-tests/${scan.id}?reveal=1`);router.refresh();
    } finally { setSaving(false); }
  }

  const displayName = (code: string, fallback: string) => code === "standing_five_bound" && isJunior ? "立三段跳" : code.startsWith("shot_") && isJunior ? `2kgメディシンボール ${code === "shot_front_throw" ? "フロント投げ" : "バック投げ"}` : fallback;

  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/mypage/control-tests" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 hover:text-orange-400"><ArrowLeft size={16}/>CONTROL TEST</Link>
    <header className="mt-9 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">VAULTEX SCAN</p><h1 className="mt-2 text-4xl font-black">SCANを記録</h1><p className="mt-3 text-white/55">{programClass ? `${programClass}の公式種目を表示しています。` : "測定できた種目だけ入力できます。"} 空欄の種目は保存されません。</p></header>
    <form onSubmit={submit} className="mt-8 space-y-5">
      <section className="rounded-2xl border border-white/10 bg-[#111] p-5"><label className="block text-sm font-bold">測定日<input type="date" required value={date} onChange={(e)=>setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0d0f12] px-4 py-3 text-white [color-scheme:dark]"/></label></section>
      {controlTestDefinitions.map((definition)=><section key={definition.code} className="rounded-2xl border border-white/10 bg-[#111] p-5">
        <p className="text-[10px] font-black tracking-[0.14em] text-orange-400">{definition.abilityEn}</p><h2 className="mt-1 text-xl font-black">{displayName(definition.code,definition.measurement)}</h2><p className="mt-2 text-sm text-white/45">{definition.description}</p>
        {definition.code==="vertical_jump"?<JumpTrials kind="cmj" values={values} set={set}/>:definition.code==="drop_jump"?<JumpTrials kind="dj" values={values} set={set} dropHeight={values.drop_jump_drop_height_cm??"30"}/>:definition.code==="rebound_jump"?<div className="mt-4 space-y-3">
          {isJunior&&<label className="block text-xs font-bold text-white/65">RJ実施回数<select value={rjJumpCount} onChange={(e)=>setRjJumpCount(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0d0f12] px-4 py-3 text-white"><option value={3}>3回</option><option value={4}>4回</option><option value={5}>5回</option></select></label>}
          {!isJunior&&<p className="text-xs font-bold text-white/65">RJ実施回数：5回</p>}
          <p className="text-xs text-white/50">ジャンプマットに表示された最大RJ-indexだけを入力してください。</p>
          <Metric label="最大RJ-index" unit="" value={values[primaryKey(definition.code,definition.primaryMetric)]??""} onChange={(value)=>set(primaryKey(definition.code,definition.primaryMetric),value)}/>
        </div>:<div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label={definition.code==="acceleration_30m"?"30〜60m計測タイム":definition.code==="speed_endurance_300m"?`${values.speed_endurance_distance_m??"300"}mタイム`:displayName(definition.code,definition.category)} unit={definition.unit} value={values[primaryKey(definition.code,definition.primaryMetric)]??""} onChange={(value)=>set(primaryKey(definition.code,definition.primaryMetric),value)}/>
          {definition.code==="acceleration_30m"&&<Metric label="0〜30m加速区間（任意）" unit="秒" value={values.acceleration_time_0_30m??""} onChange={(value)=>set("acceleration_time_0_30m",value)}/>} {definition.code.startsWith("shot_")&&<Metric label="使用重量" unit="kg" value={values[`${definition.code}_weight`]??""} onChange={(value)=>set(`${definition.code}_weight`,value)}/>} {definition.code==="speed_endurance_300m"&&<Metric label="クラス設定の実施距離" unit="m" value={values.speed_endurance_distance_m??"300"} onChange={(value)=>set("speed_endurance_distance_m",value)} readOnly/>}
        </div>}
      </section>)}
      <section className="rounded-2xl border border-white/10 bg-[#111] p-5"><label className="text-sm font-bold">SCANメモ（任意）<textarea value={notes} onChange={(e)=>setNotes(e.target.value)} maxLength={1000} rows={3} className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-[#0d0f12] px-4 py-3 text-white"/></label></section>
      {error?<p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>:null}<button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black disabled:opacity-50">{saving?<LoaderCircle className="animate-spin" size={18}/>:<Save size={18}/>} {saving?"保存中...":"VAULTEX SCANを保存"}</button><p className="flex items-center gap-2 text-xs text-white/40"><Check size={14} className="text-orange-400"/>測定条件を分けた上で、主要値をPB・グラフ・ランキングへ反映します。</p>
    </form></div></main>;
}

function Metric({label,unit,value,onChange,readOnly=false}:{label:string;unit:string;value:string;onChange:(value:string)=>void;readOnly?:boolean}) { return <label className="block"><span className="text-xs font-bold text-white/65">{label}</span><div className="relative mt-2"><input type="text" inputMode="decimal" value={value} readOnly={readOnly} onChange={(e)=>onChange(e.target.value)} placeholder="例：3.25" className="w-full rounded-xl border border-white/15 bg-[#0d0f12] px-4 py-3 pr-20 text-white outline-none focus:border-orange-500 read-only:cursor-not-allowed read-only:text-white/55"/><span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-xs text-white/35">{unit}</span></div></label>; }

function JumpTrials({kind,values,set,dropHeight}:{kind:"cmj"|"dj";values:Values;set:(key:string,value:string)=>void;dropHeight?:string}) { return <div className="mt-4 space-y-3">{kind==="dj"?<Metric label="落下高" unit="cm" value={dropHeight??"30"} onChange={(value)=>set("drop_jump_drop_height_cm",value)}/>:null}<p className="text-xs text-white/50">両手を腰に置き、腕振りなし。最大3本のうち実施した試技だけ入力してください。</p>{[1,2,3].map((trial)=><div key={trial} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="mb-3 text-xs font-black text-orange-300">試技 {trial}</p><div className={`grid gap-3 ${kind==="dj"?"sm:grid-cols-3":"sm:grid-cols-1"}`}><Metric label="跳躍高" unit="cm" value={values[`${kind==="cmj"?"vertical_jump":"drop_jump"}_height_${trial}`]??""} onChange={(value)=>set(`${kind==="cmj"?"vertical_jump":"drop_jump"}_height_${trial}`,value)}/>{kind==="dj"?<><Metric label="接地時間" unit="ms" value={values[`drop_jump_contact_${trial}`]??""} onChange={(value)=>set(`drop_jump_contact_${trial}`,value)}/><Metric label="RSI（任意・自動計算可）" unit="" value={values[`drop_jump_rsi_${trial}`]??""} onChange={(value)=>set(`drop_jump_rsi_${trial}`,value)}/></>:null}</div></div>)}</div>; }
