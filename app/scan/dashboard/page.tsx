import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import ScanDashboardClient from "../ScanDashboardClient";

export default async function ScanDashboard(){
 const supabase=await createClient();const {data:auth}=await supabase.auth.getClaims();const userId=auth?.claims.sub;if(!userId)redirect("/login?next=/scan/dashboard");
 const admin=createAdminClient();const {data:members}=await admin.from("scan_team_members").select("team_id,role,scan_teams(id,name)").eq("user_id",userId);
 const teams=await Promise.all((members??[]).map(async member=>{const team=member.scan_teams as unknown as {id:string;name:string};const [{count:athleteCount},{count:sessionCount}]=await Promise.all([admin.from("scan_team_athletes").select("id",{count:"exact",head:true}).eq("team_id",team.id).eq("active",true),admin.from("scan_team_sessions").select("id",{count:"exact",head:true}).eq("team_id",team.id)]);return {...team,role:member.role,athleteCount:athleteCount??0,sessionCount:sessionCount??0};}));
 return <main className="px-5 pb-24 pt-28 sm:px-8"><div className="mx-auto max-w-6xl"><Link href="/scan" className="inline-flex items-center gap-2 text-xs font-bold text-white/45 hover:text-orange-400"><ArrowLeft size={15}/>VAULTEX SCAN</Link><p className="mt-9 text-xs font-black tracking-[.2em] text-emerald-400">TEAM CONSOLE</p><h1 className="mt-2 text-4xl font-black sm:text-6xl">チーム管理</h1><ScanDashboardClient teams={teams}/></div></main>;
}
