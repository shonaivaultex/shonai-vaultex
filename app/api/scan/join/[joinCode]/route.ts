import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { controlTestByCode } from "@/lib/control-test";
import { hashParticipantPin, hashParticipantSecret, randomAccessToken } from "@/lib/scan-participant-auth";

type AdminClient = ReturnType<typeof createAdminClient>;
type Session = { id:string; team_id:string; title:string; measured_on:string; status:string; selected_test_codes:string[]; scan_teams:unknown };
type Athlete = { id:string; name:string; gender:string|null };
type Measurement = { session_id:string; athlete_id:string; test_code:string; primary_value:number|string; attempts:unknown };

async function getSession(code:string){const admin=createAdminClient();const {data}=await admin.from("scan_team_sessions").select("id,team_id,title,measured_on,status,selected_test_codes,scan_teams(name)").eq("join_code",code).eq("participation_mode","student").maybeSingle();return{admin,session:data as Session|null};}

async function getResults(admin:AdminClient,session:Session,athlete:Athlete){
 const codes=session.selected_test_codes.filter(code=>controlTestByCode[code]);
 const [{data:athletes},{data:measurements}]=await Promise.all([
  admin.from("scan_team_athletes").select("id,gender").eq("team_id",session.team_id).eq("active",true),
  admin.from("scan_team_measurements").select("session_id,athlete_id,test_code,primary_value,attempts").eq("team_id",session.team_id).in("test_code",codes),
 ]);
 const genderIds=new Set((athletes??[]).filter(item=>item.gender===athlete.gender).map(item=>item.id));
 const rows=(measurements??[]) as Measurement[];
 return codes.flatMap(code=>{
  const own=rows.find(row=>row.session_id===session.id&&row.athlete_id===athlete.id&&row.test_code===code);if(!own)return[];
  const definition=controlTestByCode[code];const better=(a:number,b:number)=>definition.betterDirection==="lower"?a<b:a>b;
  const sessionValues=rows.filter(row=>row.session_id===session.id&&row.test_code===code&&genderIds.has(row.athlete_id)).map(row=>Number(row.primary_value)).sort((a,b)=>definition.betterDirection==="lower"?a-b:b-a);
  const bestByAthlete=new Map<string,number>();for(const row of rows.filter(item=>item.test_code===code&&genderIds.has(item.athlete_id))){const value=Number(row.primary_value);const current=bestByAthlete.get(row.athlete_id);if(current===undefined||better(value,current))bestByAthlete.set(row.athlete_id,value);}
  const overallValues=[...bestByAthlete.values()].sort((a,b)=>definition.betterDirection==="lower"?a-b:b-a);const value=Number(own.primary_value);
  return[{testCode:code,category:definition.category,unit:definition.unit,value,attempts:Array.isArray(own.attempts)?own.attempts:[],sessionRank:sessionValues.indexOf(value)+1,sessionTotal:sessionValues.length,overallRank:overallValues.indexOf(bestByAthlete.get(athlete.id)??value)+1,overallTotal:overallValues.length}];
 });
}

export async function GET(_:NextRequest,{params}:{params:Promise<{joinCode:string}>}){if(!hasAdminKey())return NextResponse.json({error:"利用できません。"},{status:503});const {joinCode}=await params;const {admin,session}=await getSession(joinCode);if(!session)return NextResponse.json({error:"測定会が見つかりません。"},{status:404});const {data:athletes}=await admin.from("scan_team_athletes").select("id,name,grade,event").eq("team_id",session.team_id).eq("active",true).order("name");return NextResponse.json({session,athletes:athletes??[]});}

