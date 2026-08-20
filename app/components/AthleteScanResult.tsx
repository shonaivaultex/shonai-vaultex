"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowUpRight, Check, ChevronDown, CircleGauge, HelpCircle, ScanLine, Sparkles, Target } from "lucide-react";
import { abilityKeys, type AthleteAbilityKey, type AthleteAxis, type AthleteScanEvaluation } from "@/lib/athlete-scan";

type Comparison = { previous: AthleteScanEvaluation | null; first: AthleteScanEvaluation | null };
const axes: AthleteAxis[] = ["SPEED","POWER","REACTIVE"];
const axisInfo: Record<AthleteAxis,{ja:string;description:string}> = {
  SPEED:{ja:"速度特性",description:"高い速度を発揮し、その速度を維持する身体特性。"},
  POWER:{ja:"出力特性",description:"一度の動作で大きな力を生み出し、全身へ伝える身体特性。"},
  REACTIVE:{ja:"反発特性",description:"地面から受けた力を、素早く次の動作や連続した出力へつなげる身体特性。"},
};
const abilityHelp: Record<AthleteAbilityKey,string> = {
  max_speed:"30mの助走で加速した後、高い走速度を発揮する能力を評価します。",
  horizontal_power:"一度の動作で前方向へ大きな力を発揮する能力を評価します。",
  bounce_power:"前方向への大きな力発揮を、連続した跳躍へつなげる能力を評価します。",
  total_body_power:"下肢・体幹・上半身を連動させ、全身で大きな力を発揮する能力を評価します。",
  reactive_performance:"短い接地で地面からの反発を利用し、腕振りを含めて素早く大きな跳躍へつなげる能力を評価します。",
  speed_endurance:"高い走速度をできるだけ維持し、速度低下を抑える能力を評価します。",
};
const typeCopy: Record<string,string> = {
  SPEED:"今回のSCANでは、高い速度を発揮し、その速度を維持する特性が強く表れています。",
  POWER:"今回のSCANでは、一度の動作で大きな力を生み出し、全身へ伝える特性が強く表れています。",
  REACTIVE:"今回のSCANでは、地面から受けた力を素早く次の動作や連続した出力へつなげる特性が強く表れています。",
  BALANCED:"今回のSCANでは、SPEED・POWER・REACTIVEの3特性が比較的バランスよく表れています。",
  "SPEED × POWER":"今回のSCANでは、速度特性を中心に、大きな力を全身へ伝える特性も強く表れています。",
  "SPEED × REACTIVE":"今回のSCANでは、速度特性を中心に、地面からの力を素早く次の動作へつなげる特性も強く表れています。",
  "POWER × SPEED":"今回のSCANでは、出力特性を中心に、高い速度を発揮する特性も強く表れています。",
  "POWER × REACTIVE":"今回のSCANでは、出力特性を中心に、地面からの力を素早く次の動作へつなげる特性も強く表れています。",
  "REACTIVE × SPEED":"今回のSCANでは、反発特性を中心に、高い速度を発揮する特性も強く表れています。",
  "REACTIVE × POWER":"今回のSCANでは、反発特性を中心に、大きな力を全身へ伝える特性も強く表れています。",
};
const signed=(value:number)=>`${value>0?"+":""}${Math.round(value)}`;
const shownScore=(value:number|null)=>value==null?"—":String(Math.round(value));

