import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  BellRing,
  BookOpen,
  CalendarDays,
  ChevronRight,
  MessageSquareText,
  ScanLine,
  Users,
  UserPlus,
} from "lucide-react";
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

  const quickActions = [
    {
      id: "schedule",
      title: "スケジュール・出席管理",
      description: "練習・試合の予定作成、出席入力、競技申請の確認をここで処理",
      icon: <CalendarDays size={20} className="text-cyan-300" />,
      accent: "from-cyan-500/30 to-cyan-500/5",
    },
    {
      id: "members",
      title: "選手名簿・プロフィール管理",
      description: "会員の新規追加、退会情報、プロフィールの点検を即時実行",
      icon: <Users size={20} className="text-blue-300" />,
      accent: "from-blue-500/30 to-blue-500/5",
    },
    {
      id: "announcement",
      title: "お知らせを投稿（HOME反映）",
      description: "管理者向けTOPへのお知らせ公開。投稿後、ホームに即時表示",
      icon: <BellRing size={20} className="text-emerald-300" />,
      accent: "from-emerald-500/30 to-emerald-500/5",
    },
    {
      id: "invite",
      title: "招待・会員追加",
      description: "参加リンクを発行し、会員をクラスへ簡単追加",
      icon: <UserPlus size={20} className="text-purple-300" />,
      accent: "from-violet-500/30 to-violet-500/5",
    },
    {
      id: "report",
      title: "バグ報告を確認",
      description: "受け取った報告の内容を確認し、未対応を優先対応",
      icon: <MessageSquareText size={20} className="text-rose-300" />,
      accent: "from-rose-500/30 to-rose-500/5",
    },
    {
      id: "manual",
      title: "コーチ用マニュアル",
      description: "操作手順を開いて、迷ったときにすぐ参照",
      icon: <BookOpen size={20} className="text-orange-300" />,
      accent: "from-orange-500/30 to-orange-500/5",
    },
  ];

  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-8 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <section id="management-menu" className="fixed left-0 right-0 top-16 z-40 border-b border-white/10 bg-[#090a0c]/98 px-5 py-4 backdrop-blur">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black tracking-[0.18em] text-orange-300">START HERE</p>
        <h2 className="mt-2 text-lg font-black">管理作業ガイド</h2>
        <p className="mt-2 text-sm text-white/65">クリックで移動。各見出しの「番号」を確認すると、今いる場所がすぐわかります。</p>
      </div>
    </section>
    <div className="h-[17rem]" />
    <section className="rounded-2xl border border-white/10 bg-[#101216]/95 p-5 backdrop-blur">
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {quickActions.map((action, index) => (
          <a
            key={action.id}
            href={`#${action.id}`}
            className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 transition hover:border-orange-300"
          >
            <span className="mt-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/10 text-[11px] font-black text-white/80">{`0${index + 1}`}</span>
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${action.accent}`}>{action.icon}</span>
            <span>
              <span className="text-sm font-bold">{action.title}</span>
              <span className="mt-1 block text-xs text-white/60">{action.description}</span>
            </span>
          </a>
        ))}
      </div>
    </section>
    <Link href="/coach/dashboard" className="mt-8 inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 hover:text-orange-400"><ArrowLeft size={16} />コーチダッシュボード</Link>
    <header className="mt-8 border-l-4 border-orange-400 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">COACH MANAGEMENT</p><h1 className="mt-3 text-4xl font-black">管理メニュー</h1><p className="mt-3 text-white/55">このページの見出しから、まず今やるべき作業を選べます。</p></header>

    <section id="schedule" className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-5">
      <h2 className="inline-flex items-center gap-2 text-sm font-black tracking-[0.1em] text-cyan-300"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20">01</span>スケジュール・出席管理</h2>
      <p className="mt-2 text-xs text-white/55">今日からの予定・出欠を先に整えるのが、運営の基本です。</p>
      <CoachScheduleManager initialItems={(schedules ?? []) as ScheduleItem[]} initialTemplates={(scheduleTemplates ?? []) as ScheduleTemplate[]} initialAttendance={attendance ?? []} competitionApplicants={competitionApplicants} />
    </section>
    {adminRole ? <Link href="/admin/athlete-scan" className="mt-4 flex items-center justify-between rounded-2xl border border-cyan-400/30 bg-cyan-400/[.06] p-5 transition hover:border-cyan-300"><span className="flex items-center gap-4"><ScanLine className="text-cyan-300"/><span><strong className="block">VAULTEX STANDARD 管理</strong><span className="mt-1 block text-xs text-white/50">影響を確認して基準値を更新</span></span></span><ChevronRight className="text-cyan-300"/></Link> : null}
    <section id="members" className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-5">
      <h2 className="inline-flex items-center gap-2 text-sm font-black tracking-[0.1em] text-blue-300"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20">02</span>選手名簿・プロフィール管理</h2>
      <p className="mt-2 text-xs text-white/55">選手情報の追加・編集はここから。運営連絡の起点は名簿です。</p>
      <MemberManagement members={(allAthletes ?? []).map((athlete) => ({ ...athlete, member_status: athlete.member_status ?? "active" }))} />
    </section>
    <section id="announcement" className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-5">
      <h2 className="inline-flex items-center gap-2 text-sm font-black tracking-[0.1em] text-emerald-300"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">03</span>会員・一般向けお知らせ</h2>
      <p className="mt-2 text-xs text-white/55">通常は会員だけに配信し、公開チェックを入れた内容だけHOMEにも掲載します。</p>
      <CoachAnnouncementForm />
    </section>
    <section id="invite" className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-5">
      <h2 className="inline-flex items-center gap-2 text-sm font-black tracking-[0.1em] text-violet-300"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20">04</span>招待・会員追加</h2>
      <p className="mt-2 text-xs text-white/55">招待を送って、チーム人数を増やしやすくします。</p>
      <CoachInvitationManager />
    </section>
    <section id="report" className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-5">
      <h2 className="inline-flex items-center gap-2 text-sm font-black tracking-[0.1em] text-rose-300"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20">05</span>バグ報告を確認</h2>
      <p className="mt-2 text-xs text-white/55">未対応がある項目から順に、運用の安全性を保てます。</p>
      <BugReportManager initialItems={bugReportItems} />
    </section>
    <section id="manual" className="mt-8 rounded-2xl border border-white/10 bg-[#101216] p-5">
      <h2 className="inline-flex items-center gap-2 text-sm font-black tracking-[0.1em] text-orange-300"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20">06</span>コーチ用マニュアル</h2>
      <p className="mt-2 text-xs text-white/55">作業迷子防止に、いま一度手順を確認してください。</p>
      <a href="/coach-manual.pdf" target="_blank" rel="noopener noreferrer" className="mt-4 flex w-fit items-center justify-between rounded-xl border border-orange-500/40 bg-orange-500/[0.08] px-4 py-3 text-white transition hover:border-orange-300"><BookOpen size={20} className="text-orange-400" /><span className="mx-3 text-sm font-bold">コーチ用使用マニュアルを開く</span><ChevronRight size={16} className="text-orange-300" /></a>
    </section>
  </div></main>;
}
