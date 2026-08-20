import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BellRing, BookOpen, CalendarDays, ChevronRight, MessageSquareText, ScanLine, Users, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import CoachAnnouncementForm from "@/app/components/CoachAnnouncementForm";
import CoachScheduleManager, { type CompetitionApplicant, type ScheduleTemplate } from "@/app/components/CoachScheduleManager";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import MemberManagement from "@/app/components/MemberManagement";
import BugReportManager, { type BugReportItem } from "@/app/components/BugReportManager";
import CoachInvitationManager from "@/app/components/CoachInvitationManager";

export default async function CoachManagementPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;
  if (!userId) redirect("/login?next=/coach/dashboard/manage");
  const [{ data: role }, { data: adminRole }, { data: assignments }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "coach").maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
    supabase.from("coach_class_assignments").select("program_class").eq("coach_id", userId),
  ]);
  if (!role) redirect("/mypage");
  const classes = (assignments ?? []).map((item) => item.program_class);
  const [{ data: allAthletes }, { data: schedules }, { data: scheduleTemplates }, { data: bugReports }] = await Promise.all([
    classes.length ? supabase.from("players").select("user_id, name, grade, event, program_class, member_status").in("program_class", classes).order("program_class").order("name") : Promise.resolve({ data: [] }),
    supabase.from("schedules").select("*").eq("author_id", userId).gte("starts_at", new Date().toISOString()).order("starts_at").limit(20),
    supabase.from("schedule_templates").select("*").eq("author_id", userId).order("name"),
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
    <section className="sticky top-28 z-10 mt-8 rounded-2xl border border-white/10 bg-[#101216]/95 p-4 backdrop-blur">
      <p className="text-xs font-black tracking-[0.18em] text-orange-300">WHAT YOU CAN DO NOW</p>
      <h2 className="mt-2 text-lg font-black">管理メニュー（このページから投稿・更新できます）</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <a href="#schedule" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm font-bold transition hover:border-orange-400 hover:text-orange-300"><CalendarDays size={18} />スケジュール・出席管理</a>
        <a href="#members" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm font-bold transition hover:border-orange-400 hover:text-orange-300"><Users size={18} />選手名簿・プロフィール管理</a>
        <a href="#announcement" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm font-bold transition hover:border-orange-400 hover:text-orange-300"><BellRing size={18} />お知らせを投稿（HOME反映）</a>
        <a href="#invite" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm font-bold transition hover:border-orange-400 hover:text-orange-300"><UserPlus size={18} />招待・会員追加</a>
        <a href="#report" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm font-bold transition hover:border-orange-400 hover:text-orange-300"><MessageSquareText size={18} />バグ報告を確認</a>
        <a href="#manual" className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm font-bold transition hover:border-orange-400 hover:text-orange-300"><BookOpen size={18} />コーチ用マニュアルを開く</a>
      </div>
    </section>

    <section id="schedule" className="mt-8"><CoachScheduleManager initialItems={(schedules ?? []) as ScheduleItem[]} initialTemplates={(scheduleTemplates ?? []) as ScheduleTemplate[]} initialAttendance={attendance ?? []} competitionApplicants={competitionApplicants} /></section>
    {adminRole ? <Link href="/admin/athlete-scan" className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-400/30 bg-cyan-400/[.06] p-5 transition hover:border-cyan-300"><span className="flex items-center gap-4"><ScanLine className="text-cyan-300"/><span><strong className="block">VAULTEX STANDARD 管理</strong><span className="mt-1 block text-xs text-white/50">影響を確認して基準値を更新</span></span></span><ChevronRight className="text-cyan-300"/></Link> : null}
    <section id="invite" className="mt-8"><CoachInvitationManager /></section>
    <section id="members" className="mt-8"><MemberManagement members={(allAthletes ?? []).map((athlete) => ({ ...athlete, member_status: athlete.member_status ?? "active" }))} /></section>
    <section id="announcement" className="mt-8"><CoachAnnouncementForm /></section>
    <section id="manual" className="mt-8 flex items-center justify-between rounded-2xl border border-orange-500/40 bg-orange-500/[0.08] p-5 text-white transition hover:border-orange-400"><a href="/coach-manual.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4"><BookOpen size={22} className="text-orange-400" /><span><strong className="block">コーチ用使用マニュアル</strong><span className="mt-1 block text-xs text-white/50">管理機能の使い方</span></span></a><ChevronRight className="text-orange-400" /></section>
    <section id="report" className="mt-8"><BugReportManager initialItems={bugReportItems} /></section>
  </div></main>;
}
