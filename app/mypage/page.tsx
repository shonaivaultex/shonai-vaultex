import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { Activity, ArrowUpRight, CalendarDays, ChevronRight, Medal, MessageCircle, NotebookPen, Plus, Trophy, Video } from "lucide-react";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import { type ScheduleItem } from "@/app/components/SchedulePanel";
import MypageSettings from "@/app/components/MypageSettings";
import MypageTutorial, { MYPAGE_TUTORIAL_VERSION } from "@/app/components/MypageTutorial";
import MypageDeferredContent, { loadMypageDeferredData, MypageDeferredSkeleton, MypageStats, MypageStatsSkeleton } from "./MypageDeferredContent";

function japanMonthKeys() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const previous = new Date(Date.UTC(year, month - 2, 1));
  return {
    currentMonth: `${year}-${String(month).padStart(2, "0")}`,
    previousMonth: `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`,
    previousMonthStart: `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-01`,
  };
}

export default async function MyPage() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect("/login?next=/mypage");
  }

  const { currentMonth, previousMonth, previousMonthStart } = japanMonthKeys();

  const playerPromise = Promise.resolve(supabase.from("players").select("*").eq("user_id", userId).single());
  const coachRolePromise = Promise.resolve(supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "coach").maybeSingle());
  const schedulesPromise = Promise.resolve(supabase.from("schedules").select("id, title, details, location, starts_at, ends_at, all_day, training_phase, schedule_type, audience, program_class, registration_enabled, registration_opens_at, registration_deadline").gte("starts_at", new Date().toISOString()).order("starts_at").limit(20));
  const competitionApplicationsPromise = Promise.resolve(supabase.from("competition_applications").select("schedule_id").eq("user_id", userId).eq("status", "submitted"));
  const attendingSchedulesPromise = Promise.resolve(supabase.from("schedule_attendance").select("schedule_id").eq("user_id", userId).eq("status", "attending"));
  const personalCalendarPromise = Promise.resolve(supabase.from("personal_calendar_entries").select("id,entry_date,title,location,journal,entry_type").eq("user_id", userId).is("schedule_id", null).gte("entry_date", new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" })).order("entry_date").limit(20));
  const deferredDataPromise = loadMypageDeferredData({ userId, gender: playerPromise.then(({ data }) => data?.gender ?? null), currentMonth, previousMonthStart });
  const [{ data: player }, { data: coachRole }, { data: schedules }, { data: competitionApplications }, { data: attendingSchedules }, { data: personalCalendarEntries }] = await Promise.all([playerPromise, coachRolePromise, schedulesPromise, competitionApplicationsPromise, attendingSchedulesPromise, personalCalendarPromise]);

  if (!player) {
    redirect("/profile/create");
  }

  const appliedCompetitionIds = new Set((competitionApplications ?? []).map((application) => application.schedule_id));
  const attendingScheduleIds = new Set((attendingSchedules ?? []).map((attendance) => attendance.schedule_id));
  const personalSchedules: ScheduleItem[] = (personalCalendarEntries ?? []).map((entry) => ({ id: -entry.id, title: entry.title, details: entry.journal, location: entry.location, starts_at: `${entry.entry_date}T00:00:00+09:00`, ends_at: null, all_day: true, schedule_type: entry.entry_type, audience: "all", program_class: null, registration_enabled: false, registration_opens_at: null, registration_deadline: null, personal: true }));
  const nextSchedules = ([...((schedules ?? []) as ScheduleItem[]).filter((schedule) => appliedCompetitionIds.has(schedule.id) || attendingScheduleIds.has(schedule.id)), ...personalSchedules])
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 2);
  const nextSchedule = nextSchedules[0];
  const nextScheduleDate = nextSchedule ? new Date(nextSchedule.starts_at) : null;

  return (
    <main className="mx-auto my-16 max-w-[1480px] px-4 pb-16 sm:px-7 lg:my-20 xl:px-10">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[10px] font-black tracking-[.28em] text-orange-400">ATHLETE DASHBOARD</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em] lg:text-5xl">MY PAGE</h1></div>
        <span className="hidden text-xs font-bold tracking-[.16em] text-white/25 sm:block">SHONAI VAULTEX</span>
      </div>
      <MypageTutorial autoOpen={(player.mypage_tutorial_version ?? 0) < MYPAGE_TUTORIAL_VERSION} userId={userId} />

      <section className="relative mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_85%_10%,rgba(249,115,22,.16),transparent_28%),linear-gradient(145deg,#151515,#0d0d0d_65%)] text-white shadow-[0_28px_90px_rgba(0,0,0,.28)]">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-400 via-orange-600 to-transparent" />
        <div className="grid lg:grid-cols-[1.15fr_1fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-orange-500/35 bg-orange-500/10 px-3 py-1 text-[10px] font-black tracking-[.16em] text-orange-300">{player.program_class ?? "CLASS未設定"}</span><span className="text-xs text-white/35">{player.grade ?? "学年未設定"}</span></div>
            <h2 className="mt-5 text-3xl font-black tracking-[-.04em] sm:text-4xl lg:text-5xl">{player.name}</h2>
            <p className="mt-2 text-sm font-bold text-white/40">{player.event ?? "種目未設定"}</p>
            {coachRole ? <Link href="/coach/dashboard" prefetch className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/15">COACH DASHBOARD <ArrowUpRight size={15}/></Link> : null}
          </div>
          <div className="grid grid-cols-2 border-t border-white/10 lg:border-l lg:border-t-0">
            <Link data-tutorial="schedule-action" href="/mypage/my-calendar" className="col-span-2 flex min-h-32 items-center justify-between gap-5 border-b border-white/10 p-5 transition hover:bg-white/[.035] sm:p-7">
              <div><p className="text-[10px] font-black tracking-[.18em] text-white/30">NEXT SESSION</p>{nextSchedule && nextScheduleDate ? <><strong className="mt-2 block text-lg sm:text-xl">{nextSchedule.title}</strong><p className="mt-1 text-sm text-white/45">{nextScheduleDate.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" })}　{nextSchedule.all_day ? "終日" : nextScheduleDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}{nextSchedule.location ? `　${nextSchedule.location}` : ""}</p></> : <strong className="mt-2 block text-white/45">予定はありません</strong>}</div><CalendarDays className="shrink-0 text-orange-400" size={25}/>
            </Link>
            <Suspense fallback={<MypageStatsSkeleton/>}><MypageStats dataPromise={deferredDataPromise}/></Suspense>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
          <Link data-tutorial="record-action" href="/performance" className="group flex min-h-20 items-center justify-between rounded-2xl bg-orange-500 px-5 font-black text-black transition hover:bg-orange-400"><span className="flex items-center gap-3"><Plus size={22}/><span>記録を追加</span></span><ArrowUpRight size={18} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></Link>
          <Link data-tutorial="video-action" href="/mypage/video-feedback" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-sky-400/50"><span className="flex items-center gap-3"><Video size={21} className="text-sky-400"/><span>動画を送る</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
          <Link href="/mypage/schedules" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-orange-400/50"><span className="flex items-center gap-3"><CalendarDays size={21} className="text-orange-400"/><span>全体スケジュール</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
          <Link href="/mypage/my-calendar" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-emerald-400/50"><span className="flex items-center gap-3"><NotebookPen size={21} className="text-emerald-400"/><span>マイカレンダー</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
          <Link data-tutorial="ai-navigator" href="/mypage/ai-navigator" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-orange-400/50"><span className="flex items-center gap-3"><MessageCircle size={21} className="text-orange-400"/><span>AIに相談</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
        </div>
      </section>

      <Suspense fallback={<MypageDeferredSkeleton/>}><MypageDeferredContent dataPromise={deferredDataPromise} userId={userId} schedules={nextSchedules} currentMonth={currentMonth} previousMonth={previousMonth}/></Suspense>
      <div data-tutorial="performance">
      <div className="mb-4 mt-12 flex items-end justify-between"><div><p className="text-[10px] font-black tracking-[.22em] text-orange-400">PERFORMANCE</p><h2 className="mt-1 text-2xl font-black tracking-[-.03em]">記録を振り返る</h2></div><span className="hidden text-xs text-white/25 sm:block">記録・動画・意識</span></div>
      <div className="grid gap-3 lg:grid-cols-3">
        <Link href="/mypage/unofficial-athletics" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111] p-5 text-white no-underline transition hover:-translate-y-0.5 hover:border-orange-400/60">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Medal aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">練習記録</strong><span className="mt-1 block text-sm text-white/50">練習跳躍・練習投擲・実践練習</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/mypage/athletics" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111] p-5 text-white no-underline transition hover:-translate-y-0.5 hover:border-orange-400/60">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Trophy aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">本番記録</strong><span className="mt-1 block text-sm text-white/50">大会・記録会・自己ベスト</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/mypage/control-tests" className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-[#111] p-5 text-white no-underline transition hover:-translate-y-0.5 hover:border-orange-400/60">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Activity aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">コントロールテスト</strong><span className="mt-1 block text-sm text-white/50">スプリント・ジャンプ・筋力</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
      </div>

      <MypageSettings />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 24,
        }}
      >
        <span />
        <LogoutButton />
      </div>
    </main>
  );
}
