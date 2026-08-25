import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { eventNamesByKind, isWindAffectedEvent, type PerformanceKind } from "@/lib/performance-events";

type SubmittedRecord={athleteId:string;value:number;windSpeed:number|null};

export async function POST(request:NextRequest) {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"ログインが必要です。"},{status:401});
  const {data:roles}=await supabase.from("user_roles").select("role").eq("user_id",user.id).in("role",["coach","admin"]);
  if(!roles?.length)return NextResponse.json({error:"コーチ権限が必要です。"},{status:403});
  if(!hasAdminKey())return NextResponse.json({error:"本番保存用のサーバー設定が完了していません。"},{status:503});
  const isAdmin=roles.some((item)=>item.role==="admin");
  try{
    const body=await request.json() as {kind?:PerformanceKind;category?:unknown;date?:unknown;scheduleId?:unknown;records?:SubmittedRecord[]};
    const kind=body.kind; const category=typeof body.category==="string"?body.category:""; const date=typeof body.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(body.date)?body.date:null;
    const records=Array.isArray(body.records)?body.records:[]; const scheduleId=body.scheduleId?Number(body.scheduleId):null;
    if((kind!=="athletics"&&kind!=="unofficial-athletics")||!eventNamesByKind(kind).includes(category)||!date||!records.length||records.length>100)return NextResponse.json({error:"区分・種目・日付・入力件数を確認してください。"},{status:400});
    const clean=records.flatMap((record)=>{const value=Number(record.value);const wind=record.windSpeed===null?null:Number(record.windSpeed);if(!record.athleteId||!Number.isFinite(value)||value<=0||value>=100000)return[];if(kind==="athletics"&&isWindAffectedEvent(category)&&(wind===null||!Number.isFinite(wind)||Math.abs(wind)>20))return[];return[{athleteId:record.athleteId,value,windSpeed:Number.isFinite(wind)?wind:null}];});
    if(!clean.length)return NextResponse.json({error:"有効な記録がありません。風速が必要な種目も確認してください。"},{status:400});
    const admin=createAdminClient(); const athleteIds=[...new Set(clean.map((r)=>r.athleteId))];
    const [{data:players},{data:assignments}]=await Promise.all([admin.from("players").select("user_id,program_class,member_status").in("user_id",athleteIds),admin.from("coach_class_assignments").select("program_class").eq("coach_id",user.id)]);
    const assignedClasses=new Set((assignments??[]).map((a)=>a.program_class)); let scheduledIds=new Set<string>();
    if(scheduleId){const {data:schedule}=await admin.from("schedules").select("id,author_id,program_class,schedule_attendance(user_id,status)").eq("id",scheduleId).maybeSingle();if(!schedule)return NextResponse.json({error:"予定が見つかりません。"},{status:404});const canUse=isAdmin||schedule.author_id===user.id||(schedule.program_class?assignedClasses.has(schedule.program_class):assignedClasses.size>0);if(!canUse)return NextResponse.json({error:"この予定の名簿を使用する権限がありません。"},{status:403});scheduledIds=new Set((schedule.schedule_attendance??[]).filter((a)=>a.status==="attending").map((a)=>a.user_id));}
    const allowed=new Set((players??[]).filter((p)=>p.member_status==="active"&&(isAdmin||(p.program_class&&assignedClasses.has(p.program_class)))&&(!scheduleId||scheduledIds.has(p.user_id))).map((p)=>p.user_id));
    if(allowed.size!==athleteIds.length)return NextResponse.json({error:"担当外、休会中、または参加名簿にいない選手が含まれています。画面を更新してください。"},{status:403});
    const {data:existing}=await admin.from("performance_records").select("user_id,category").in("user_id",athleteIds).eq("date",date).eq("record_kind",kind);
    const duplicateIds=new Set((existing??[]).filter((item)=>item.category===category).map((item)=>item.user_id));
    const rows=clean.filter((record)=>!duplicateIds.has(record.athleteId)).map((record)=>({user_id:record.athleteId,category,value:record.value,date,record_kind:kind,wind_speed:record.windSpeed,awareness_note:null,awareness_category:null,awareness_categories:null}));
    if(rows.length){const {error}=await admin.from("performance_records").insert(rows);if(error)throw error;}
    return NextResponse.json({ok:true,saved:rows.length,skipped:clean.length-rows.length});
  }catch(error){console.error("performance session publish failed",error);return NextResponse.json({error:error instanceof Error?error.message:"一括反映に失敗しました。入力内容は端末に残っています。"},{status:500});}
}
