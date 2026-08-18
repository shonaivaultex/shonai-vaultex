import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AthleteScanResult from "@/app/components/AthleteScanResult";
import { evaluateAthleteScan, type AthleteMeasurement, type AthleteStandard, type TypeSettings } from "@/lib/athlete-scan";
import { createClient } from "@/lib/supabase-server";

type Scan = { id:string; scan_number:number; measured_on:string; athlete_standard_version:string|null; profile_snapshot:Record<string,unknown>; control_test_measurements:AthleteMeasurement[]|null };

export default async function AthleteScanPage({params,searchParams}:{params:Promise<{scanId:string}>;searchParams:Promise<{reveal?:string}>}) {
  const {scanId}=await params;
  const {reveal}=await searchParams;
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/mypage/login");
  const {data:scan}=await supabase.from("control_test_scans").select("id, scan_number, measured_on, athlete_standard_version, profile_snapshot, control_test_measurements(test_code, primary_value, metrics, implement_weight_kg, implement_name, equipment, distance_m, jump_count)").eq("id",scanId).eq("user_id",user.id).maybeSingle();
  if(!scan) notFound();
  const current=scan as Scan;
  const {data:currentSet}=await supabase.from("athlete_scan_standard_sets").select("version,label").eq("is_current",true).maybeSingle();
  const version=current.athlete_standard_version??currentSet?.version;
  if(!version) notFound();
  const {data:player}=await supabase.from("players").select("gender").eq("user_id",user.id).maybeSingle();
  const gender=String(current.profile_snapshot?.gender??player?.gender??"");
  const [{data:standards},{data:typeSettings},{data:history}]=await Promise.all([
    supabase.from("athlete_scan_standards").select("standard_version, gender, test_code, equipment, weight_kg, distance_m, jump_count, score_100_value, score_0_value, higher_is_better, status, notes").eq("standard_version",version).eq("gender",gender),
    supabase.from("athlete_scan_type_settings").select("balanced_max_spread, composite_max_gap, type_descriptions").eq("standard_version",version).maybeSingle(),
    supabase.from("control_test_scans").select("id, scan_number, measured_on, athlete_standard_version, profile_snapshot, control_test_measurements(test_code, primary_value, metrics, implement_weight_kg, implement_name, equipment, distance_m, jump_count)").eq("user_id",user.id).lte("scan_number",current.scan_number).order("scan_number",{ascending:true}),
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
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-24 pt-28 text-white sm:px-8"><div className="mx-auto max-w-6xl"><Link href="/mypage/control-tests" className="mb-7 inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55 transition hover:text-orange-400"><ArrowLeft size={16}/>CONTROL TESTへ戻る</Link><AthleteScanResult evaluation={evaluation} comparison={{previous,first}} scanNumber={current.scan_number} measuredOn={current.measured_on} standardLabel={currentSet?.label??"VAULTEX STANDARD Ver.1 / BETA"} showReveal={reveal==="1"}/></div></main>;
}
