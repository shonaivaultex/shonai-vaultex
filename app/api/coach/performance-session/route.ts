import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { competitionDetailMode, eventNamesByKind, isWindAffectedEvent, type PerformanceKind } from "@/lib/performance-events";
import { bestCompetitionDetail, type CompetitionDetailInput } from "@/lib/competition-details";
import { mergePerformanceFields, performanceRecordIdentity } from "@/lib/performance-record-merge";
import { sendCoachRecordNotifications } from "@/lib/coach-record-notifications";

type SubmittedRecord={athleteId:string;value:number;windSpeed:number|null;details?:CompetitionDetailInput[]};

function sanitizeDetails(details:CompetitionDetailInput[]|undefined,mode:"attempt"|"round"|null){
  if(!mode||!Array.isArray(details)||!details.length)return [];
  const seen=new Set<number>();
  return details.flatMap((detail)=>{
    const sequence=Number(detail.sequenceNumber);
    if(!Number.isInteger(sequence)||sequence<1||sequence>6||seen.has(sequence))return [];
    seen.add(sequence);
    const allowedStatuses=mode==="attempt"?["valid","foul","pass"]:["valid","dns","dnf","dq"];
    if(!allowedStatuses.includes(detail.status))return [];
    const value=detail.status==="valid"?Number(detail.value):null;
    if(detail.status==="valid"&&(!Number.isFinite(value)||Number(value)<=0||Number(value)>=100000))return [];
    const wind=detail.windSpeed?.trim()?Number(detail.windSpeed):null;
    const place=detail.place?.trim()?Number(detail.place):null;
    if(wind!==null&&(!Number.isFinite(wind)||Math.abs(wind)>20))return [];
    if(place!==null&&(!Number.isInteger(place)||place<1||place>999))return [];
    const roundName=mode==="round"&&["予選","準決勝","決勝","タイムレース","その他"].includes(detail.roundName??"")?detail.roundName:null;
    if(mode==="round"&&!roundName)return [];
    return [{sequenceNumber:sequence,roundName,value:value===null?undefined:String(value),windSpeed:wind===null?undefined:String(wind),place:place===null?undefined:String(place),status:detail.status}];
  });
}

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
    const detailMode=kind==="athletics"?competitionDetailMode(category):null;
    const clean=records.flatMap((record)=>{const details=sanitizeDetails(record.details,detailMode);const best=details.length?bestCompetitionDetail(details,detailMode==="round"):null;const value=Number(best?.numericValue??record.value);const candidateWind=best?.windSpeed?.trim()?Number(best.windSpeed):record.windSpeed;const wind=candidateWind===null?null:Number(candidateWind);if(!record.athleteId||!Number.isFinite(value)||value<=0||value>=100000)return[];if(kind==="athletics"&&isWindAffectedEvent(category)&&(wind===null||!Number.isFinite(wind)||Math.abs(wind)>20))return[];return[{athleteId:record.athleteId,value,windSpeed:Number.isFinite(wind)?wind:null,details}];});
    if(!clean.length)return NextResponse.json({error:"有効な記録がありません。風速が必要な種目も確認してください。"},{status:400});
    const admin=createAdminClient(); const athleteIds=[...new Set(clean.map((r)=>r.athleteId))];
    const [{data:players},{data:assignments}]=await Promise.all([admin.from("players").select("user_id,program_class,member_status").in("user_id",athleteIds),admin.from("coach_class_assignments").select("program_class").eq("coach_id",user.id)]);
    const assignedClasses=new Set((assignments??[]).map((a)=>a.program_class)); let scheduledIds=new Set<string>();
    if(scheduleId){const {data:schedule}=await admin.from("schedules").select("id,author_id,program_class,schedule_attendance(user_id,status)").eq("id",scheduleId).maybeSingle();if(!schedule)return NextResponse.json({error:"予定が見つかりません。"},{status:404});const canUse=isAdmin||schedule.author_id===user.id||(schedule.program_class?assignedClasses.has(schedule.program_class):assignedClasses.size>0);if(!canUse)return NextResponse.json({error:"この予定の名簿を使用する権限がありません。"},{status:403});scheduledIds=new Set((schedule.schedule_attendance??[]).filter((a)=>a.status==="attending").map((a)=>a.user_id));}
    const allowed=new Set((players??[]).filter((p)=>p.member_status==="active"&&(isAdmin||(p.program_class&&assignedClasses.has(p.program_class)))&&(!scheduleId||scheduledIds.has(p.user_id))).map((p)=>p.user_id));
    if(allowed.size!==athleteIds.length)return NextResponse.json({error:"担当外、休会中、または参加名簿にいない選手が含まれています。画面を更新してください。"},{status:403});
    const {data:existing,error:existingError}=await admin.from("performance_records").select("id,user_id,category,value,awareness_category,awareness_categories,awareness_note,video_path,wind_speed").in("user_id",athleteIds).eq("date",date).eq("record_kind",kind).eq("category",category);
    if(existingError)throw existingError;
    const existingByIdentity=new Map((existing??[]).map((item)=>[performanceRecordIdentity({userId:item.user_id,kind,category,date,value:Number(item.value)}),item]));
    const recordsToInsert=clean.filter((record)=>!existingByIdentity.has(performanceRecordIdentity({userId:record.athleteId,kind,category,date,value:record.value})));
    const recordsToMerge=clean.flatMap((record)=>{const found=existingByIdentity.get(performanceRecordIdentity({userId:record.athleteId,kind,category,date,value:record.value}));return found?[{record,found}]:[];});
    const rows=recordsToInsert.map((record)=>({user_id:record.athleteId,category,value:record.value,date,record_kind:kind,wind_speed:record.windSpeed,awareness_note:null,awareness_category:null,awareness_categories:null,entry_source:"coach",entered_by:user.id}));
    if(rows.length){
      const {data:inserted,error}=await admin.from("performance_records").insert(rows).select("id,user_id");
      if(error)throw error;
      const detailRows=(inserted??[]).flatMap((parent)=>{
        const record=recordsToInsert.find((item)=>item.athleteId===parent.user_id);
        return (record?.details??[]).map((detail)=>({performance_record_id:parent.id,detail_type:detailMode,sequence_number:detail.sequenceNumber,round_name:detail.roundName??null,value:detail.value?Number(detail.value):null,wind_speed:detail.windSpeed?Number(detail.windSpeed):null,place:detail.place?Number(detail.place):null,status:detail.status}));
      });
      if(detailRows.length){
        const {error:detailError}=await admin.from("performance_record_details").insert(detailRows);
        if(detailError){await admin.from("performance_records").delete().in("id",(inserted??[]).map((item)=>item.id));throw detailError;}
      }
    }
    for(const {record,found} of recordsToMerge){
      const merged=mergePerformanceFields(found,{wind_speed:record.windSpeed});
      const {error:updateError}=await admin.from("performance_records").update(merged).eq("id",found.id);
      if(updateError)throw updateError;
      const detailRows=(record.details??[]).map((detail)=>({performance_record_id:found.id,detail_type:detailMode,sequence_number:detail.sequenceNumber,round_name:detail.roundName??null,value:detail.value?Number(detail.value):null,wind_speed:detail.windSpeed?Number(detail.windSpeed):null,place:detail.place?Number(detail.place):null,status:detail.status}));
      if(detailRows.length){const {error:detailError}=await admin.from("performance_record_details").upsert(detailRows,{onConflict:"performance_record_id,detail_type,sequence_number"});if(detailError)throw detailError;}
    }
    await sendCoachRecordNotifications([
      ...recordsToInsert.map((record)=>({athleteId:record.athleteId,kind,updated:false})),
      ...recordsToMerge.map(({record})=>({athleteId:record.athleteId,kind,updated:true})),
    ]);
    return NextResponse.json({ok:true,saved:rows.length,merged:recordsToMerge.length,skipped:0});
  }catch(error){console.error("performance session publish failed",error);return NextResponse.json({error:error instanceof Error?error.message:"一括反映に失敗しました。入力内容は端末に残っています。"},{status:500});}
}
