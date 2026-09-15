import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { controlTestByCode } from "@/lib/control-test";
import { randomAccessToken } from "@/lib/scan-participant-auth";

async function context(teamId:string){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const admin=createAdminClient();const {data:member}=await admin.from("scan_team_members").select("role").eq("team_id",teamId).eq("user_id",user.id).in("role",["owner","coach"]).maybeSingle();return member?{user,admin}:null;}

export async function POST(request:NextRequest,{params}:{params:Promise<{teamId:string}>}){
 if(!hasAdminKey())return NextResponse.json({error:"サーバー設定が完了していません。"},{status:503});const {teamId}=await params;const auth=await context(teamId);if(!auth)return NextResponse.json({error:"作成権限がありません。"},{status:403});
 const body=await request.json() as {date?:unknown;testCodes?:unknown};const date=typeof body.date==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(body.date)?body.date:null;const testCodes=Array.isArray(body.testCodes)?[...new Set(body.testCodes.filter((code):code is string=>typeof code==="string"&&Boolean(controlTestByCode[code])))]:[];if(!date||!testCodes.length)return NextResponse.json({error:"測定日と種目を確認してください。"},{status:400});
 const joinCode=randomAccessToken(18);const {data:session,error}=await auth.admin.from("scan_team_sessions").insert({team_id:teamId,measured_on:date,title:"本日のCONTROL TEST",status:"draft",created_by:auth.user.id,join_code:joinCode,selected_test_codes:testCodes,participation_mode:"student"}).select("id,join_code").single();if(error||!session)return NextResponse.json({error:error?.message??"測定会を作成できませんでした。"},{status:500});
 const origin=new URL(request.url).origin;const joinUrl=`${origin}/scan/join/${session.join_code}`;const qrDataUrl=await QRCode.toDataURL(joinUrl,{width:480,margin:2,color:{dark:"#080a09",light:"#ffffff"}});return NextResponse.json({ok:true,sessionId:session.id,joinUrl,qrDataUrl});
}

export async function GET(request:NextRequest,{params}:{params:Promise<{teamId:string}>}){
 if(!hasAdminKey())return NextResponse.json({error:"サーバー設定が完了していません。"},{status:503});const {teamId}=await params;const auth=await context(teamId);if(!auth)return NextResponse.json({error:"閲覧権限がありません。"},{status:403});const sessionId=new URL(request.url).searchParams.get("sessionId");if(!sessionId)return NextResponse.json({error:"測定会が指定されていません。"},{status:400});
 const {data:session}=await auth.admin.from("scan_team_sessions").select("id,status,join_code,selected_test_codes").eq("id",sessionId).eq("team_id",teamId).maybeSingle();if(!session)return NextResponse.json({error:"測定会が見つかりません。"},{status:404});const {data:participants}=await auth.admin.from("scan_session_participants").select("athlete_id,status,last_saved_at,submitted_at,scan_team_athletes(name)").eq("session_id",sessionId).order("started_at");return NextResponse.json({ok:true,session,participants:participants??[]});
}
