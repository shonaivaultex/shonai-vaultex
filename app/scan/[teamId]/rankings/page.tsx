import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import RankingsClient from "./RankingsClient";

export default async function RankingsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect(`/login?next=/scan/${teamId}/rankings`);
  const admin = createAdminClient();
  const { data: member } = await admin.from("scan_team_members").select("scan_teams(name)").eq("team_id", teamId).eq("user_id", userId).maybeSingle();
  if (!member) notFound();
  const [{ data: sessions }, { data: measurements }, { data: athletes }] = await Promise.all([
    admin.from("scan_team_sessions").select("id,title,measured_on").eq("team_id", teamId).order("measured_on", { ascending: false }),
    admin.from("scan_team_measurements").select("id,session_id,athlete_id,test_code,primary_value").eq("team_id", teamId),
    admin.from("scan_team_athletes").select("id,name,gender").eq("team_id", teamId).eq("active", true),
  ]);
  const athleteMap = new Map((athletes ?? []).map((athlete) => [athlete.id, athlete]));
  const records = (measurements ?? []).flatMap((row) => { const athlete = athleteMap.get(row.athlete_id); return athlete ? [{ ...row, primary_value: Number(row.primary_value), athlete_name: athlete.name, gender: athlete.gender }] : []; });
  const team = member.scan_teams as unknown as { name: string };
  return <main className="px-5 pb-24 pt-28 sm:px-8"><div className="mx-auto max-w-6xl"><Link href={`/scan/${teamId}`} className="inline-flex items-center gap-2 text-xs font-bold text-white/45"><ArrowLeft size={15}/>チームへ戻る</Link><p className="mt-8 text-xs font-black tracking-[.2em] text-orange-400">RANKINGS</p><h1 className="mt-2 text-4xl font-black sm:text-6xl">測定ランキング</h1><p className="mt-3 text-sm text-white/40">{team.name}　男女別・種目別</p><RankingsClient sessions={sessions ?? []} records={records}/></div></main>;
}
