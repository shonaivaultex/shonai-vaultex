import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";

export async function POST(request:NextRequest,{params}:{params:Promise<{teamId:string}>}){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"ログインが必要です。"},{status:401});
 if(!hasAdminKey())return NextResponse.json({error:"サーバー設定が完了していません。"},{status:503});
 const {teamId}=await params;const admin=createAdminClient();const {data:member}=await admin.from("scan_team_members").select("role").eq("team_id",teamId).eq("user_id",user.id).in("role",["owner","coach"]).maybeSingle();if(!member)return NextResponse.json({error:"操作権限がありません。"},{status:403});
 const body=await request.json() as {name?:unknown;grade?:unknown;event?:unknown;gender?:unknown};const name=typeof body.name==="string"?body.name.trim():"";if(!name)return NextResponse.json({error:"選手名を入力してください。"},{status:400});
 const gender=body.gender==="male"||body.gender==="female"?body.gender:null;if(!gender)return NextResponse.json({error:"ランキング区分を選択してください。"},{status:400});
 const {data,error}=await admin.from("scan_team_athletes").insert({team_id:teamId,name,grade:typeof body.grade==="string"?body.grade.trim()||null:null,event:typeof body.event==="string"?body.event.trim()||null:null,gender}).select("*").single();
 return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({ok:true,athlete:data});
}

export async function DELETE(request:NextRequest,{params}:{params:Promise<{teamId:string}>}){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"ログインが必要です。"},{status:401});if(!hasAdminKey())return NextResponse.json({error:"サーバー設定が完了していません。"},{status:503});
 const {teamId}=await params;const athleteId=request.nextUrl.searchParams.get("athleteId");if(!athleteId)return NextResponse.json({error:"選手を確認してください。"},{status:400});const admin=createAdminClient();const {data:member}=await admin.from("scan_team_members").select("role").eq("team_id",teamId).eq("user_id",user.id).in("role",["owner","coach"]).maybeSingle();if(!member)return NextResponse.json({error:"操作権限がありません。"},{status:403});const {error}=await admin.from("scan_team_athletes").update({active:false}).eq("id",athleteId).eq("team_id",teamId);return error?NextResponse.json({error:error.message},{status:500}):NextResponse.json({ok:true});
}
