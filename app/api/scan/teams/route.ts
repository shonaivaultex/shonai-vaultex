import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:"ログインが必要です。"},{status:401});
  if(!hasAdminKey())return NextResponse.json({error:"サーバー設定が完了していません。"},{status:503});
  const body=await request.json() as {name?:unknown}; const name=typeof body.name==="string"?body.name.trim():"";
  if(!name||name.length>100)return NextResponse.json({error:"学校・チーム名を入力してください。"},{status:400});
  const admin=createAdminClient();
  const {data:team,error}=await admin.from("scan_teams").insert({name,created_by:user.id}).select("id,name").single();
  if(error||!team)return NextResponse.json({error:error?.message??"チームを作成できませんでした。"},{status:500});
  const {error:memberError}=await admin.from("scan_team_members").insert({team_id:team.id,user_id:user.id,role:"owner"});
  if(memberError){await admin.from("scan_teams").delete().eq("id",team.id);return NextResponse.json({error:memberError.message},{status:500});}
  return NextResponse.json({ok:true,team});
}
