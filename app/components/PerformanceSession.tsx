"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, Check, Cloud, LoaderCircle, RotateCcw, Save, Video, X } from "lucide-react";
import { competitionDetailMode, eventGroupsByKind, eventNamesByKind, isWindAffectedEvent, unitMap, type PerformanceKind } from "@/lib/performance-events";
import { bestCompetitionDetail, type CompetitionDetailInput } from "@/lib/competition-details";
import CompetitionDetailEditor from "@/app/components/CompetitionDetailEditor";
import { BarAttemptEditor, CombinedEventEditor } from "@/app/components/AdvancedPerformanceEditor";
import CoachPublishedRecords from "@/app/components/CoachPublishedRecords";
import { barSummary, combinedEventCoefficients, type AdvancedPerformanceDetails } from "@/lib/advanced-performance-details";
import { createClient } from "@/lib/supabase-browser";
import { formatVideoSize, PERFORMANCE_VIDEO_BUCKET, validateVideo } from "@/lib/performance-awareness";

type Athlete={id:string;name:string;programClass:string|null;event:string|null};
type Schedule={id:number;title:string;startsAt:string;endsAt:string|null;type:string|null;programClass:string|null;attendeeIds:string[]};
type Entry={value?:string;wind?:string;video?:File;details?:CompetitionDetailInput[];advancedDetails?:AdvancedPerformanceDetails};
const storageKey="vaultex-performance-live-v1";
const scheduleYear = (startsAt:string) => Number(new Date(startsAt).toLocaleDateString("en-CA",{year:"numeric",timeZone:"Asia/Tokyo"}));
const scheduleDate = (value:string) => new Date(value).toLocaleDateString("en-CA",{timeZone:"Asia/Tokyo"});

