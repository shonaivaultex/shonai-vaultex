import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, MessageCircleMore, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import FeedbackRequestQueue, { type FeedbackQueueItem } from "@/app/components/FeedbackRequestQueue";
import AthletesByClass, { type AthleteClassCount } from "@/app/components/AthletesByClass";

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/coach/dashboard");
  const [{ data: role }, { data: assignments }, { data: classCounts }, { data: queueRows }, { data: aiConsultations }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle(),
    supabase.from("coach_class_assignments").select("program_class").eq("coach_id", user.id),
    supabase.rpc("coach_athlete_class_counts"),
    supabase.rpc("coach_feedback_queue", { p_status: "pending", p_program_class: null, p_priority: null, p_sort: "oldest", p_limit: 10, p_offset: 0 }),
    supabase.from("ai_coach_consultations").select("id,user_id,event_name,consultation_summary,current_feeling,status,created_at").neq("status", "resolved").order("created_at", { ascending: true }).limit(10),
  ]);
  if (!role) redirect("/mypage");
  const aiUserIds = [...new Set((aiConsultations ?? []).map((item) => item.user_id))];
  const { data: aiPlayers } = aiUserIds.length ? await supabase.from("players").select("user_id,name,program_class").in("user_id", aiUserIds) : { data: [] };
  const aiPlayerMap = new Map((aiPlayers ?? []).map((player) => [player.user_id, player]));
  const classes = (assignments ?? []).map((item) => item.program_class);
  const queueItems = (queueRows ?? []).map(mapQueueRow);
  const athleteGroups: AthleteClassCount[] = (classCounts ?? []).map((item: { program_class: string; athlete_count: number | string }) => ({ programClass: item.program_class, count: Number(item.athlete_count) }));
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 hover:text-orange-400"><ArrowLeft size={16} />自分のマイページ</Link>
    <header className="mt-10 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">COACH DASHBOARD</p><h1 className="mt-3 text-4xl font-black">担当選手</h1><p className="mt-3 text-white/55">選手の現状を確認して、記録ごとにフィードバックできます。</p></header>
    <div className="mt-8 flex flex-wrap gap-2">{classes.map((item) => <span key={item} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{item}</span>)}</div>
    <FeedbackRequestQueue initialItems={queueItems} initialTotalCount={Number(queueRows?.[0]?.total_count ?? 0)} />
    <section className="mt-8 rounded-3xl border border-sky-500/30 bg-sky-500/[.04] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[.18em] text-sky-300">AI → COACH CONNECTION</p><h2 className="mt-2 flex items-center gap-2 text-xl font-black"><MessageCircleMore size={21}/>AIで整理された相談</h2></div><span className="rounded-full bg-sky-400 px-3 py-1 text-xs font-black text-black">{aiConsultations?.length??0}件</span></div><div className="mt-5 space-y-2">{aiConsultations?.length ? aiConsultations.map((item) => { const player = aiPlayerMap.get(item.user_id); return <Link key={item.id} href={`/coach/ai-consultations/${item.id}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111] p-4 hover:border-sky-400/40"><span className="min-w-0"><strong className="block truncate text-sm">{player?.name??"選手"}・{item.event_name||"競技相談"}</strong><span className="mt-1 block truncate text-xs text-white/40">{item.consultation_summary}</span></span><ChevronRight className="shrink-0 text-sky-300"/></Link> }) : <p className="py-5 text-center text-xs text-white/30">現在、AIから引き継がれた相談はありません</p>}</div></section>
    <AthletesByClass groups={athleteGroups} />
    <Link href="/coach/dashboard/manage" prefetch className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111] px-5 py-5 transition hover:border-orange-500/50 sm:px-6"><Settings size={20} className="text-white/45" /><span><strong className="block">管理メニューを開く</strong><span className="mt-1 block text-xs text-white/35">予定・お知らせ・会員管理・招待・マニュアル</span></span><ChevronRight size={20} className="ml-auto text-orange-400" /></Link>
  </div></main>;
}

function mapQueueRow(row: Record<string, unknown>): FeedbackQueueItem {
  const video = row.source === "video";
  return { id: Number(row.request_id), recordId: video ? null : Number(row.record_id), videoRequestId: video ? Number(row.request_id) : null, athleteId: String(row.athlete_id), athleteName: String(row.athlete_name), programClass: row.program_class ? String(row.program_class) : null, category: String(row.category), value: String(row.record_value ?? ""), requestType: String(row.request_type), message: row.message ? String(row.message) : null, priority: String(row.priority), status: String(row.status), createdAt: String(row.created_at), answeredAt: row.answered_at ? String(row.answered_at) : null };
}
