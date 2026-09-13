import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-server";
import { ArrowUpRight, CalendarDays, CalendarPlus, Check, ChevronRight, ClipboardPenLine, MessageCircle, NotebookPen, Plus, Settings2, Target, UserRoundCheck, Video } from "lucide-react";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import { type ScheduleItem } from "@/app/components/SchedulePanel";
import MypageTutorial, { MYPAGE_TUTORIAL_VERSION } from "@/app/components/MypageTutorial";
import DailyCheckin, { type DailyCheckinValue } from "@/app/components/DailyCheckin";
import { LatestNewsSummary, loadMypageDeferredData, MypageStats, MypageStatsSkeleton } from "./MypageDeferredContent";

function japanMonthKeys() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const previous = new Date(Date.UTC(year, month - 2, 1));
  return {
    currentMonth: `${year}-${String(month).padStart(2, "0")}`,
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

function addTokyoDays(key: string, days: number) {
  const date = new Date(`${key}T12:00:00+09:00`);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function isTrainingSchedule(schedule: ScheduleItem) {
  return schedule.personal
    ? schedule.schedule_type === "school_practice" || schedule.schedule_type === "personal_training"
    : schedule.schedule_type === "practice" || schedule.schedule_type === "measurement";
}

export default async function MyPage() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) {
    redirect("/login?next=/mypage");
  }

  const { currentMonth, previousMonthStart } = japanMonthKeys();
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  const todayStart = new Date(`${todayKey}T00:00:00+09:00`).toISOString();

  const playerPromise = Promise.resolve(supabase.from("players").select("name,event,grade,program_class,gender,mypage_tutorial_version").eq("user_id", userId).single());
  const coachRolePromise = Promise.resolve(supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "coach").maybeSingle());
  const schedulesPromise = Promise.resolve(supabase.from("schedules").select("id, title, details, location, starts_at, ends_at, all_day, training_phase, schedule_type, audience, program_class, registration_enabled, registration_opens_at, registration_deadline").or(`starts_at.gte.${todayStart},ends_at.gte.${todayStart}`).order("starts_at").limit(30));
  const competitionApplicationsPromise = Promise.resolve(supabase.from("competition_applications").select("schedule_id").eq("user_id", userId).eq("status", "submitted"));
  const attendingSchedulesPromise = Promise.resolve(supabase.from("schedule_attendance").select("schedule_id,status").eq("user_id", userId));
  const personalCalendarPromise = Promise.resolve(supabase.from("personal_calendar_entries").select("id,entry_date,title,location,journal,entry_type,starts_at,ends_at,all_day").eq("user_id", userId).is("schedule_id", null).gte("entry_date", todayKey).order("entry_date").limit(20));
  const todayRecordsPromise = Promise.resolve(supabase.from("performance_records").select("id,record_kind").eq("user_id", userId).eq("date", todayKey));
  const activeGoalPromise = Promise.resolve(supabase.from("personal_calendar_goals").select("title,target_date").eq("user_id", userId).eq("status", "active").maybeSingle());
  const dailyCheckinPromise = Promise.resolve(supabase.from("daily_checkins").select("condition_score,fatigue_score,mood_score,note").eq("user_id", userId).eq("checkin_date", todayKey).maybeSingle());
  const [{ data: player }, { data: coachRole }, { data: schedules }, { data: competitionApplications }, { data: attendingSchedules }, { data: personalCalendarEntries }, { data: todayRecords }, { data: activeGoal }, { data: dailyCheckin }] = await Promise.all([playerPromise, coachRolePromise, schedulesPromise, competitionApplicationsPromise, attendingSchedulesPromise, personalCalendarPromise, todayRecordsPromise, activeGoalPromise, dailyCheckinPromise]);

  if (!player) {
    redirect("/profile/create");
  }

  // Keep secondary reports from competing with the data required for the first screen.
  const deferredDataPromise = loadMypageDeferredData({ userId, gender: player.gender, currentMonth, previousMonthStart });

  const appliedCompetitionIds = new Set((competitionApplications ?? []).map((application) => application.schedule_id));
  const answeredScheduleIds = new Set((attendingSchedules ?? []).map((attendance) => attendance.schedule_id));
  const attendingScheduleIds = new Set((attendingSchedules ?? []).filter((attendance) => attendance.status === "attending").map((attendance) => attendance.schedule_id));
  const attendanceEndKey = addTokyoDays(todayKey, 14);
  const isVisibleClubSchedule = (schedule: ScheduleItem) =>
    Boolean(coachRole) || schedule.audience === "all" || schedule.program_class === player.program_class;
  const isMyClubSchedule = (schedule: ScheduleItem) => attendingScheduleIds.has(schedule.id) || (schedule.schedule_type === "competition" && appliedCompetitionIds.has(schedule.id));
  const unansweredScheduleCount = ((schedules ?? []) as ScheduleItem[]).filter((schedule) => !schedule.is_personal_slot && (schedule.audience === "all" || schedule.program_class === player.program_class) && !answeredScheduleIds.has(schedule.id) && tokyoDateKey(schedule.starts_at) <= attendanceEndKey).length;
  const personalSchedules: ScheduleItem[] = (personalCalendarEntries ?? []).map((entry) => ({ id: -entry.id, title: entry.title, details: entry.journal, location: entry.location, starts_at: entry.starts_at ?? `${entry.entry_date}T00:00:00+09:00`, ends_at: entry.ends_at, all_day: entry.all_day, schedule_type: entry.entry_type, audience: "all", program_class: null, registration_enabled: false, registration_opens_at: null, registration_deadline: null, personal: true }));
  const nextSchedules = ([...((schedules ?? []) as ScheduleItem[]).filter((schedule) => appliedCompetitionIds.has(schedule.id) || attendingScheduleIds.has(schedule.id)), ...personalSchedules])
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, 2);
  const nextSchedule = nextSchedules[0];
  const nextScheduleDate = nextSchedule ? new Date(nextSchedule.starts_at) : null;
  const weekDateKeys = Array.from({ length: 7 }, (_, index) => addTokyoDays(todayKey, index));
  const weekMyCalendarSchedule = weekDateKeys.map((dateKey) => {
    const date = new Date(`${dateKey}T12:00:00+09:00`);
    const items = [...((schedules ?? []) as ScheduleItem[]).filter((schedule) => isVisibleClubSchedule(schedule) && isMyClubSchedule(schedule) && occursOnDate(schedule, dateKey)), ...personalSchedules.filter((schedule) => occursOnDate(schedule, dateKey))]
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    return {
      dateKey,
      day: date.toLocaleDateString("ja-JP", { day: "numeric", timeZone: "Asia/Tokyo" }),
      weekday: date.toLocaleDateString("ja-JP", { weekday: "short", timeZone: "Asia/Tokyo" }),
      items,
    };
  });
  const weekMyCalendarItems = ([...((schedules ?? []) as ScheduleItem[]).filter((schedule) => isVisibleClubSchedule(schedule) && isMyClubSchedule(schedule) && weekDateKeys.some((dateKey) => occursOnDate(schedule, dateKey))), ...personalSchedules.filter((schedule) => weekDateKeys.some((dateKey) => occursOnDate(schedule, dateKey)))]).sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const todayTrainingItems = ([...((schedules ?? []) as ScheduleItem[]).filter((schedule) => isVisibleClubSchedule(schedule) && attendingScheduleIds.has(schedule.id) && isTrainingSchedule(schedule) && occursOnDate(schedule, todayKey)), ...personalSchedules.filter((schedule) => isTrainingSchedule(schedule) && occursOnDate(schedule, todayKey))])
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const todayCompetitionItems = ([...((schedules ?? []) as ScheduleItem[]).filter((schedule) => isVisibleClubSchedule(schedule) && schedule.schedule_type === "competition" && (appliedCompetitionIds.has(schedule.id) || attendingScheduleIds.has(schedule.id)) && occursOnDate(schedule, todayKey)), ...personalSchedules.filter((schedule) => schedule.schedule_type === "competition" && occursOnDate(schedule, todayKey))])
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  const todayRecordCount = todayRecords?.length ?? 0;
  const hasTodayTrainingRecord = todayRecords?.some((record) => record.record_kind === "unofficial-athletics") ?? false;
  const hasTodayCompetitionRecord = todayRecords?.some((record) => record.record_kind === "athletics") ?? false;
  const todayActions = [
    unansweredScheduleCount > 0
      ? { href: "/mypage/schedules?attendance=unanswered", label: `出欠を回答する（${unansweredScheduleCount}件）`, detail: "向こう2週間の予定を回答", tone: "orange" }
      : null,
    !dailyCheckin
      ? { href: "#daily-checkin", label: "今日の状態を記録", detail: "体調・疲労・気分を30秒で入力", tone: "amber" }
      : null,
    todayCompetitionItems.length > 0 && !hasTodayCompetitionRecord
      ? { href: `/performance?kind=athletics&date=${todayKey}&quick=1`, label: "今日の本番記録を残す", detail: "結果・気づき・動画を記録", tone: "orange" }
      : null,
    todayTrainingItems.length > 0 && !hasTodayTrainingRecord
      ? { href: `/performance?kind=unofficial-athletics&date=${todayKey}&from=calendar`, label: "今日の練習を記録", detail: "記録・意識・振り返りを残す", tone: "emerald" }
      : null,
  ].filter((action): action is NonNullable<typeof action> => Boolean(action));

  return (
    <main className="mx-auto my-16 max-w-[1480px] px-4 pb-16 sm:px-7 lg:my-20 xl:px-10">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[10px] font-black tracking-[.28em] text-orange-400">ATHLETE DASHBOARD</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em] lg:text-5xl">MY PAGE</h1></div>
        <span className="hidden text-xs font-bold tracking-[.16em] text-white/25 sm:block">SHONAI VAULTEX</span>
      </div>
      <MypageTutorial autoOpen={(player.mypage_tutorial_version ?? 0) < MYPAGE_TUTORIAL_VERSION} userId={userId} />

      <section data-tutorial="mobile-home" className="mt-5 rounded-[24px] border border-orange-400/25 bg-[linear-gradient(135deg,rgba(249,115,22,.11),rgba(18,18,18,.96)_55%)] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-[9px] font-black tracking-[.2em] text-orange-400">TODAY</p><h2 className="mt-1 text-lg font-black">今日やること</h2></div>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${todayActions.length ? "bg-orange-400/10 text-orange-300" : "bg-emerald-400/10 text-emerald-300"}`}>{todayActions.length ? `${todayActions.length}件` : "完了"}</span>
        </div>
        {todayActions.length ? <div className="mt-3 grid gap-2 md:grid-cols-2">{todayActions.map((action) => <Link key={action.href} href={action.href} className="flex min-h-16 items-center gap-3 rounded-xl border border-white/[.07] bg-black/20 px-3 py-2.5 transition hover:border-orange-400/30 active:scale-[.99]"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${action.tone === "emerald" ? "bg-emerald-400/10 text-emerald-300" : "bg-orange-400/10 text-orange-300"}`}><ClipboardPenLine size={17}/></span><span className="min-w-0 flex-1"><strong className="block text-sm">{action.label}</strong><span className="mt-0.5 block text-[10px] text-white/35">{action.detail}</span></span><ChevronRight size={16} className="shrink-0 text-white/25"/></Link>)}</div> : <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[.04] px-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check size={17}/></span><span><strong className="block text-sm">今日の確認は完了</strong><span className="mt-0.5 block text-[10px] text-white/35">必要になったら下のメニューから記録できます</span></span></div>}
      </section>

      <section className="relative mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_85%_10%,rgba(249,115,22,.16),transparent_28%),linear-gradient(145deg,#151515,#0d0d0d_65%)] text-white shadow-[0_28px_90px_rgba(0,0,0,.28)]">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-orange-400 via-orange-600 to-transparent" />
        <div className="grid lg:grid-cols-[.72fr_1.28fr]">
          <div className="relative p-6 sm:p-8 lg:p-9">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-orange-500/35 bg-orange-500/10 px-3 py-1 text-[10px] font-black tracking-[.16em] text-orange-300">{player.program_class ?? "CLASS未設定"}</span><span className="text-xs text-white/35">{player.grade ?? "学年未設定"}</span></div>
            <h2 className="mt-5 text-3xl font-black tracking-[-.04em] sm:text-4xl lg:text-5xl">{player.name}</h2>
            <p className="mt-2 text-sm font-bold text-white/40">{player.event ?? "種目未設定"}</p>
            {coachRole ? <div className="mt-7 grid gap-2 sm:grid-cols-2"><Link href="/coach/dashboard" prefetch className="inline-flex items-center justify-between gap-2 rounded-full border border-emerald-400/35 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/15">COACH DASHBOARD <ArrowUpRight size={15}/></Link><Link href="/coach/performance-session" prefetch className="inline-flex items-center justify-between gap-2 rounded-full border border-sky-400/30 bg-sky-400/[.08] px-4 py-2 text-xs font-black text-sky-300 transition hover:bg-sky-400/15">現場で一括入力 <ClipboardPenLine size={15}/></Link></div> : null}
            <Link href="/mypage/menu?settings=1#settings" className="mt-7 inline-flex items-center gap-2 text-xs font-black text-white/35 transition hover:text-white/70"><Settings2 size={14}/>プロフィール・設定<ChevronRight size={14}/></Link>
          </div>
          <div className="grid grid-cols-2 border-t border-white/10 lg:border-l lg:border-t-0">
            <div data-tutorial="schedule-action" className="col-span-2 border-b border-white/10 p-5 sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href="/mypage/my-calendar" className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300 transition group-hover:bg-emerald-400/15"><NotebookPen size={20}/></span>
                  <span className="min-w-0"><span className="block text-[10px] font-black tracking-[.18em] text-emerald-300">MY CALENDAR</span><strong className="mt-0.5 block truncate">今日を確認・記録する</strong></span>
                </Link>
                <ChevronRight size={18} className="text-white/25"/>
              </div>
              <Link href="/mypage/my-calendar" className="group mt-4 block rounded-2xl border border-emerald-400/25 bg-black/20 p-3 transition hover:border-emerald-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
                <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-black tracking-[.15em] text-white/35">これから1週間</span><span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-300">{weekMyCalendarItems.length}件<ChevronRight size={14} className="transition group-hover:translate-x-1"/></span></div>
                <div className="mt-3 grid grid-cols-7 gap-1">
                  {weekMyCalendarSchedule.map((date) => {
                    const firstItem = date.items[0];
                    return <span key={date.dateKey} className={`min-w-0 rounded-lg border px-1.5 py-2 ${date.dateKey === todayKey ? "border-orange-400/45 bg-orange-400/10" : "border-white/[.07] bg-white/[.015]"}`}><span className={`block text-[8px] font-black ${date.weekday === "日" ? "text-rose-300" : date.weekday === "土" ? "text-sky-300" : "text-white/30"}`}>{date.weekday}</span><strong className="mt-0.5 block text-sm leading-none">{date.day}</strong>{firstItem ? <><span className={`mt-2 block h-1.5 w-1.5 rounded-full ${firstItem.schedule_type === "competition" ? "bg-orange-400" : "bg-emerald-400"}`}/><span className="mt-1 block truncate text-[8px] font-bold text-white/55">{firstItem.title}</span></> : <span className="mt-2 block text-[8px] text-white/15">なし</span>}</span>;
                  })}
                </div>
              </Link>
              <div id="daily-checkin" className="mt-4 scroll-mt-28"><DailyCheckin userId={userId} date={todayKey} initialValue={(dailyCheckin as DailyCheckinValue | null) ?? null}/></div>
              <div className={`mt-5 grid gap-2 ${todayTrainingItems.length || todayCompetitionItems.length ? "sm:grid-cols-2" : ""}`}>
                <Link href="/mypage/my-calendar" className="rounded-xl border border-white/10 bg-white/[.025] p-3 transition hover:border-orange-400/40"><span className="text-[10px] font-black text-white/30">NEXT</span>{nextSchedule && nextScheduleDate ? <><strong className="mt-1 block truncate text-sm">{nextSchedule.title}</strong><span className="mt-1 block truncate text-[11px] text-white/40">{nextScheduleDate.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" })}{nextSchedule.location ? ` ・ ${nextSchedule.location}` : ""}</span></> : <strong className="mt-1 block text-sm text-white/35">次の予定はありません</strong>}</Link>
                {todayTrainingItems.length || todayCompetitionItems.length ? <Link href={todayCompetitionItems.length ? `/performance?kind=athletics&date=${todayKey}&quick=1` : `/performance?kind=unofficial-athletics&date=${todayKey}&from=calendar`} className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-3 transition hover:bg-emerald-400/10"><span><span className="text-[10px] font-black text-emerald-300/70">TODAY&apos;S LOG</span><strong className="mt-1 block text-sm">{todayRecordCount ? `記録済み ${todayRecordCount}件` : todayCompetitionItems.length ? "今日の本番記録を残す" : "今日の練習を記録"}</strong></span><Plus size={18} className="text-emerald-300"/></Link> : null}
              </div>
              {activeGoal ? <Link href="/mypage/my-calendar" className="mt-3 flex min-w-0 items-center gap-2 text-xs text-white/40"><Target size={14} className="shrink-0 text-orange-400"/><span className="truncate">次の目標：{activeGoal.title}</span><span className="ml-auto shrink-0">{activeGoal.target_date.replaceAll("-", "/")}</span></Link> : null}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-7">
        <div><p className="text-[10px] font-black tracking-[.22em] text-emerald-300">QUICK ACCESS</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">よく使う機能</h2></div>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Link prefetch href="/mypage/my-calendar?week=1" className="group flex min-h-24 flex-col justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/[.06] p-4 transition hover:border-emerald-400/45"><CalendarPlus size={20} className="text-emerald-300"/><span><strong className="block text-sm">予定を作る</strong><span className="mt-1 block text-[10px] text-white/35">1週間をまとめて登録</span></span></Link>
          <Link prefetch data-tutorial="performance" href="/performance" className="group flex min-h-24 flex-col justify-between rounded-2xl border border-orange-400/20 bg-orange-400/[.05] p-4 transition hover:border-orange-400/45"><Plus size={20} className="text-orange-300"/><span><strong className="block text-sm">記録する</strong><span className="mt-1 block text-[10px] text-white/35">練習・大会・CT</span></span></Link>
          <Link prefetch href="/mypage/personal" className="group flex min-h-24 flex-col justify-between rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-white/25"><UserRoundCheck size={20} className="text-orange-300"/><span><strong className="block text-sm">パーソナル</strong><span className="mt-1 block text-[10px] text-white/35">空き枠を予約</span></span></Link>
          <Link prefetch data-tutorial="ai-navigator" href="/mypage/ai-navigator" className="group flex min-h-24 flex-col justify-between rounded-2xl border border-white/10 bg-white/[.025] p-4 transition hover:border-white/25"><MessageCircle size={20} className="text-sky-300"/><span><strong className="block text-sm">相談する</strong><span className="mt-1 block text-[10px] text-white/35">AIナビゲーター</span></span></Link>
        </div>
      </section>

      <section className="mt-7">
        <div><p className="text-[10px] font-black tracking-[.22em] text-orange-400">THIS MONTH</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">今月の成長</h2></div>
        <div className="mt-3"><Suspense fallback={<MypageStatsSkeleton/>}><MypageStats dataPromise={deferredDataPromise}/></Suspense></div>
      </section>

      <section id="news" className="mt-7 scroll-mt-24">
        <div className="mb-3"><p className="text-[10px] font-black tracking-[.22em] text-orange-400">NEWS</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">お知らせ</h2></div>
        <Suspense fallback={<div className="h-20 animate-pulse rounded-2xl bg-white/[.04]"/>}><LatestNewsSummary dataPromise={deferredDataPromise}/></Suspense>
      </section>

      <section className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Link data-tutorial="all-schedules" href="/mypage/schedules" className="flex items-center gap-2 rounded-xl border border-white/[.07] px-3 py-3 text-xs font-black text-white/60 transition hover:text-white"><CalendarDays size={15} className="text-sky-300"/>全体予定</Link>
        <Link data-tutorial="video-action" href="/mypage/video-feedback" className="flex items-center gap-2 rounded-xl border border-white/[.07] px-3 py-3 text-xs font-black text-white/60 transition hover:text-white"><Video size={15} className="text-sky-300"/>動画を送る</Link>
        <Link href="/mypage/menu?settings=1#settings" className="flex items-center gap-2 rounded-xl border border-white/[.07] px-3 py-3 text-xs font-black text-white/60 transition hover:text-white"><Settings2 size={15} className="text-orange-300"/>LINE・設定</Link>
        <Link href="/mypage/menu" className="flex items-center justify-between rounded-xl border border-white/[.07] px-3 py-3 text-xs font-black text-white/60 transition hover:text-white"><span>その他</span><ChevronRight size={14}/></Link>
      </section>

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