export async function POST(request:NextRequest,{params}:{params:Promise<{joinCode:string}>}){
 if(!hasAdminKey())return NextResponse.json({error:"利用できません。"},{status:503});const {joinCode}=await params;const {admin,session}=await getSession(joinCode);if(!session)return NextResponse.json({error:"測定会が見つかりません。"},{status:404});
 const body=await request.json() as {action?:unknown;athleteId?:unknown;pin?:unknown;token?:unknown;values?:unknown};const athleteId=typeof body.athleteId==="string"?body.athleteId:"";const {data:athlete}=await admin.from("scan_team_athletes").select("id,name,gender").eq("id",athleteId).eq("team_id",session.team_id).eq("active",true).maybeSingle();if(!athlete)return NextResponse.json({error:"選手を確認してください。"},{status:400});
 if(body.action==="claim"){
  const pin=typeof body.pin==="string"?body.pin:"";if(!/^\d{4}$/.test(pin))return NextResponse.json({error:"4桁の暗証番号を入力してください。"},{status:400});const pinHash=hashParticipantPin(session.id,pin);const {data:existing}=await admin.from("scan_session_participants").select("id,pin_hash,status,draft_values").eq("session_id",session.id).eq("athlete_id",athleteId).maybeSingle();if(existing&&existing.pin_hash!==pinHash)return NextResponse.json({error:"暗証番号が違います。"},{status:403});if(session.status!=="draft"&&existing?.status!=="submitted")return NextResponse.json({error:"この測定会の入力は終了しています。"},{status:409});
  const token=randomAccessToken();const row={session_id:session.id,team_id:session.team_id,athlete_id:athleteId,pin_hash:pinHash,access_token_hash:hashParticipantSecret(token),last_saved_at:new Date().toISOString()};const {data:participant,error}=await admin.from("scan_session_participants").upsert(row,{onConflict:"session_id,athlete_id"}).select("status,draft_values").single();if(error)return NextResponse.json({error:error.message},{status:500});const results=participant.status==="submitted"&&await isSessionComplete(admin,session)?await getResults(admin,session,athlete):[];return NextResponse.json({ok:true,token,athlete,status:participant.status,values:participant.draft_values??{},results});
 }
 const token=typeof body.token==="string"?body.token:"";const {data:participant}=await admin.from("scan_session_participants").select("id,access_token_hash,status").eq("session_id",session.id).eq("athlete_id",athleteId).maybeSingle();if(!participant||participant.access_token_hash!==hashParticipantSecret(token))return NextResponse.json({error:"もう一度、名前と暗証番号で入り直してください。"},{status:401});
 if(body.action==="results"){if(participant.status!=="submitted")return NextResponse.json({ok:true,submitted:false,results:[]});const complete=await isSessionComplete(admin,session);return NextResponse.json({ok:true,submitted:true,complete,results:complete?await getResults(admin,session,athlete):[]});}
 if(session.status!=="draft")return NextResponse.json({error:"この測定会の入力は終了しています。"},{status:409});if(participant.status!=="inputting")return NextResponse.json({error:"すでに提出済みです。"},{status:409});
 const values=body.values&&typeof body.values==="object"?body.values as Record<string,unknown>:{};const clean=Object.fromEntries(Object.entries(values).flatMap(([code,input])=>{if(!session.selected_test_codes.includes(code)||!controlTestByCode[code]||!Array.isArray(input))return[];const attempts=input.map(Number).filter(value=>Number.isFinite(value)&&value>0&&value<100000).slice(0,10);return attempts.length?[[code,attempts]]:[];}));
 const submitting=body.action==="submit";if(submitting&&!Object.keys(clean).length)return NextResponse.json({error:"記録を1件以上入力してください。"},{status:400});const {error:updateError}=await admin.from("scan_session_participants").update({draft_values:clean,last_saved_at:new Date().toISOString(),...(submitting?{status:"submitted",submitted_at:new Date().toISOString()}:{})}).eq("id",participant.id);if(updateError)return NextResponse.json({error:updateError.message},{status:500});if(submitting){const rows=Object.entries(clean).map(([code,attempts])=>{const definition=controlTestByCode[code];return{session_id:session.id,team_id:session.team_id,athlete_id:athleteId,test_code:code,primary_value:definition.betterDirection==="lower"?Math.min(...attempts):Math.max(...attempts),attempts,entered_by:null,entry_source:"student"};});const {error}=await admin.from("scan_team_measurements").upsert(rows,{onConflict:"session_id,athlete_id,test_code"});if(error){await admin.from("scan_session_participants").update({status:"inputting",submitted_at:null}).eq("id",participant.id);return NextResponse.json({error:error.message},{status:500});}}
 const complete=submitting?await isSessionComplete(admin,session):false;return NextResponse.json({ok:true,submitted:submitting,complete,results:submitting&&complete?await getResults(admin,session,athlete):[]});
}
