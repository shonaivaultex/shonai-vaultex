import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import CoachAnnouncementForm from "@/app/components/CoachAnnouncementForm";
import CoachScheduleManager, { type ScheduleTemplate } from "@/app/components/CoachScheduleManager";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import FeedbackRequestQueue, { type FeedbackQueueItem } from "@/app/components/FeedbackRequestQueue";
import MemberManagement from "@/app/components/MemberManagement";
import AthletesByClass from "@/app/components/AthletesByClass";
import BugReportManager, { type BugReportItem } from "@/app/components/BugReportManager";
import CoachInvitationManager from "@/app/components/CoachInvitationManager";

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/coach/dashboard");
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle();
  if (!role) redirect("/mypage");
  const { data: assignments } = await supabase.from("coach_class_assignments").select("program_class").eq("coach_id", user.id);
  const classes = (assignments ?? []).map((item) => item.program_class);
  const { data: allAthletes } = classes.length ? await supabase.from("players").select("user_id, name, grade, event, program_class, member_status").in("program_class", classes).order("program_class").order("name") : { data: [] };
  const athletes = (allAthletes ?? []).filter((athlete) => (athlete.member_status ?? "active") === "active");
  const { data: schedules } = await supabase.from("schedules").select("*").eq("author_id", user.id).gte("starts_at", new Date().toISOString()).order("starts_at").limit(20);
  const scheduleIds = (schedules ?? []).map((item) => item.id);
  const { data: attendance } = scheduleIds.length ? await supabase.from("schedule_attendance").select("schedule_id, status").in("schedule_id", scheduleIds) : { data: [] };
  const { data: scheduleTemplates } = await supabase.from("schedule_templates").select("*").eq("author_id", user.id).order("name");
  const { data: requests } = await supabase.from("feedback_requests").select("id, record_id, request_type, message, priority, status, created_at, answered_at").in("status", ["pending", "answered"]).order("created_at", { ascending: false }).limit(500);
  const requestRecordIds = (requests ?? []).map((item) => item.record_id);
  const { data: requestRecords } = requestRecordIds.length ? await supabase.from("performance_records").select("id, user_id, category, value, date").in("id", requestRecordIds) : { data: [] };
  const requestRecordMap = new Map((requestRecords ?? []).map((item) => [item.id, item]));
  const athleteMap = new Map((athletes ?? []).map((item) => [item.user_id, item]));
  const queueItems = (requests ?? []).flatMap<FeedbackQueueItem>((request) => {
    const record = requestRecordMap.get(request.record_id); const athlete = record ? athleteMap.get(record.user_id) : null;
    if (!record || !athlete) return [];
    return [{ id: request.id, recordId: record.id, athleteId: record.user_id, athleteName: athlete.name, programClass: athlete.program_class, category: record.category, value: record.value, requestType: request.request_type, message: request.message, priority: request.priority, status: request.status, createdAt: request.created_at, answeredAt: request.answered_at }];
  });
  const { data: bugReports } = await supabase.from("bug_reports").select("id, user_id, category, detail, page_url, user_agent, status, created_at").order("created_at", { ascending: false }).limit(100);
  const memberNames = new Map((allAthletes ?? []).map((athlete) => [athlete.user_id, athlete.name]));
  const bugReportItems: BugReportItem[] = (bugReports ?? []).map((item) => ({ id: item.id, memberName: memberNames.get(item.user_id) ?? "会員", category: item.category, detail: item.detail, pageUrl: item.page_url, userAgent: item.user_agent, status: item.status, createdAt: item.created_at }));
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 hover:text-orange-400"><ArrowLeft size={16} />自分のマイページ</Link>
    <header className="mt-10 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">COACH DASHBOARD</p><h1 className="mt-3 text-4xl font-black">担当選手</h1><p className="mt-3 text-white/55">選手の現状を確認して、記録ごとにフィードバックできます。</p></header>
    <div className="mt-8 flex flex-wrap gap-2">{classes.map((item) => <span key={item} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{item}</span>)}</div>
    <FeedbackRequestQueue items={queueItems} />
    <CoachInvitationManager />
    <BugReportManager initialItems={bugReportItems} />
    <MemberManagement members={(allAthletes ?? []).map((athlete) => ({ ...athlete, member_status: athlete.member_status ?? "active" }))} />
    <CoachAnnouncementForm />
    <CoachScheduleManager initialItems={(schedules ?? []) as ScheduleItem[]} initialTemplates={(scheduleTemplates ?? []) as ScheduleTemplate[]} initialAttendance={attendance ?? []} />
    <AthletesByClass athletes={athletes ?? []} />
  </div></main>;
}
