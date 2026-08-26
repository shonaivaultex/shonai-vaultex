import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { controlTestByCode, performanceCategoryForMeasurement } from "@/lib/control-test";
import { sendCoachRecordNotifications } from "@/lib/coach-record-notifications";

type SubmittedMeasurement={testCode:string;value:number;attempt1:number|null;attempt2:number|null;attempts?:number[]};
type SubmittedAthlete={athleteId:string;measurements:SubmittedMeasurement[]};

export async function POST(request:NextRequest){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"ログインが必要です。"},{status:401});
  const {data:roles}=await supabase.from("user_roles").select("role").eq("user_id",user.id).in("role",["coach","admin"]);
  if(!roles?.length)return NextResponse.json({error:"コーチ権限が必要です。"},{status:403});
  const isAdmin=roles.some((item)=>item.role==="admin");
  if(!hasAdminKey())return NextResponse.json({error:"本番保存用のサーバー設定が完了していません。"},{status:503});
  try{
    const body=await request.json() as {date?:unknown;scheduleId?:unknown;athletes?:SubmittedAthlete[]};
    const date=typeof body.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(body.date)?body.date:null;const athletes=Array.isArray(body.athletes)?body.athletes:[];const scheduleId=body.scheduleId?Number(body.scheduleId):null;
    if(!date||!athletes.length||athletes.length>100)return NextResponse.json({error:"測定日または参加者を確認してください。"},{status:400});
    const admin=createAdminClient();const athleteIds=[...new Set(athletes.map((a)=>a.athleteId))];
    const [{data:players,error:playerError},{data:assignments}]=await Promise.all([admin.from("players").select("user_id,name,program_class,gender,grade,age,birth_date,height_cm,weight_kg,member_status").in("user_id",athleteIds),admin.from("coach_class_assignments").select("program_class").eq("coach_id",user.id)]);
    if(playerError)throw playerError;const assignedClasses=new Set((assignments??[]).map((a)=>a.program_class));
    let scheduledIds=new Set<string>();
    if(scheduleId){const {data:schedule}=await admin.from("schedules").select("id,author_id,program_class,schedule_attendance(user_id,status)").eq("id",scheduleId).maybeSingle();if(!schedule)return NextResponse.json({error:"測定予定が見つかりません。"},{status:404});const canUse=isAdmin||schedule.author_id===user.id||(schedule.program_class?assignedClasses.has(schedule.program_class):assignedClasses.size>0);if(!canUse)return NextResponse.json({error:"この予定の名簿を使用する権限がありません。"},{status:403});scheduledIds=new Set((schedule.schedule_attendance??[]).filter((a)=>a.status==="attending").map((a)=>a.user_id));}
    const playerMap=new Map((players??[]).filter((p)=>p.member_status==="active"&&(isAdmin||(p.program_class&&assignedClasses.has(p.program_class)))&&(!scheduleId||scheduledIds.has(p.user_id))).map((p)=>[p.user_id,p]));
    if(playerMap.size!==athleteIds.length)return NextResponse.json({error:"担当外、休会中、または参加名簿にいない選手が含まれています。画面を更新してください。"},{status:403});
    const {data:standardSet}=await admin.from("athlete_scan_standard_sets").select("version").eq("is_current",true).maybeSingle();let saved=0;const savedAthleteIds:string[]=[];
    for(const submitted of athletes){const player=playerMap.get(submitted.athleteId);if(!player)continue;const clean=submitted.measurements.flatMap((m)=>{const definition=controlTestByCode[m.testCode];const value=Number(m.value);return definition&&Number.isFinite(value)&&value>0&&value<100000?[{...m,value,definition}]:[]});if(!clean.length)continue;
      const profile={program_class:player.program_class??null,gender:player.gender??null,grade:player.grade??null,age:player.age??null,birth_date:player.birth_date??null,height_cm:player.height_cm??null,weight_kg:player.weight_kg??null};
      const {data:scan,error:scanError}=await admin.from("control_test_scans").insert({user_id:player.user_id,scan_number:0,measured_on:date,version:4,status:"complete",profile_snapshot:profile,notes:"コーチ測定会入力",athlete_standard_version:standardSet?.version??null,athlete_evaluated_at:standardSet?.version?new Date().toISOString():null,control_test_version:"v2",protocol_version:2}).select("id").single();if(scanError||!scan)throw scanError??new Error("SCANを作成できませんでした。");
      let createdRecordIds:number[]=[];
      try{const isJunior=player.program_class==="ジュニア";const speedDistance=["ジュニア","マスターズ"].includes(player.program_class??"")?150:300;const boundCount=isJunior?3:5;const equipment=(code:string)=>code.startsWith("shot_")?(isJunior?"2kgメディシンボール":"砲丸"):code==="acceleration_30m"?"光電管":["rebound_jump","vertical_jump","drop_jump"].includes(code)?"S-CADE等のジャンプマット":null;const jumpCount=(code:string)=>code==="standing_five_bound"?boundCount:code==="rebound_jump"?5:null;
        const recordRows=clean.map((m)=>({user_id:player.user_id,category:performanceCategoryForMeasurement(m.testCode,{distanceM:speedDistance,jumpCount:jumpCount(m.testCode),equipment:equipment(m.testCode)}),value:m.value,date,record_kind:"control-test",entry_source:"coach",entered_by:user.id}));const {data:records,error:recordError}=await admin.from("performance_records").insert(recordRows).select("id,category");if(recordError||!records)throw recordError??new Error("記録を保存できませんでした。");createdRecordIds=records.map((record)=>record.id);const recordIds=new Map(records.map((r)=>[r.category,r.id]));
        const rows=clean.map((m)=>{const code=m.testCode;const distance=code==="speed_endurance_300m"?speedDistance:null;const count=jumpCount(code);const implement=equipment(code);const category=performanceCategoryForMeasurement(code,{distanceM:distance,jumpCount:count,equipment:implement});const attempts=(Array.isArray(m.attempts)?m.attempts:[m.attempt1,m.attempt2]).map(Number).filter((value)=>Number.isFinite(value)&&value>0).slice(0,10);const attemptMetrics=Object.fromEntries(attempts.map((value,index)=>[`attempt_${index+1}`,value]));return {scan_id:scan.id,user_id:player.user_id,test_code:code,performance_record_id:recordIds.get(category),primary_value:m.value,metrics:{[m.definition.primaryMetric]:m.value,...attemptMetrics,attempts,entered_by_coach:user.id},protocol_version:["rebound_jump","vertical_jump","drop_jump"].includes(code)?2:3,attempt_count:attempts.length,distance_m:distance,jump_count:count,implement_name:implement,implement_weight_kg:code.startsWith("shot_")?(isJunior?2:player.gender==="female"?3:4):null,equipment:implement,notes:"測定会モードから登録"};});const {error:measurementError}=await admin.from("control_test_measurements").insert(rows);if(measurementError)throw measurementError;saved++;savedAthleteIds.push(player.user_id);
      }catch(error){if(createdRecordIds.length)await admin.from("performance_records").delete().in("id",createdRecordIds);await admin.from("control_test_scans").delete().eq("id",scan.id);throw error;}}
    if(!saved)return NextResponse.json({error:"反映できる測定値がありません。"},{status:400});
    await sendCoachRecordNotifications(savedAthleteIds.map((athleteId)=>({athleteId,kind:"control-test" as const})));
    return NextResponse.json({ok:true,saved});
  }catch(error){console.error("control test session publish failed",error);return NextResponse.json({error:error instanceof Error?error.message:"一括反映に失敗しました。入力内容は端末に残っています。"},{status:500});}
}