export default function AthleteScanResult({evaluation,comparison,scanNumber,measuredOn,standardLabel,showReveal=false}:{evaluation:AthleteScanEvaluation;comparison:Comparison;scanNumber:number;measuredOn:string;standardLabel:string;showReveal?:boolean}) {
  const [analyzing,setAnalyzing]=useState(showReveal);
  useEffect(()=>{if(!showReveal)return;const reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)").matches;const timer=window.setTimeout(()=>setAnalyzing(false),reducedMotion?0:3900);return()=>window.clearTimeout(timer);},[showReveal]);
  if(analyzing)return <ScanReveal/>;
  const chart=axes.map((axis)=>({axis,value:evaluation.axes[axis]??0}));
  const chartMax=Math.max(100,Math.ceil(Math.max(...chart.map((item)=>item.value),100)/20)*20);
  const availableAxes=axes.filter((axis)=>evaluation.axes[axis]!=null).sort((a,b)=>(evaluation.axes[b]??0)-(evaluation.axes[a]??0));
  const strength=availableAxes[0]??null;
  const growth=evaluation.nextGrowth;
  const measuredCount=abilityKeys.filter((key)=>evaluation.abilities[key].rawValue!=null).length;
  const scoredCount=abilityKeys.filter((key)=>evaluation.abilities[key].score!=null).length;
  const axisGrowths=comparison.previous?axes.flatMap((axis)=>{const before=comparison.previous?.axes[axis];const after=evaluation.axes[axis];return before!=null&&after!=null?[{label:axis,diff:after-before}]:[]}):[];
  const abilityGrowths=comparison.previous?abilityKeys.flatMap((key)=>{const before=comparison.previous?.abilities[key].score;const after=evaluation.abilities[key].score;return before!=null&&after!=null?[{label:evaluation.abilities[key].nameJa,diff:after-before}]:[]}):[];
  const biggest=[...axisGrowths,...abilityGrowths].sort((a,b)=>b.diff-a.diff)[0]??null;
  const previousType=comparison.previous?.typeNameJa;
  return <div className="scan-result-enter space-y-7">
    <section className="overflow-hidden rounded-3xl border border-orange-500/45 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.2),transparent_38%),#111] p-5 sm:p-8">
      <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.24em] text-orange-400">SHONAI VAULTEX</p><h1 className="mt-1 text-2xl font-black sm:text-4xl">ATHLETE SCAN</h1><p className="mt-1 text-xs text-white/40">SCAN #{String(scanNumber).padStart(2,"0")} ・ {measuredOn}</p></div><span className="rounded-full border border-orange-500/35 bg-orange-500/10 px-3 py-2 text-[9px] font-black tracking-[.12em] text-orange-300">VER.1 BETA</span></div>
      <div className="mt-6 border-t border-white/10 pt-5"><p className="text-[10px] font-black tracking-[.18em] text-white/45">CURRENT ATHLETE TYPE</p><p className="mt-1 text-xs text-white/35">現在の身体特性</p>{evaluation.typeCode?<><p className="mt-3 break-words text-3xl font-black leading-tight text-orange-400 sm:text-5xl">{evaluation.typeCode}</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{evaluation.typeNameJa}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">{typeCopy[evaluation.typeCode]??evaluation.typeDescription}</p></>:<><h2 className="mt-3 text-2xl font-black">PROFILE ANALYZING</h2><p className="mt-2 text-sm leading-6 text-white/50">タイプ確定に必要な測定値またはSTANDARDが不足しています。未測定は0点として扱いません。</p></>}</div>
      <div className="mt-5 grid grid-cols-3 gap-2">{axes.map((axis)=><div key={axis} className="rounded-xl border border-white/10 bg-black/20 p-3 text-center"><p className="text-[9px] font-black tracking-wide text-white/45">{axis}</p><p className="mt-1 text-xl font-black sm:text-2xl">{shownScore(evaluation.axes[axis])}</p><p className="mt-0.5 text-[9px] text-white/35">{axisInfo[axis].ja}</p></div>)}</div>
      <p className="mt-5 text-center text-sm font-bold text-white/65">これが今のあなた。そして、ここから変わっていく。</p>
    </section>
    {scanNumber===1?<Baseline/>:<section className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[.05] p-5"><p className="text-[10px] font-black tracking-[.18em] text-cyan-300">PROFILE UPDATED</p><p className="mt-2 text-sm text-white/60">前回のSCANから、現在の身体能力プロフィールを更新しました。</p></section>}
    <section className="grid gap-5 rounded-3xl border border-white/10 bg-[#111] p-5 lg:grid-cols-[1fr_1.15fr] lg:p-7"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">YOUR PHYSICAL PROFILE</p><h2 className="mt-1 text-2xl font-black">3つの身体特性</h2><div className="mt-5 grid gap-3">{axes.map((axis)=>{const value=evaluation.axes[axis];return <div key={axis} className="rounded-2xl bg-white/[.035] p-4"><div className="flex items-end justify-between gap-3"><div><p className="font-black">{axis}｜{axisInfo[axis].ja}</p><p className="mt-1 text-xs leading-5 text-white/40">{axisInfo[axis].description}</p></div><strong className="shrink-0 text-3xl text-orange-400">{shownScore(value)}</strong></div>{value!=null?<div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-orange-500" style={{width:`${Math.min(100,Math.max(0,value))}%`}}/></div>:null}</div>})}</div></div><div className="h-[330px] min-w-0"><ResponsiveContainer width="100%" height="100%"><RadarChart data={chart} outerRadius="72%"><PolarGrid stroke="rgba(255,255,255,.15)"/><PolarAngleAxis dataKey="axis" tick={{fill:"rgba(255,255,255,.7)",fontSize:11,fontWeight:800}}/><PolarRadiusAxis domain={[0,chartMax]} tick={{fill:"rgba(255,255,255,.3)",fontSize:9}} axisLine={false}/><Radar dataKey="value" stroke="#f97316" fill="#f97316" fillOpacity={.32} strokeWidth={3}/></RadarChart></ResponsiveContainer></div></section>
    <section className="grid gap-4 md:grid-cols-2">{strength?<ProfileFocus eyebrow="CURRENT STRENGTH" title={`${strength}｜${axisInfo[strength].ja}`} text={`今回のSCANでは、${axisInfo[strength].ja}が現在のプロフィールで最も高く表れています。`} icon={<Sparkles size={19}/>} color="orange"/>:null}{growth?<ProfileFocus eyebrow="NEXT GROWTH" title={`${growth}｜${axisInfo[growth].ja}`} text="現在の3特性の中では、今後の変化を確認していきたい領域です。次回SCANでどのように変化するか確認してみましょう。" icon={<Target size={19}/>} color="cyan"/>:null}</section>
    <section><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">PERFORMANCE DETAILS</p><h2 className="mt-1 text-2xl font-black">6つの能力</h2></div><div className="text-right"><p className="text-sm font-black">{measuredCount} / 6 ABILITIES MEASURED</p><p className="mt-1 text-xs text-white/40">{measuredCount<6?`あと${6-measuredCount}項目で測定がそろいます。`:scoredCount<6?"一部のSTANDARDは設定中です。":"すべての能力を測定しました。"}</p></div></div><ScoreExplanation/><div className="mt-4 grid gap-4 lg:grid-cols-2">{abilityKeys.map((key)=><AbilityCard key={key} abilityKey={key} evaluation={evaluation} comparison={comparison}/>)}</div></section>
    {comparison.previous?<Evolution evaluation={evaluation} previous={comparison.previous} previousType={previousType} biggest={biggest}/>:null}
    <section className="rounded-3xl border border-orange-500/30 bg-[#111] p-6 text-center"><ScanLine className="mx-auto text-orange-400" size={28}/><p className="mt-3 text-[10px] font-black tracking-[.2em] text-orange-400">NEXT SCAN</p><h2 className="mt-2 text-xl font-black">YOUR BODY KEEPS EVOLVING.</h2><p className="mt-2 text-sm leading-6 text-white/50">次回のCONTROL TESTで、身体能力がどのように変化したか確認してみましょう。</p></section>
    <section className="rounded-2xl border border-orange-500/25 bg-orange-500/[.045] p-5"><p className="font-black text-orange-300">{standardLabel}</p><p className="mt-3 text-xs leading-6 text-white/50">VAULTEX SCOREは、SHONAI VAULTEXが身体能力の成長を可視化するために設定した独自評価基準です。100はVAULTEX STANDARDへの到達を示し、満点ではありません。測定データや研究知見の蓄積に伴い、基準値・評価方法を更新する場合があります。</p></section>
  </div>;
}

