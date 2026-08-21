import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { Activity, ArrowUpRight, CalendarDays, ChevronRight, Medal, MessageCircle, NotebookPen, Plus, Target, Trophy, Video } from "lucide-react";
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

function tokyoDateKey(value: string) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function occursOnDate(schedule: ScheduleItem, key: string) {
  const start = tokyoDateKey(schedule.starts_at);
  const end = schedule.ends_at ? tokyoDateKey(schedule.ends_at) : start;
  return start <= key && end >= key;
}

function todayScheduleTime(schedule: ScheduleItem) {
  if (schedule.all_day) return "終日";
  return new Date(schedule.starts_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" });
}

function addTokyoDays(key: string, days: number) {
  const date = new Date(`${key}T12:00:00+09:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

export default async function MyPage() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect("/login?next=/mypage");
  }

  const { currentMonth, previousMonth, previousMonthStart } = japanMonthKeys();
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  const todayStart = new Date(`${todayKey}T00:00:00+09:00`).toISOString();

  const playerPromise = Promise.resolve(supabase.from("players").select("*").eq("user_id", userId).single());
  const coachRolePromise = Promise.resolve(supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "coach").maybeSingle());
  const schedulesPromise = Promise.resolve(supabase.from("schedules").select("id, title, details, location, starts_at, ends_at, all_day, training_phase, schedule_type, audience, program_class, registration_enabled, registration_opens_at, registration_deadline").or(`starts_at.gte.${todayStart},ends_at.gte.${todayStart}`).order("starts_at").limit(30));
  const competitionApplicationsPromise = Promise.resolve(supabase.from("competition_applications").select("schedule_id").eq("user_id", userId).eq("status", "submitted"));
  const attendingSchedulesPromise = Promise.resolve(supabase.from("schedule_attendance").select("schedule_id,status").eq("user_id", userId));
  const personalCalendarPromise = Promise.resolve(supabase.from("personal_calendar_entries").select("id,entry_date,title,location,journal,entry_type,starts_at,ends_at,all_day").eq("user_id", userId).is("schedule_id", null).gte("entry_date", todayKey).order("entry_date").limit(20));
  const todayRecordsPromise = Promise.resolve(supabase.from("performance_records").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("date", todayKey));
  const activeGoalPromise = Promise.resolve(supabase.from("personal_calendar_goals").select("title,target_date").eq("user_id", userId).eq("status", "active").maybeSingle());
  const deferredDataPromise = loadMypageDeferredData({ userId, gender: playerPromise.then(({ data }) => data?.gender ?? null), currentMonth, previousMonthStart });
  const [{ data: player }, { data: coachRole }, { data: schedules }, { data: competitionApplications }, { data: attendingSchedules }, { data: personalCalendarEntries }, { count: todayRecordCount }, { data: activeGoal }] = await Promise.all([playerPromise, coachRolePromise, schedulesPromise, competitionApplicationsPromise, attendingSchedulesPromise, personalCalendarPromise, todayRecordsPromise, activeGoalPromise]);

  if (!player) {
    redirect("/profile/create");
  }

  const appliedCompetitionIds = new Set((competitionApplications ?? []).map((application) => application.schedule_id));
  const attendanceByScheduleId = new Map((attendingSchedules ?? []).map((attendance) => [attendance.schedule_id, attendance.status]));
  const answeredScheduleIds = new Set((attendingSchedules ?? []).map((attendance) => attendance.schedule_id));
  const attendingScheduleIds = new Set((attendingSchedules ?? []).filter((attendance) => attendance.status === "attending").map((attendance) => attendance.schedule_id));
  const unansweredScheduleCount = ((schedules ?? []) as ScheduleItem[]).filter((schedule) => (schedule.audience === "all" || schedule.program_class === player.program_class) && !answeredScheduleIds.has(schedule.id)).length;
  const personalSchedules: ScheduleItem[] = (personalCalendarEntries ?? []).map((entry) => ({ id: -entry.id, title: entry.title, details: entry.journal, location: entry.location, starts_at: entry.starts_at ?? `${entry.entry_date}T00:00:00+09:00`, ends_at: entry.ends_at, all_day: entry.all_day, schedule_type: entry.entry_type, audience: "all", program_class: null, registration_enabled: false, registration_opens_at: null, registration_deadline: null, personal: true }));
  const nextSchedules = ([...((schedules ?? []) as ScheduleItem[]).filter((schedule) => appliedCompetitionIds.has(schedule.id) || attendingScheduleIds.has(schedule.id)), ...personalSchedules])
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 2);
  const nextSchedule = nextSchedules[0];
  const nextScheduleDate = nextSchedule ? new Date(nextSchedule.starts_at) : null;
  const todayTrainingItems = ([...((schedules ?? []) as ScheduleItem[]).filter((schedule) => (schedule.audience === "all" || schedule.program_class === player.program_class) && schedule.schedule_type !== "competition" && attendanceByScheduleId.get(schedule.id) !== "absent" && occursOnDate(schedule, todayKey)), ...personalSchedules.filter((schedule) => schedule.schedule_type !== "competition" && occursOnDate(schedule, todayKey))])
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const visibleClubSchedules = ((schedules ?? []) as ScheduleItem[]).filter((schedule) => schedule.audience === "all" || schedule.program_class === player.program_class);
  const weekSchedule = Array.from({ length: 7 }, (_, index) => {
    const dateKey = addTokyoDays(todayKey, index);
    const date = new Date(`${dateKey}T12:00:00+09:00`);
    return {
      dateKey,
      day: date.toLocaleDateString("ja-JP", { day: "numeric", timeZone: "Asia/Tokyo" }),
      weekday: date.toLocaleDateString("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" }),
      items: visibleClubSchedules.filter((schedule) => occursOnDate(schedule, dateKey)),
    };
  });

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
          <div className="p-6 sm:p-8 lg:flex lg:min-h-[590px] lg:flex-col lg:p-10">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-orange-500/35 bg-orange-500/10 px-3 py-1 text-[10px] font-black tracking-[.16em] text-orange-300">{player.program_class ?? "CLASS未設定"}</span><span className="text-xs text-white/35">{player.grade ?? "学年未設定"}</span></div>
            <h2 className="mt-5 text-3xl font-black tracking-[-.04em] sm:text-4xl lg:text-5xl">{player.name}</h2>
            <p className="mt-2 text-sm font-bold text-white/40">{player.event ?? "種目未設定"}</p>
            {coachRole ? <Link href="/coach/dashboard" prefetch className="mt-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/15">COACH DASHBOARD <ArrowUpRight size={15}/></Link> : null}
            <div className="mt-auto hidden pt-10 lg:block">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-[10px] font-black tracking-[.2em] text-orange-300">CLUB SCHEDULE</p><strong className="mt-1 block text-sm">これから1週間</strong></div>
                <Link href="/mypage/schedules" className="inline-flex items-center gap-1 text-[10px] font-black text-white/35 transition hover:text-white">全体を見る<ChevronRight size={13}/></Link>
              </div>
              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {weekSchedule.map((date) => {
                  const firstItem = date.items[0];
                  return <Link key={date.dateKey} href={`/mypage/schedules?date=${date.dateKey}`} className={`min-w-0 rounded-xl border px-2 py-3 transition ${date.dateKey === todayKey ? "border-orange-400/45 bg-orange-400/10" : "border-white/[.07] bg-black/15 hover:border-white/20"}`}>
                    <span className={`block text-[9px] font-black ${date.weekday === "日" ? "text-rose-300" : date.weekday === "土" ? "text-sky-300" : "text-white/30"}`}>{date.weekday}</span>
                    <strong className="mt-0.5 block text-base leading-none">{date.day}</strong>
                    {firstItem ? <><span className={`mt-3 block h-1.5 w-1.5 rounded-full ${firstItem.schedule_type === "competition" ? "bg-orange-400" : "bg-emerald-400"}`}/><span className="mt-1.5 block truncate text-[9px] font-bold text-white/65">{firstItem.title}</span>{date.items.length > 1 ? <span className="mt-1 block text-[8px] text-white/30">ほか{date.items.length - 1}件</span> : null}</> : <span className="mt-3 block text-[9px] text-white/20">予定なし</span>}
                  </Link>;
                })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 border-t border-white/10 lg:border-l lg:border-t-0">
            <div data-tutorial="schedule-action" className="col-span-2 border-b border-white/10 p-5 sm:p-7">
              <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><NotebookPen size={19}/></span><div><p className="text-[10px] font-black tracking-[.18em] text-emerald-300">MY CALENDAR</p><strong className="mt-0.5 block">今日を確認・記録する</strong></div></div><div className="flex items-center gap-2">{unansweredScheduleCount ? <Link href="/mypage/schedules" className="rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5 text-[10px] font-black text-orange-300">出欠未回答 {unansweredScheduleCount}件</Link> : null}<Link href="/mypage/my-calendar" className="inline-flex items-center gap-1 text-xs font-black text-white/50 transition hover:text-white">開く<ChevronRight size={15}/></Link></div></div>
              <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-400/[.04] p-4">
                <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black tracking-[.18em] text-emerald-300">TODAY&apos;S TRAINING</p><strong className="mt-1 block text-sm">今日の練習</strong></div><span className="rounded-full bg-white/[.06] px-2.5 py-1 text-[10px] font-black text-white/45">{todayTrainingItems.length}件</span></div>
                {todayTrainingItems.length ? <div className="mt-3 space-y-2">{todayTrainingItems.slice(0, 3).map((item) => { const attendanceStatus = item.personal ? "個人予定" : attendanceByScheduleId.get(item.id) === "attending" ? "参加" : attendanceByScheduleId.get(item.id) === "undecided" ? "未定" : "出欠未回答"; return <Link key={`${item.personal ? "personal" : "club"}-${item.id}`} href={`/mypage/my-calendar?date=${todayKey}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[.07] bg-black/20 px-3 py-2.5 transition hover:border-emerald-400/30"><span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400"/><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><span className="mt-0.5 block truncate text-[10px] text-white/40">{todayScheduleTime(item)}{item.location ? ` ・ ${item.location}` : ""}</span></span><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${attendanceStatus === "参加" ? "bg-emerald-400/15 text-emerald-300" : attendanceStatus === "出欠未回答" ? "bg-orange-400/15 text-orange-300" : "bg-white/[.07] text-white/40"}`}>{attendanceStatus}</span></Link>; })}{todayTrainingItems.length > 3 ? <Link href={`/mypage/my-calendar?date=${todayKey}`} className="block pt-1 text-center text-[10px] font-black text-emerald-300">ほか{todayTrainingItems.length - 3}件を表示</Link> : null}</div> : <Link href={`/mypage/my-calendar?date=${todayKey}`} className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-white/10 px-3 py-3 text-xs text-white/40"><span>今日の予定はありません</span><span className="inline-flex items-center gap-1 font-black text-emerald-300"><Plus size={14}/>個人練習を追加</span></Link>}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link href="/mypage/my-calendar" className="rounded-xl border border-white/10 bg-white/[.025] p-3 transition hover:border-orange-400/40"><span className="text-[10px] font-black text-white/30">NEXT</span>{nextSchedule && nextScheduleDate ? <><strong className="mt-1 block truncate text-sm">{nextSchedule.title}</strong><span className="mt-1 block truncate text-[11px] text-white/40">{nextScheduleDate.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" })}{nextSchedule.location ? ` ・ ${nextSchedule.location}` : ""}</span></> : <strong className="mt-1 block text-sm text-white/35">次の予定はありません</strong>}</Link>
                <Link href={`/performance?kind=unofficial-athletics&date=${todayKey}&from=calendar`} className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-3 transition hover:bg-emerald-400/10"><span><span className="text-[10px] font-black text-emerald-300/70">TODAY&apos;S LOG</span><strong className="mt-1 block text-sm">{todayRecordCount ? `記録済み ${todayRecordCount}件` : "今日の練習を記録"}</strong></span><Plus size={18} className="text-emerald-300"/></Link>
              </div>
              {activeGoal ? <Link href="/mypage/my-calendar" className="mt-3 flex min-w-0 items-center gap-2 text-xs text-white/40"><Target size={14} className="shrink-0 text-orange-400"/><span className="truncate">次の目標：{activeGoal.title}</span><span className="ml-auto shrink-0">{activeGoal.target_date.replaceAll("-", "/")}</span></Link> : null}
            </div>
            <Suspense fallback={<MypageStatsSkeleton/>}><MypageStats dataPromise={deferredDataPromise}/></Suspense>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="grid gap-2.5 sm:grid-cols-3">
          <Link data-tutorial="video-action" href="/mypage/video-feedback" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-sky-400/50"><span className="flex items-center gap-3"><Video size={21} className="text-sky-400"/><span>動画を送る</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
          <Link data-tutorial="all-schedules" href="/mypage/schedules" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-orange-400/50"><span className="flex items-center gap-3"><CalendarDays size={21} className="text-orange-400"/><span>全体スケジュール</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
          <Link data-tutorial="ai-navigator" href="/mypage/ai-navigator" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-orange-400/50"><span className="flex items-center gap-3"><MessageCircle size={21} className="text-orange-400"/><span>AIに相談</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
        </div>
      </section>

      <Suspense fallback={<MypageDeferredSkeleton/>}><MypageDeferredContent dataPromise={deferredDataPromise} userId={userId} currentMonth={currentMonth} previousMonth={previousMonth}/></Suspense>
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
