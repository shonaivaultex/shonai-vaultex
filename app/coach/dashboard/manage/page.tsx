import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, ChevronRight, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import CoachAnnouncementForm from "@/app/components/CoachAnnouncementForm";
import CoachScheduleManager, { type CompetitionApplicant, type ScheduleTemplate } from "@/app/components/CoachScheduleManager";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import MemberManagement from "@/app/components/MemberManagement";
import BugReportManager, { type BugReportItem } from "@/app/components/BugReportManager";
import CoachInvitationManager from "@/app/components/CoachInvitationManager";

export default async function CoachManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/coach/dashboard/manage");
  const [{ data: role }, { data: adminRole }, { data: assignments }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
    supabase.from("coach_class_assignments").select("program_class").eq("coach_id", user.id),
  ]);
  if (!role) redirect("/mypage");
  const classes = (assignments ?? []).map((item) => item.program_class);
  const [{ data: allAthletes }, { data: schedules }, { data: scheduleTemplates }, { data: bugReports }] = await Promise.all([
    classes.length ? supabase.from("players").select("user_id, name, grade, event, program_class, member_status").in("program_class", classes).order("program_class").order("name") : Promise.resolve({ data: [] }),
    supabase.from("schedules").select("*").eq("author_id", user.id).gte("starts_at", new Date().toISOString()).order("starts_at").limit(20),
    supabase.from("schedule_templates").select("*").eq("author_id", user.id).order("name"),
    supabase.from("bug_reports").select("id, user_id, category, detail, page_url, user_agent, status, created_at").order("created_at", { ascending: false }).limit(50),
  ]);
  const scheduleIds = (schedules ?? []).map((item) => item.id);
  const [{ data: attendance }, { data: competitionApplications }] = scheduleIds.length ? await Promise.all([
    supabase.from("schedule_attendance").select("schedule_id, status").in("schedule_id", scheduleIds),
    supabase.from("competition_applications").select("id,schedule_id,user_id,events,note,status,created_at").in("schedule_id", scheduleIds).order("created_at"),
  ]) : [{ data: [] }, { data: [] }];
  const memberNames = new Map((allAthletes ?? []).map((athlete) => [athlete.user_id, athlete.name]));
  const competitionApplicants: CompetitionApplicant[] = (competitionApplications ?? []).map((application) => ({ ...application, player_name: memberNames.get(application.user_id) ?? "会員" }));
  const bugReportItems: BugReportItem[] = (bugReports ?? []).map((item) => ({ id: item.id, memberName: memberNames.get(item.user_id) ?? "会員", category: item.category, detail: item.detail, pageUrl: item.page_url, userAgent: item.user_agent, status: item.status, createdAt: item.created_at }));

  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/coach/dashboard" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 hover:text-orange-400"><ArrowLeft size={16} />コーチダッシュボード</Link>
    <header className="mt-10 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">COACH MANAGEMENT</p><h1 className="mt-3 text-4xl font-black">管理メニュー</h1><p className="mt-3 text-white/55">必要な管理機能だけ、この画面で読み込みます。</p></header>
    <a href="/coach-manual.pdf" target="_blank" rel="noopener noreferrer" className="mt-8 flex items-center justify-between rounded-2xl border border-orange-500/40 bg-orange-500/[0.08] p-5 text-white transition hover:border-orange-400"><span className="flex items-center gap-4"><BookOpen size={22} className="text-orange-400" /><span><strong className="block">コーチ用使用マニュアル</strong><span className="mt-1 block text-xs text-white/50">管理機能の使い方</span></span></span><ChevronRight className="text-orange-400" /></a>
    {adminRole ? <Link href="/admin/athlete-scan" className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-400/30 bg-cyan-400/[.06] p-5 transition hover:border-cyan-300"><span className="flex items-center gap-4"><ScanLine className="text-cyan-300"/><span><strong className="block">VAULTEX STANDARD 管理</strong><span className="mt-1 block text-xs text-white/50">影響を確認して基準値を更新</span></span></span><ChevronRight className="text-cyan-300"/></Link> : null}
    <CoachInvitationManager />
    <MemberManagement members={(allAthletes ?? []).map((athlete) => ({ ...athlete, member_status: athlete.member_status ?? "active" }))} />
    <CoachAnnouncementForm />
    <CoachScheduleManager initialItems={(schedules ?? []) as ScheduleItem[]} initialTemplates={(scheduleTemplates ?? []) as ScheduleTemplate[]} initialAttendance={attendance ?? []} competitionApplicants={competitionApplicants} />
    <BugReportManager initialItems={bugReportItems} />
  </div></main>;
}