export default function PerformanceSession({athletes,schedules}:{athletes:Athlete[];schedules:Schedule[]}) {
  const [kind,setKind]=useState<Extract<PerformanceKind,"athletics"|"unofficial-athletics">>("unofficial-athletics");
  const [category,setCategory]=useState(eventNamesByKind("unofficial-athletics")[0]);
  const [scheduleId,setScheduleId]=useState(""); const [programClass,setProgramClass]=useState("all");
  const [year,setYear]=useState(()=>Number(new Date().toLocaleDateString("en-CA",{year:"numeric",timeZone:"Asia/Tokyo"})));
  const [date,setDate]=useState(()=>new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Tokyo"}));
  const [entries,setEntries]=useState<Record<string,Entry>>({}); const [restored,setRestored]=useState(false);
  const [sharedVideo,setSharedVideo]=useState<File>();
  const [sharedAthleteIds,setSharedAthleteIds]=useState<Set<string>>(()=>new Set());
  const [saving,setSaving]=useState(false); const [message,setMessage]=useState(""); const [uploading,setUploading]=useState("");
  useEffect(()=>{const frame=requestAnimationFrame(()=>{try{const raw=localStorage.getItem(storageKey);if(raw){const draft=JSON.parse(raw);setKind(draft.kind??"unofficial-athletics");setCategory(draft.category??eventNamesByKind("unofficial-athletics")[0]);setEntries(draft.entries??{});if(draft.date)setDate(draft.date);setScheduleId(draft.scheduleId??"");setProgramClass(draft.programClass??"all");if(Number.isInteger(draft.year))setYear(draft.year);}}finally{setRestored(true);}});return()=>cancelAnimationFrame(frame);},[]);
  useEffect(()=>{if(restored){const draftEntries=Object.fromEntries(Object.entries(entries).map(([id,entry])=>[id,{...entry,video:undefined}]));localStorage.setItem(storageKey,JSON.stringify({kind,category,entries:draftEntries,date,scheduleId,programClass,year}));}},[kind,category,entries,date,scheduleId,programClass,year,restored]);
  const matchingSchedules=useMemo(()=>schedules.filter((schedule)=>kind==="athletics"?schedule.type==="competition":schedule.type==="practice"),[schedules,kind]);
  const years=useMemo(()=>[...new Set([year,...matchingSchedules.map((schedule)=>scheduleYear(schedule.startsAt))])].sort((a,b)=>b-a),[matchingSchedules,year]);
  const yearSchedules=useMemo(()=>matchingSchedules.filter((schedule)=>scheduleYear(schedule.startsAt)===year),[matchingSchedules,year]);
  const selectedSchedule=matchingSchedules.find((s)=>String(s.id)===scheduleId);
  const selectedScheduleStart=selectedSchedule?scheduleDate(selectedSchedule.startsAt):undefined;
  const selectedScheduleEnd=selectedSchedule?.endsAt?scheduleDate(selectedSchedule.endsAt):selectedScheduleStart;
  const roster=useMemo(()=>athletes.filter((a)=>selectedSchedule?selectedSchedule.attendeeIds.includes(a.id):programClass==="all"||a.programClass===programClass),[athletes,selectedSchedule,programClass]);
  const needsWind=kind==="athletics"&&isWindAffectedEvent(category); const unit=unitMap[category]??"";
  const selectedDetailMode=kind==="athletics"?competitionDetailMode(category):null;
  const detailMode=selectedDetailMode;
  const setEntry=(id:string,patch:Partial<Entry>)=>setEntries((current)=>({...current,[id]:{...(current[id]??{}),...patch}}));
  const representative=(entry?:Entry)=>{
    if(entry?.advancedDetails?.type==="bar")return {numericValue:entry.advancedDetails.bestHeight??Number.NaN,windSpeed:undefined};
    if(entry?.advancedDetails?.type==="combined")return {numericValue:entry.advancedDetails.totalPoints,windSpeed:undefined};
    if(entry?.details?.length&&(detailMode==="attempt"||detailMode==="round"))return bestCompetitionDetail(entry.details,detailMode==="round");
    return {numericValue:Number(entry?.value),windSpeed:entry?.wind};
  };
  const count=roster.filter((a)=>{const best=representative(entries[a.id]);return best&&Number.isFinite(best.numericValue)&&best.numericValue>0;}).length;
  const pendingVideoCount=roster.filter((athlete)=>Boolean(entries[athlete.id]?.video)).length+(sharedVideo?1:0);
  const enableDetails=(id:string)=>{
    if(detailMode==="bar")return setEntry(id,{advancedDetails:{type:"bar",heights:[{height:"",attempts:[null,null,null]}],bestHeight:null,endedByThreeMisses:false}});
    if(detailMode==="combined")return setEntry(id,{advancedDetails:{type:"combined",discipline:category,formulaVersion:"WA_COMBINED_2025",events:combinedEventCoefficients(category).map((item)=>({event:item.event,value:"",points:null})),totalPoints:0,complete:false}});
    setEntry(id,{details:detailMode==="attempt"?Array.from({length:6},(_,index)=>({sequenceNumber:index+1,value:"",windSpeed:"",status:"valid" as const})):[{sequenceNumber:1,roundName:"予選",value:"",windSpeed:"",place:"",status:"valid"}]});
  };
  const resetSharedVideo=()=>{setSharedVideo(undefined);setSharedAthleteIds(new Set());};
  const toggleSharedAthlete=(id:string)=>setSharedAthleteIds((current)=>{const next=new Set(current);if(next.has(id))next.delete(id);else next.add(id);return next;});
  const chooseSharedVideo=(file:File)=>{setSharedVideo(file);setSharedAthleteIds(new Set(roster.filter((athlete)=>{const best=representative(entries[athlete.id]);return best&&Number.isFinite(best.numericValue)&&best.numericValue>0&&!entries[athlete.id]?.video;}).map((athlete)=>athlete.id)));setMessage("");};
  function changeKind(next:typeof kind){setKind(next);setCategory(eventNamesByKind(next)[0]);setScheduleId("");setEntries({});resetSharedVideo();setMessage("");}
  async function publish(){
    const records=roster.flatMap((athlete)=>{const entry=entries[athlete.id];const best=representative(entry);const value=Number(best?.numericValue);if(!Number.isFinite(value)||value<=0)return[];return[{athleteId:athlete.id,athleteName:athlete.name,value,windSpeed:best?.windSpeed?.trim()?Number(best.windSpeed):null,video:entry?.video,details:entry?.details??[],advancedDetails:entry?.advancedDetails??null}];});
    if(!records.length){setMessage("記録を1件以上入力してください。");return;}
    const invalidVideo=records.find((record)=>record.video&&validateVideo(record.video));
    if(invalidVideo?.video){setMessage(`${invalidVideo.athleteName}：${validateVideo(invalidVideo.video)}`);return;}
    if(sharedVideo){const error=validateVideo(sharedVideo);if(error){setMessage(`共有動画：${error}`);return;}const sharedTargets=records.filter((record)=>sharedAthleteIds.has(record.athleteId)&&!record.video);if(!sharedTargets.length){setMessage("共有動画を紐付ける、記録入力済みの選手を選んでください。");return;}}
    const sharedTargetCount=sharedVideo?records.filter((record)=>sharedAthleteIds.has(record.athleteId)&&!record.video).length:0;
    if(!confirm(`${records.length}名の${kind==="athletics"?"本番":"練習"}記録を反映します。${sharedTargetCount?`共有動画は${sharedTargetCount}名に追加します。`:""}`))return;
    setSaving(true);setMessage("");
    try{
      setUploading("記録を保存中");
      const response=await fetch("/api/coach/performance-session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({kind,category,date,scheduleId:scheduleId||null,records:records.map((record)=>({athleteId:record.athleteId,value:record.value,windSpeed:record.windSpeed,details:record.details,advancedDetails:record.advancedDetails}))})});
      const result=await response.json();if(!response.ok)throw new Error(result.error??"保存できませんでした。");
      const recordIdByAthlete=new Map<string,number>((result.records??[]).map((item:{athleteId:string;recordId:number})=>[item.athleteId,item.recordId]));
      const supabase=createClient();const failedVideos:string[]=[];
      for(const record of records){
        if(!record.video)continue;
        try{
          const recordId=recordIdByAthlete.get(record.athleteId);if(!recordId)throw new Error("保存した記録を確認できませんでした。");
          setUploading(`${record.athleteName}の動画をアップロード中`);
          const signResponse=await fetch("/api/coach/performance-video-upload",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({athleteId:record.athleteId,fileName:record.video.name,fileType:record.video.type,fileSize:record.video.size})});
          const signed=await signResponse.json();if(!signResponse.ok)throw new Error(signed.error??"動画のアップロードを開始できませんでした。");
          const {error:uploadError}=await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).uploadToSignedUrl(signed.path,signed.token,record.video,{contentType:record.video.type,cacheControl:"3600"});if(uploadError)throw uploadError;
          const attachResponse=await fetch(`/api/coach/performance-records/${recordId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({videoPath:signed.path})});if(!attachResponse.ok){const body=await attachResponse.json();throw new Error(body.error??"動画を記録に紐付けられませんでした。");}
          setEntries((current)=>({...current,[record.athleteId]:{...(current[record.athleteId]??{}),video:undefined}}));
        }catch{failedVideos.push(record.athleteName);}
      }
      if(sharedVideo){
        const targets=records.filter((record)=>sharedAthleteIds.has(record.athleteId)&&!record.video);
        try{
          setUploading(`共有動画を${targets.length}名へアップロード中`);
          const owner=targets[0];
          const signResponse=await fetch("/api/coach/performance-video-upload",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({athleteId:owner.athleteId,fileName:sharedVideo.name,fileType:sharedVideo.type,fileSize:sharedVideo.size})});
          const signed=await signResponse.json();if(!signResponse.ok)throw new Error(signed.error??"共有動画のアップロードを開始できませんでした。");
          const {error:uploadError}=await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).uploadToSignedUrl(signed.path,signed.token,sharedVideo,{contentType:sharedVideo.type,cacheControl:"3600"});if(uploadError)throw uploadError;
          const attachmentResults=await Promise.all(targets.map(async(record)=>{const recordId=recordIdByAthlete.get(record.athleteId);if(!recordId)return false;const response=await fetch(`/api/coach/performance-records/${recordId}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({videoPath:signed.path})});return response.ok;}));
          if(attachmentResults.some((ok)=>!ok))throw new Error("一部の選手へ共有動画を紐付けられませんでした。");
          resetSharedVideo();
        }catch{failedVideos.push("共有動画");}
      }
      const saved=Number(result.saved??0);const merged=Number(result.merged??0);
      if(failedVideos.length){setMessage(`記録は保存しました。${failedVideos.join("、")}の動画は送信待ちです。通信を確認して、もう一度「一括反映」を押してください。`);}
      else{setEntries({});resetSharedVideo();localStorage.removeItem(storageKey);setMessage(`${saved}件を新規反映しました。${merged?` ${merged}件は同じ日付・記録の既存データへ統合しました。`:""}`);}
    }catch(error){setMessage(error instanceof Error?error.message:"保存できませんでした。");}finally{setSaving(false);setUploading("");}
  }
  return <div className="mt-8 space-y-5">
    <CoachPublishedRecords refreshToken={message.length}/>
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#111] p-2"><button onClick={()=>changeKind("unofficial-athletics")} className={`rounded-xl px-4 py-4 text-sm font-black ${kind==="unofficial-athletics"?"bg-orange-500 text-black":"text-white/45"}`}>通常練習</button><button onClick={()=>changeKind("athletics")} className={`rounded-xl px-4 py-4 text-sm font-black ${kind==="athletics"?"bg-orange-500 text-black":"text-white/45"}`}>大会記録</button></div>
    <section className="grid gap-3 rounded-3xl border border-white/10 bg-[#111] p-4 sm:grid-cols-2 lg:grid-cols-5 sm:p-6"><label className="text-xs font-bold text-white/55">{kind==="athletics"?"大会の実施日":"練習日"}<input type="date" value={date} min={selectedScheduleStart} max={selectedScheduleEnd} onChange={(e)=>setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white [color-scheme:dark]"/>{selectedSchedule?.type==="competition"&&selectedScheduleStart!==selectedScheduleEnd?<span className="mt-1 block text-[10px] text-orange-300">複数日大会は、記録を出した日を選択</span>:null}</label><label className="text-xs font-bold text-white/55">種目<select value={category} onChange={(e)=>{setCategory(e.target.value);setEntries({});resetSharedVideo();}} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0b0c0e] px-4 py-3 text-white">{eventGroupsByKind(kind).map((group)=>group.label?<optgroup key={group.label} label={group.label}>{group.events.map((name)=><option key={name}>{name}</option>)}</optgroup>:group.events.map((name)=><option key={name}>{name}</option>))}</select>{kind==="unofficial-athletics"?<span className="mt-1 block text-[10px] text-emerald-300/70">普段の練習でCONTROL TESTを1種目だけ測定できます</span>:null}</label><label className="text-xs font-bold text-white/55">予定の年<select value={year} onChange={(e)=>{setYear(Number(e.target.value));setScheduleId("");}} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0b0c0e] px-4 py-3 text-white">{years.map((item)=><option key={item} value={item}>{item}年</option>)}</select></label><label className="text-xs font-bold text-white/55">{kind==="athletics"?"大会の参加名簿":"練習の参加名簿"}<select value={selectedSchedule?scheduleId:""} onChange={(e)=>{const next=e.target.value;setScheduleId(next);const schedule=matchingSchedules.find((item)=>String(item.id)===next);if(schedule)setDate(scheduleDate(schedule.startsAt));}} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0b0c0e] px-4 py-3 text-white"><option value="">クラスから選ぶ</option>{yearSchedules.map((s)=><option key={s.id} value={s.id}>{new Date(s.startsAt).toLocaleDateString("ja-JP",{timeZone:"Asia/Tokyo"})} {s.title}（参加{s.attendeeIds.length}名）</option>)}</select><span className="mt-1 block text-[10px] text-white/30">{kind==="athletics"?"試合・大会予定だけを表示":"練習予定だけを表示"}</span></label><label className="text-xs font-bold text-white/55">クラス<select disabled={!!selectedSchedule} value={programClass} onChange={(e)=>setProgramClass(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#0b0c0e] px-4 py-3 text-white disabled:opacity-40"><option value="all">全選手</option>{["ジュニア","ユース","エリート","マスターズ"].map((c)=><option key={c}>{c}</option>)}</select></label></section>
    <section className="rounded-3xl border border-sky-400/25 bg-sky-400/[.04] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-[10px] font-black tracking-[.16em] text-sky-300">RACE VIDEO</p><h2 className="mt-1 text-lg font-black">1本の動画を複数選手へ</h2><p className="mt-1 text-xs text-white/45">① 動画を追加　② 映っている選手を選択　③ 下で記録を入力して一括反映</p></div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
          <input id="coach-shared-camera" type="file" accept="video/*" capture="environment" className="sr-only" onChange={(event)=>{const file=event.target.files?.[0];if(file)chooseSharedVideo(file);event.currentTarget.value="";}}/>
          <label htmlFor="coach-shared-camera" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-3 text-xs font-black text-black"><Camera size={16}/>その場で撮影</label>
          <input id="coach-shared-library" type="file" accept="video/*" className="sr-only" onChange={(event)=>{const file=event.target.files?.[0];if(file)chooseSharedVideo(file);event.currentTarget.value="";}}/>
          <label htmlFor="coach-shared-library" className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-400/35 px-4 py-3 text-xs font-black text-sky-200"><Video size={16}/>端末から選ぶ</label>
        </div>
      </div>
      {sharedVideo?<div className="mt-4 space-y-3"><div className="flex flex-wrap items-center gap-2 rounded-xl border border-sky-400/20 bg-black/25 p-3 text-xs text-white/60"><Check size={15} className="text-emerald-300"/><span className="font-black text-white">動画を準備しました</span><span className="max-w-64 truncate">{sharedVideo.name}</span><span className="text-white/30">{formatVideoSize(sharedVideo.size)}</span><span className="rounded-full bg-sky-400/15 px-2 py-1 font-black text-sky-200">選択 {sharedAthleteIds.size}名</span><button type="button" className="ml-auto" aria-label="共有動画を外す" onClick={resetSharedVideo}><X size={15}/></button></div><div><div className="mb-2 flex items-center justify-between gap-3"><strong className="text-xs">映っている選手</strong><button type="button" onClick={()=>setSharedAthleteIds(new Set())} className="text-[11px] font-black text-white/45">選択を解除</button></div><div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-xl bg-black/20 p-3">{roster.map((athlete)=>{const individuallyAttached=Boolean(entries[athlete.id]?.video);const selected=sharedAthleteIds.has(athlete.id)&&!individuallyAttached;return <button type="button" key={athlete.id} disabled={individuallyAttached} onClick={()=>toggleSharedAthlete(athlete.id)} className={`rounded-full border px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-35 ${selected?"border-sky-300 bg-sky-300 text-black":"border-white/15 text-white/55"}`}>{selected?"✓ ":""}{athlete.name}{individuallyAttached?"（個別動画）":""}</button>;})}</div></div><p className="text-[10px] text-white/35">記録を先に入力していた選手は自動選択されます。個別動画を選んだ選手は個別側を優先します。</p></div>:<p className="mt-4 rounded-xl bg-black/20 p-3 text-[11px] text-white/40">同じレースに複数選手が出たときだけ使います。1人だけの場合は各選手欄の「個別動画」を使えます。</p>}
    </section>
    <section className="overflow-hidden rounded-3xl border border-orange-500/35 bg-[#101010]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-5"><div><p className="text-[10px] font-black tracking-[.16em] text-orange-400">{kind==="athletics"?"COMPETITION":"TRAINING"}</p><h2 className="mt-1 text-2xl font-black">{category}</h2><p className="mt-1 text-xs text-white/45">コーチが記録と動画を登録。振り返りは選手があとから追加できます。</p></div><span className="flex items-center gap-2 text-xs text-emerald-300"><Cloud size={15}/>端末へ自動保存</span></div><div className="divide-y divide-white/[.07]">{roster.length?roster.map((athlete)=>{const entry=entries[athlete.id]??{};const hasDetails=Boolean(entry.details?.length||entry.advancedDetails);const inputId=`coach-video-${athlete.id}`;return <div key={athlete.id} className="p-4"><div className={`grid gap-3 ${needsWind?"sm:grid-cols-[minmax(190px,1fr)_180px_180px]":"sm:grid-cols-[minmax(190px,1fr)_220px]"} sm:items-center`}><div><strong>{athlete.name}</strong><span className="ml-2 text-xs text-white/35">{athlete.programClass}</span><p className="mt-1 text-[11px] text-white/35">{athlete.event}</p></div>{!hasDetails?<><label className="relative"><input aria-label={`${athlete.name} 記録`} inputMode="decimal" placeholder="記録" value={entry.value??""} onChange={(e)=>setEntry(athlete.id,{value:e.target.value})} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 pr-14 text-lg font-black outline-none focus:border-orange-500"/><span className="absolute right-3 top-3.5 text-xs text-white/35">{unit}</span></label>{needsWind&&<label className="relative"><input aria-label={`${athlete.name} 風速`} inputMode="decimal" placeholder="風速" value={entry.wind??""} onChange={(e)=>setEntry(athlete.id,{wind:e.target.value})} className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-3 pr-14 text-lg font-black outline-none focus:border-orange-500"/><span className="absolute right-3 top-3.5 text-xs text-white/35">m/s</span></label>}</>:<div className="sm:col-span-2 text-sm font-black text-emerald-300">代表記録 {representative(entry)?.numericValue ?? "—"}{unit}</div>}</div><div className="mt-3 flex flex-wrap items-center gap-2"><input id={inputId} type="file" accept="video/*" capture="environment" className="sr-only" onChange={(event)=>{const file=event.target.files?.[0];if(file)setEntry(athlete.id,{video:file});event.currentTarget.value="";}}/><label htmlFor={inputId} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-400/[.06] px-3 py-2 text-xs font-black text-sky-300"><Camera size={15}/>{entry.video?"動画を変更":"撮影・動画を追加"}</label>{entry.video?<span className="flex min-w-0 items-center gap-2 rounded-lg bg-white/[.04] px-3 py-2 text-xs text-white/55"><Video size={14} className="shrink-0 text-sky-300"/><span className="max-w-52 truncate">{entry.video.name}</span><span className="shrink-0 text-white/30">{formatVideoSize(entry.video.size)}</span><button type="button" aria-label={`${athlete.name}の動画を外す`} disabled={saving} onClick={()=>setEntry(athlete.id,{video:undefined})}><X size={14}/></button></span>:<span className="text-[10px] text-white/25">スマホではその場で撮影できます</span>}</div>{detailMode?<div className="mt-3">{entry.advancedDetails?.type==="bar"?<><BarAttemptEditor rows={entry.advancedDetails.heights} onChange={(rows)=>{const summary=barSummary(rows);setEntry(athlete.id,{advancedDetails:{type:"bar",heights:rows,bestHeight:summary.bestHeight,endedByThreeMisses:summary.endedByThreeMisses}});}}/><button type="button" onClick={()=>setEntry(athlete.id,{advancedDetails:undefined})} className="mt-2 text-xs text-white/40">通常入力に戻す</button></>:entry.advancedDetails?.type==="combined"?<><CombinedEventEditor discipline={category} results={entry.advancedDetails.events} onChange={(events)=>{const totalPoints=events.reduce((sum,item)=>sum+(item.points??0),0);const complete=events.length>0&&events.every((item)=>item.value!==""&&item.points!==null);setEntry(athlete.id,{advancedDetails:{type:"combined",discipline:category,formulaVersion:"WA_COMBINED_2025",events,totalPoints,complete}});}}/><button type="button" onClick={()=>setEntry(athlete.id,{advancedDetails:undefined})} className="mt-2 text-xs text-white/40">通常入力に戻す</button></>:entry.details?.length&&(detailMode==="attempt"||detailMode==="round")?<><CompetitionDetailEditor mode={detailMode} details={entry.details} onChange={(details)=>setEntry(athlete.id,{details})} unit={unit} needsWind={needsWind}/><button type="button" onClick={()=>setEntry(athlete.id,{details:undefined})} className="mt-2 text-xs text-white/40">通常入力に戻す</button></>:<button type="button" onClick={()=>enableDetails(athlete.id)} className="rounded-lg border border-orange-500/30 px-3 py-2 text-xs font-black text-orange-300">{detailMode==="bar"?"高さごとの○／×を入力":detailMode==="combined"?"種目別記録・得点を入力":detailMode==="attempt"?"1〜6回を入力":"予選・決勝などを入力"}</button>}</div>:null}</div>}):<p className="p-10 text-center text-sm text-white/35">参加者がいません。予定の出欠またはクラスを確認してください。</p>}</div></section>
    {pendingVideoCount?<p className="rounded-xl border border-sky-400/20 bg-sky-400/[.05] px-4 py-3 text-xs text-sky-200">動画 {pendingVideoCount}件を選択中です。送信完了の表示が出るまで、この画面を閉じないでください。</p>:null}
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-orange-500/30 bg-[#111]/95 p-3 shadow-2xl backdrop-blur"><span className="mr-auto text-sm font-bold">{uploading||`入力済み ${count}/${roster.length}名`}</span><button disabled={saving} onClick={()=>{if(confirm("入力途中の内容を消しますか？")){setEntries({});resetSharedVideo();localStorage.removeItem(storageKey);}}} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-bold text-white/55 disabled:opacity-40"><RotateCcw size={15}/>下書きを消す</button><button disabled={saving} onClick={publish} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black disabled:opacity-50">{saving?<LoaderCircle size={17} className="animate-spin"/>:<Save size={17}/>}一括反映</button></div>{message&&<p role="status" className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-200"><Check size={16} className="mr-2 inline"/>{message}</p>}
  </div>;
}
