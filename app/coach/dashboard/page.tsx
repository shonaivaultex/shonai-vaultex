import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import FeedbackRequestQueue, { type FeedbackQueueItem } from "@/app/components/FeedbackRequestQueue";
import AthletesByClass, { type AthleteClassCount } from "@/app/components/AthletesByClass";

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/coach/dashboard");
  const [{ data: role }, { data: assignments }, { data: classCounts }, { data: queueRows }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle(),
    supabase.from("coach_class_assignments").select("program_class").eq("coach_id", user.id),
    supabase.rpc("coach_athlete_class_counts"),
    supabase.rpc("coach_feedback_queue", { p_status: "pending", p_program_class: null, p_priority: null, p_sort: "oldest", p_limit: 10, p_offset: 0 }),
  ]);
  if (!role) redirect("/mypage");
  const classes = (assignments ?? []).map((item) => item.program_class);
  const queueItems = (queueRows ?? []).map(mapQueueRow);
  const athleteGroups: AthleteClassCount[] = (classCounts ?? []).map((item: { program_class: string; athlete_count: number | string }) => ({ programClass: item.program_class, count: Number(item.athlete_count) }));
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 hover:text-orange-400"><ArrowLeft size={16} />自分のマイページ</Link>
    <header className="mt-10 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">COACH DASHBOARD</p><h1 className="mt-3 text-4xl font-black">担当選手</h1><p className="mt-3 text-white/55">選手の現状を確認して、記録ごとにフィードバックできます。</p></header>
    <div className="mt-8 flex flex-wrap gap-2">{classes.map((item) => <span key={item} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{item}</span>)}</div>
    <FeedbackRequestQueue initialItems={queueItems} initialTotalCount={Number(queueRows?.[0]?.total_count ?? 0)} />
    <AthletesByClass groups={athleteGroups} />
    <Link href="/coach/dashboard/manage" prefetch className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111] px-5 py-5 transition hover:border-orange-500/50 sm:px-6"><Settings size={20} className="text-white/45" /><span><strong className="block">管理メニューを開く</strong><span className="mt-1 block text-xs text-white/35">予定・お知らせ・会員管理・招待・マニュアル</span></span><ChevronRight size={20} className="ml-auto text-orange-400" /></Link>
  </div></main>;
}

function mapQueueRow(row: Record<string, unknown>): FeedbackQueueItem {
  const video = row.source === "video";
  return { id: Number(row.request_id), recordId: video ? null : Number(row.record_id), videoRequestId: video ? Number(row.request_id) : null, athleteId: String(row.athlete_id), athleteName: String(row.athlete_name), programClass: row.program_class ? String(row.program_class) : null, category: String(row.category), value: String(row.record_value ?? ""), requestType: String(row.request_type), message: row.message ? String(row.message) : null, priority: String(row.priority), status: String(row.status), createdAt: String(row.created_at), answeredAt: row.answered_at ? String(row.answered_at) : null };
}