function ScanReveal(){
  const [stage,setStage]=useState(0);
  useEffect(()=>{const timers=[520,1100,1750,2450,3000].map((delay,index)=>window.setTimeout(()=>setStage(index+1),delay));return()=>timers.forEach(window.clearTimeout);},[]);
  const phases=["SYSTEM INITIALIZING","MEASUREMENT DATA ACQUIRED","MAPPING 6 ABILITIES","BUILDING ATHLETE PROFILE","SCAN COMPLETE"];
  const progress=[8,26,52,78,94,100][stage]??100;
  return <section role="status" aria-live="polite" className="scan-stage relative flex min-h-[72vh] overflow-hidden rounded-3xl border border-orange-500/45 bg-[#090b0e] p-5 text-center sm:p-8">
    <div className="scan-stage-grid absolute inset-0"/><div className="scan-stage-beam absolute inset-x-0 top-0 h-px bg-orange-400"/>
    <span className="absolute left-5 top-5 text-[9px] font-black tracking-[.2em] text-orange-400/55">VAULTEX SYSTEM / 01</span><span className="absolute right-5 top-5 text-[9px] font-black tracking-[.2em] text-white/25">LIVE ANALYSIS</span>
    <div className="relative z-10 m-auto w-full max-w-xl">
      <div className="scan-core relative mx-auto h-52 w-52 sm:h-64 sm:w-64">
        <div className="scan-orbit scan-orbit-outer absolute inset-0 rounded-full border border-orange-500/25"/><div className="scan-orbit scan-orbit-inner absolute inset-7 rounded-full border border-dashed border-orange-400/45"/>
        <div className="scan-sweep absolute inset-12 rounded-full"/>
        <div className="absolute inset-[4.5rem] grid place-items-center rounded-full border border-orange-400/60 bg-orange-500/10 text-orange-300 shadow-[0_0_55px_rgba(249,115,22,.3)] sm:inset-24"><ScanLine size={38}/></div>
        {["SPEED","POWER","BOUNCE","REACTIVE"].map((label,index)=><span key={label} className={`scan-node scan-node-${index+1} absolute rounded-full border px-2 py-1 text-[8px] font-black tracking-wider ${stage>index?"border-orange-400/60 bg-orange-500/15 text-orange-200":"border-white/10 bg-black/70 text-white/25"}`}>{label}</span>)}
      </div>
      <p className="mt-4 text-[10px] font-black tracking-[.28em] text-orange-400">VAULTEX ATHLETE SCAN</p>
      <h1 className={`mt-2 text-2xl font-black tracking-[-.03em] sm:text-4xl ${stage===5?"text-orange-300":"text-white"}`}>{phases[Math.min(stage,4)]}</h1>
      <p className="mt-2 text-xs font-bold tracking-[.14em] text-white/35">PHYSICAL PERFORMANCE PROFILING</p>
      <div className="mx-auto mt-7 max-w-md"><div className="h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-orange-700 via-orange-400 to-amber-200 shadow-[0_0_18px_rgba(249,115,22,.7)] transition-[width] duration-500" style={{width:`${progress}%`}}/></div><div className="mt-2 flex items-center justify-between text-[9px] font-black tracking-[.16em] text-white/30"><span>ANALYSIS</span><span className="text-orange-300">{progress}%</span></div></div>
      <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black tracking-[.16em] text-white/45">{stage===5?<><Check size={15} className="text-orange-400"/>PROFILE READY</>:<><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400"/>DO NOT CLOSE</>}</div>
    </div>
  </section>;
}
function Baseline(){return <section className="rounded-2xl border border-cyan-400/30 bg-cyan-400/[.06] p-5"><p className="text-[10px] font-black tracking-[.18em] text-cyan-300">YOUR BASELINE HAS BEEN CREATED.</p><h2 className="mt-2 text-xl font-black">あなたの最初の身体能力プロフィールが完成しました。</h2><p className="mt-2 text-sm leading-6 text-white/55">ここが、VAULTEXで身体能力の変化を記録していくスタート地点です。</p></section>}
function ProfileFocus({eyebrow,title,text,icon,color}:{eyebrow:string;title:string;text:string;icon:ReactNode;color:"orange"|"cyan"}){const classes=color==="orange"?"border-orange-500/30 bg-orange-500/[.055] text-orange-300":"border-cyan-400/25 bg-cyan-400/[.045] text-cyan-300";return <article className={`rounded-2xl border p-5 ${classes}`}><p className="flex items-center gap-2 text-[10px] font-black tracking-[.16em]">{icon}{eyebrow}</p><h2 className="mt-3 text-xl font-black text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-white/55">{text}</p></article>}
function ScoreExplanation(){return <details className="group mt-4 rounded-xl border border-white/10 bg-[#111] p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-white/65"><HelpCircle size={17} className="text-orange-400"/>VAULTEX SCOREとは？<ChevronDown size={16} className="ml-auto transition group-open:rotate-180"/></summary><p className="mt-3 border-t border-white/10 pt-3 text-xs leading-6 text-white/45">100点満点の評価ではありません。100はVAULTEXが設定した「VAULTEX 100 STANDARD」への到達を表します。年齢に関係なく共通の基準で、身体能力の現在地と成長を確認するためのスコアです。100を超えることもあります。</p></details>}
function AbilityCard({abilityKey,evaluation,comparison}:{abilityKey:AthleteAbilityKey;evaluation:AthleteScanEvaluation;comparison:Comparison}){const item=evaluation.abilities[abilityKey];const previous=comparison.previous?.abilities[abilityKey]?.score??null;const first=comparison.first?.abilities[abilityKey]?.score??null;const beyond=item.score!=null&&item.score>=100;return <article className={`rounded-2xl border bg-[#111] p-5 ${beyond?"border-orange-400/55 shadow-[0_0_25px_rgba(249,115,22,.08)]":"border-white/10"}`}><div className="flex justify-between gap-4"><div><h3 className="font-black">{item.nameJa}</h3><p className="mt-1 text-[9px] font-black tracking-[.12em] text-orange-400">{item.nameEn}</p></div><div className="text-right">{item.score==null?<strong className="text-sm text-white/45">{item.rawValue==null?"NOT MEASURED":"評価準備中"}</strong>:<><strong className="text-3xl">{Math.round(item.score)}</strong><span className="ml-1 text-[10px] text-white/35">SCORE</span></>}{beyond?<span className="mt-1 block text-[9px] font-black tracking-wider text-orange-300">BEYOND STANDARD</span>:null}</div></div>{item.rawValue==null?<p className="mt-4 rounded-lg bg-white/[.035] p-3 text-xs text-white/45">{item.nameJa}のCONTROL TEST測定で解放</p>:null}{beyond?<p className="mt-3 text-xs text-orange-200/65">VAULTEX 100 STANDARDを超えるパフォーマンスが記録されました。</p>:null}<details className="group mt-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-bold text-white/45"><CircleGauge size={15}/>詳しく見る<ChevronDown size={15} className="ml-auto transition group-open:rotate-180"/></summary><div className="mt-3 border-t border-white/10 pt-3"><p className="text-xs leading-5 text-white/45"><b className="text-white/65">この能力とは？</b><br/>{abilityHelp[abilityKey]}競技成績との因果関係を断定するものではありません。</p><dl className="mt-3 grid grid-cols-2 gap-2 text-xs"><Data label="実測値" value={item.rawValue==null?"—":`${item.rawValue}${item.unit}`}/><Data label="使用テスト" value={item.testName}/><Data label="100 STANDARD" value={item.standardDisplay}/><Data label="前回SCAN差" value={item.score==null||previous==null?"—":signed(item.score-previous)}/><Data label="初回SCAN差" value={item.score==null||first==null?"BASELINE":signed(item.score-first)}/></dl></div></details></article>}
function Evolution({evaluation,previous,previousType,biggest}:{evaluation:AthleteScanEvaluation;previous:AthleteScanEvaluation;previousType:string|null|undefined;biggest:{label:string;diff:number}|null}){return <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[.035] p-5 sm:p-7"><p className="text-[10px] font-black tracking-[.2em] text-cyan-300">PROFILE UPDATED</p><h2 className="mt-1 text-2xl font-black">前回SCANからの変化</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{axes.map((axis)=>{const before=previous.axes[axis];const after=evaluation.axes[axis];return <div key={axis} className="rounded-xl bg-black/20 p-4"><p className="text-xs font-black">{axis}｜{axisInfo[axis].ja}</p><p className="mt-2 text-xl font-black">{before==null||after==null?"評価準備中":<>{Math.round(before)} <ArrowUpRight className="inline text-cyan-300" size={16}/> {Math.round(after)} <span className="ml-2 text-sm text-cyan-300">{signed(after-before)}</span></>}</p></div>})}</div>{biggest&&biggest.diff>0?<div className="mt-5 rounded-xl border border-orange-500/25 bg-orange-500/[.06] p-4"><p className="text-[10px] font-black tracking-[.16em] text-orange-300">BIGGEST GROWTH｜今回最も大きな変化</p><p className="mt-2 text-xl font-black">{biggest.label} <span className="text-orange-300">{signed(biggest.diff)}</span></p><p className="mt-1 text-xs text-white/45">前回SCANから今回までで、最も大きな変化が見られた項目です。</p></div>:null}{previousType&&evaluation.typeNameJa&&previousType!==evaluation.typeNameJa?<div className="mt-5 rounded-xl border border-white/10 p-4"><p className="text-[10px] font-black tracking-[.16em] text-cyan-300">PROFILE EVOLUTION</p><p className="mt-3 font-black">前回 {previousType} <ArrowDown className="mx-2 inline text-cyan-300" size={16}/> 今回 {evaluation.typeNameJa}</p><p className="mt-2 text-sm text-white/50">YOUR ATHLETE TYPE HAS EVOLVED. 身体能力バランスの変化により、新しい特性がプロフィールに表れました。</p></div>:null}</section>}
function Data({label,value}:{label:string;value:string}){return <div className="rounded-lg bg-white/[.035] p-3"><dt className="text-white/35">{label}</dt><dd className="mt-1 break-words font-bold text-white/70">{value}</dd></div>}
