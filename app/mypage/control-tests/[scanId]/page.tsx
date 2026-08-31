import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AthleteScanResult from "@/app/components/AthleteScanResult";
import { evaluateAthleteScan, type AthleteMeasurement, type AthleteStandard, type TypeSettings } from "@/lib/athlete-scan";
import { createClient } from "@/lib/supabase-server";
import { classifyContactProfile, type ContactProfileSettings } from "@/lib/contact-profile";

type JumpTrial={test_code:string;trial_number:number;jump_height_cm:number|string;contact_time_ms:number|string|null;rsi:number|string|null;drop_height_cm:number|string|null;is_valid:boolean};
type Scan = { id:string; scan_number:number; measured_on:string; athlete_standard_version:string|null; profile_snapshot:Record<string,unknown>; contact_profile_snapshot:Record<string,unknown>|null; control_test_measurements:AthleteMeasurement[]|null; control_test_jump_trials?:JumpTrial[]|null };

export default async function AthleteScanPage({params,searchParams}:{params:Promise<{scanId:string}>;searchParams:Promise<{reveal?:string}>}) {
  const {scanId}=await params;
  const {reveal}=await searchParams;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect(`/login?next=${encodeURIComponent(`/mypage/control-tests/${scanId}`)}`);
  const {data:scan}=await supabase.from("control_test_scans").select("id, scan_number, measured_on, athlete_standard_version, profile_snapshot, contact_profile_snapshot, control_test_measurements(test_code, primary_value, metrics, implement_weight_kg, implement_name, equipment, distance_m, jump_count), control_test_jump_trials(test_code,trial_number,jump_height_cm,contact_time_ms,rsi,drop_height_cm,is_valid)").eq("id",scanId).eq("user_id",user.id).maybeSingle();
  if(!scan) notFound();
  const current=scan as Scan;
  const {data:currentSet}=await supabase.from("athlete_scan_standard_sets").select("version,label").eq("is_current",true).maybeSingle();
  const version=current.athlete_standard_version??currentSet?.version;
  if(!version) notFound();
  const {data:player}=await supabase.from("players").select("gender").eq("user_id",user.id).maybeSingle();
  const gender=String(current.profile_snapshot?.gender??player?.gender??"");
  const [{data:standards},{data:typeSettings},{data:history},{data:contactSettings}]=await Promise.all([
    supabase.from("athlete_scan_standards").select("standard_version, gender, test_code, equipment, weight_kg, distance_m, jump_count, score_100_value, score_0_value, higher_is_better, status, notes").eq("standard_version",version).eq("gender",gender),
    supabase.from("athlete_scan_type_settings").select("balanced_max_spread, composite_max_gap, type_descriptions").eq("standard_version",version).maybeSingle(),
    supabase.from("control_test_scans").select("id, scan_number, measured_on, athlete_standard_version, profile_snapshot, control_test_measurements(test_code, primary_value, metrics, implement_weight_kg, implement_name, equipment, distance_m, jump_count)").eq("user_id",user.id).lte("scan_number",current.scan_number).order("scan_number",{ascending:true}),
    supabase.from("contact_profile_settings").select("version,quick_upper_ms,balanced_upper_ms,junior_drop_height_cm,youth_drop_height_cm,elite_drop_height_cm,masters_drop_height_cm,status,notes").eq("is_current",true).maybeSingle(),
  ]);
  if(!typeSettings||!standards?.length) notFound();
  const settings=typeSettings as TypeSettings;
  const standardRows=standards as AthleteStandard[];
  const ordered=(history??[]) as Scan[];
  const evaluated=ordered.map((item)=>({scan:item,evaluation:evaluateAthleteScan(item.control_test_measurements??[],standardRows,settings)}));
  const evaluation=evaluated.find((item)=>item.scan.id===current.id)?.evaluation??evaluateAthleteScan(current.control_test_measurements??[],standardRows,settings);
  const index=evaluated.findIndex((item)=>item.scan.id===current.id);
  const previous=index>0?evaluated[index-1].evaluation:null;
  const first=index>0?evaluated[0].evaluation:null;
  const representative=[...(current.control_test_jump_trials??[])].filter((item)=>item.test_code==="drop_jump"&&item.is_valid&&item.rsi!=null).sort((a,b)=>Number(b.rsi)-Number(a.rsi))[0];
  const contact=current.contact_profile_snapshot?.code?current.contact_profile_snapshot:classifyContactProfile(representative?.contact_time_ms==null?null:Number(representative.contact_time_ms),contactSettings as ContactProfileSettings|null);
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-24 pt-28 text-white sm:px-8"><div className="mx-auto max-w-6xl"><Link href="/mypage/control-tests" className="mb-7 inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55 transition hover:text-orange-400"><ArrowLeft size={16}/>CONTROL TESTへ戻る</Link><AthleteScanResult evaluation={evaluation} comparison={{previous,first}} scanNumber={current.scan_number} measuredOn={current.measured_on} standardLabel={currentSet?.label??"VAULTEX STANDARD Ver.1 / BETA"} showReveal={reveal==="1"} contactProfile={contact as never} jumpTrials={current.control_test_jump_trials??[]}/></div></main>;
}
