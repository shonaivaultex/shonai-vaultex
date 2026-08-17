"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, Save } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { controlTestDefinitions, performanceCategoryForMeasurement } from "@/lib/control-test";

type Values = Record<string, string>;
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
const numberOrNull = (value: string) => value.trim() ? Number(value) : null;
const primaryKey = (code: string, metric: string) => `${code}_${metric}`;
const rjTrials = (values: Values, count: number) => Array.from({ length: count }, (_, index) => ({
  trialNumber: index + 1,
  jumpHeightCm: numberOrNull(values[`rj_${index + 1}_height`] ?? ""),
  contactTimeMs: numberOrNull(values[`rj_${index + 1}_contact`] ?? ""),
  rjIndex: numberOrNull(values[`rj_${index + 1}_index`] ?? ""),
}));

type InitialSettings = {
  shot_front_throw_weight?: number;
  shot_back_throw_weight?: number;
  speed_endurance_distance_m?: number;
  standing_bound_jump_count?: number;
  rj_jump_count?: number;
};

export default function ControlTestScanForm({ initialSettings = {}, programClass = null }: { initialSettings?: InitialSettings; programClass?: string | null }) {
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
  }));
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const set=(key:string,value:string)=>setValues((current)=>({...current,[key]:value}));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const trials = rjTrials(values,rjJumpCount);
    const hasRjData = trials.some((trial) => trial.jumpHeightCm !== null || trial.contactTimeMs !== null || trial.rjIndex !== null);
    const completeRj = trials.every((trial) => (trial.jumpHeightCm ?? 0) > 0 && (trial.contactTimeMs ?? 0) > 0 && (trial.rjIndex ?? 0) > 0);
    if (hasRjData && !completeRj) { setError(`リバウンドジャンプは${rjJumpCount}回すべての跳躍高・接地時間・RJ-indexを入力してください。`); return; }
    const entries = controlTestDefinitions.flatMap((definition) => {
      const primary = definition.code === "rebound_jump"
        ? (completeRj ? Math.max(...trials.map((trial) => trial.rjIndex ?? 0)) : null)
        : numberOrNull(values[primaryKey(definition.code, definition.primaryMetric)] ?? "");
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
      const {data:scan,error:scanError}=await supabase.from("control_test_scans").insert({user_id:user.id,scan_number:0,measured_on:date,version:3,status:"complete",profile_snapshot:profileSnapshot,notes:notes.trim()||null}).select("id").single();
      if(scanError||!scan){setError(scanError?.message??"SCANを作成できませんでした。");return;}
      const speedDistance = numberOrNull(values.speed_endurance_distance_m ?? "") ?? 300;
      const equipmentFor = (testCode: string) => testCode.startsWith("shot_") ? (isJunior ? "2kgメディシンボール" : "砲丸") : testCode === "rebound_jump" ? "S-CADE等のジャンプマット" : testCode === "acceleration_30m" ? "光電管" : null;
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
          const bestTrial=trials.reduce((best,trial)=>(trial.rjIndex??0)>(best.rjIndex??0)?trial:best,trials[0]);
          metrics.jump_height_cm=bestTrial.jumpHeightCm??0; metrics.contact_time_ms=bestTrial.contactTimeMs??0; metrics.trial_count=rjJumpCount;
        }
        if(definition.code==="speed_endurance_300m"){metrics.distance_m=speedDistance;}
        metrics.protocol_version=3; metrics.attempt_limit=definition.code==="speed_endurance_300m"?1:2;
        if(definition.code==="standing_five_bound")metrics.jump_count=standingJumpCount;
        return {scan_id:scan.id,user_id:user.id,test_code:definition.code,performance_record_id:recordIdByCategory.get(categoryFor(definition.code)),primary_value:primary,metrics,protocol_version:3,attempt_count:definition.code==="speed_endurance_300m"?1:2,distance_m:definition.code==="speed_endurance_300m"?speedDistance:null,jump_count:jumpCountFor(definition.code),implement_name:equipmentFor(definition.code),implement_weight_kg:definition.code.startsWith("shot_")?Number(values[`${definition.code}_weight`]):null,equipment:equipmentFor(definition.code)};
      });
      const {data:savedMeasurements,error:measurementError}=await supabase.from("control_test_measurements").insert(measurementRows).select("id, test_code");
      if(measurementError){await supabase.from("performance_records").delete().in("id",records.map((row)=>row.id));await supabase.from("control_test_scans").delete().eq("id",scan.id);setError(measurementError.message);return;}
      const reboundMeasurement=savedMeasurements?.find((item)=>item.test_code==="rebound_jump");
      if(completeRj&&!reboundMeasurement){await supabase.from("performance_records").delete().in("id",records.map((row)=>row.id));await supabase.from("control_test_scans").delete().eq("id",scan.id);setError("リバウンドジャンプの測定値を保存できませんでした。");return;}
      if(reboundMeasurement&&completeRj){
        const {error:trialError}=await supabase.from("control_test_rj_trials").insert(trials.map((trial)=>({measurement_id:reboundMeasurement.id,scan_id:scan.id,user_id:user.id,trial_number:trial.trialNumber,jump_height_cm:trial.jumpHeightCm,contact_time_ms:trial.contactTimeMs,rj_index:trial.rjIndex})));
        if(trialError){await supabase.from("performance_records").delete().in("id",records.map((row)=>row.id));await supabase.from("control_test_scans").delete().eq("id",scan.id);setError(trialError.message);return;}
      }
      router.push("/mypage/control-tests");router.refresh();
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
        {definition.code==="rebound_jump"?<div className="mt-4 space-y-3">
          {isJunior&&<label className="block text-xs font-bold text-white/65">RJ実施回数<select value={rjJumpCount} onChange={(e)=>setRjJumpCount(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0d0f12] px-4 py-3 text-white"><option value={3}>3回</option><option value={4}>4回</option><option value={5}>5回</option></select></label>}
          <p className="text-xs text-white/50">{rjJumpCount}回分を入力すると、最も高いRJ-indexを代表値として自動採用します。</p>
          {Array.from({length:rjJumpCount},(_,index)=><div key={index} className="rounded-xl border border-white/10 p-3"><p className="mb-2 text-xs font-black text-orange-300">{index+1}回目</p><div className="grid gap-2 sm:grid-cols-3"><Metric label="跳躍高" unit="cm" value={values[`rj_${index+1}_height`]??""} onChange={(value)=>set(`rj_${index+1}_height`,value)}/><Metric label="接地時間" unit="ms" value={values[`rj_${index+1}_contact`]??""} onChange={(value)=>set(`rj_${index+1}_contact`,value)}/><Metric label="RJ-index" unit="" value={values[`rj_${index+1}_index`]??""} onChange={(value)=>set(`rj_${index+1}_index`,value)}/></div></div>)}
        </div>:<div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label={definition.code==="acceleration_30m"?"30〜60m計測タイム":definition.code==="speed_endurance_300m"?`${values.speed_endurance_distance_m??"300"}mタイム`:displayName(definition.code,definition.category)} unit={definition.unit} value={values[primaryKey(definition.code,definition.primaryMetric)]??""} onChange={(value)=>set(primaryKey(definition.code,definition.primaryMetric),value)}/>
          {definition.code==="acceleration_30m"&&<Metric label="0〜30m加速区間（任意）" unit="秒" value={values.acceleration_time_0_30m??""} onChange={(value)=>set("acceleration_time_0_30m",value)}/>} {definition.code.startsWith("shot_")&&<Metric label="使用重量" unit="kg" value={values[`${definition.code}_weight`]??""} onChange={(value)=>set(`${definition.code}_weight`,value)}/>} {definition.code==="speed_endurance_300m"&&<Metric label="クラス設定の実施距離" unit="m" value={values.speed_endurance_distance_m??"300"} onChange={(value)=>set("speed_endurance_distance_m",value)} readOnly/>}
        </div>}
      </section>)}
      <section className="rounded-2xl border border-white/10 bg-[#111] p-5"><label className="text-sm font-bold">SCANメモ（任意）<textarea value={notes} onChange={(e)=>setNotes(e.target.value)} maxLength={1000} rows={3} className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-[#0d0f12] px-4 py-3 text-white"/></label></section>
      {error?<p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</p>:null}<button disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 font-black disabled:opacity-50">{saving?<LoaderCircle className="animate-spin" size={18}/>:<Save size={18}/>} {saving?"保存中...":"VAULTEX SCANを保存"}</button><p className="flex items-center gap-2 text-xs text-white/40"><Check size={14} className="text-orange-400"/>測定条件を分けた上で、主要値をPB・グラフ・ランキングへ反映します。</p>
    </form></div></main>;
}

function Metric({label,unit,value,onChange,readOnly=false}:{label:string;unit:string;value:string;onChange:(value:string)=>void;readOnly?:boolean}) { return <label className="block"><span className="text-xs font-bold text-white/65">{label}</span><div className="relative mt-2"><input type="number" inputMode="decimal" min="0" step="any" value={value} readOnly={readOnly} onChange={(e)=>onChange(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#0d0f12] px-4 py-3 pr-20 text-white outline-none focus:border-orange-500 read-only:cursor-not-allowed read-only:text-white/55"/><span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-xs text-white/35">{unit}</span></div></label>; }
