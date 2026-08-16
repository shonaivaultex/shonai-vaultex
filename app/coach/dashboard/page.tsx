import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import FeedbackRequestQueue, { type FeedbackQueueItem } from "@/app/components/FeedbackRequestQueue";
import AthletesByClass from "@/app/components/AthletesByClass";

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/coach/dashboard");
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle();
  if (!role) redirect("/mypage");
  const { data: assignments } = await supabase.from("coach_class_assignments").select("program_class").eq("coach_id", user.id);
  const classes = (assignments ?? []).map((item) => item.program_class);
  const [{ data: allAthletes }, { data: requests }, { data: videoRequests }] = await Promise.all([
    classes.length ? supabase.from("players").select("user_id, name, grade, event, program_class, member_status").in("program_class", classes).order("program_class").order("name") : Promise.resolve({ data: [] }),
    supabase.from("feedback_requests").select("id, record_id, request_type, message, priority, status, created_at, answered_at").in("status", ["pending", "answered"]).order("created_at", { ascending: false }).limit(100),
    supabase.from("video_feedback_requests").select("id, user_id, event_name, message, priority, status, created_at, responded_at").in("status", ["pending", "answered"]).order("created_at", { ascending: false }).limit(100),
  ]);
  const athletes = (allAthletes ?? []).filter((athlete) => (athlete.member_status ?? "active") === "active");
  const requestRecordIds = (requests ?? []).map((item) => item.record_id);
  const { data: requestRecords } = requestRecordIds.length ? await supabase.from("performance_records").select("id, user_id, category, value, date").in("id", requestRecordIds) : { data: [] };
  const requestRecordMap = new Map((requestRecords ?? []).map((item) => [item.id, item]));
  const athleteMap = new Map((athletes ?? []).map((item) => [item.user_id, item]));
  const queueItems = (requests ?? []).flatMap<FeedbackQueueItem>((request) => {
    const record = requestRecordMap.get(request.record_id); const athlete = record ? athleteMap.get(record.user_id) : null;
    if (!record || !athlete) return [];
    return [{ id: request.id, recordId: record.id, athleteId: record.user_id, athleteName: athlete.name, programClass: athlete.program_class, category: record.category, value: record.value, requestType: request.request_type, message: request.message, priority: request.priority, status: request.status, createdAt: request.created_at, answeredAt: request.answered_at }];
  });
  const videoQueueItems = (videoRequests ?? []).flatMap<FeedbackQueueItem>((request) => {
    const athlete = athleteMap.get(request.user_id); if (!athlete) return [];
    return [{ id: request.id, recordId: null, videoRequestId: request.id, athleteId: request.user_id, athleteName: athlete.name, programClass: athlete.program_class, category: request.event_name, value: "", requestType: "video", message: request.message, priority: request.priority, status: request.status, createdAt: request.created_at, answeredAt: request.responded_at }];
  });
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 hover:text-orange-400"><ArrowLeft size={16} />自分のマイページ</Link>
    <header className="mt-10 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">COACH DASHBOARD</p><h1 className="mt-3 text-4xl font-black">担当選手</h1><p className="mt-3 text-white/55">選手の現状を確認して、記録ごとにフィードバックできます。</p></header>
    <div className="mt-8 flex flex-wrap gap-2">{classes.map((item) => <span key={item} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{item}</span>)}</div>
    <FeedbackRequestQueue items={[...queueItems, ...videoQueueItems]} />
    <AthletesByClass athletes={athletes ?? []} />
    <Link href="/coach/dashboard/manage" prefetch className="mt-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#111] px-5 py-5 transition hover:border-orange-500/50 sm:px-6"><Settings size={20} className="text-white/45" /><span><strong className="block">管理メニューを開く</strong><span className="mt-1 block text-xs text-white/35">予定・お知らせ・会員管理・招待・マニュアル</span></span><ChevronRight size={20} className="ml-auto text-orange-400" /></Link>
  </div></main>;
}
