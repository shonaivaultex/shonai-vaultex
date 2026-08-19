import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Activity, ArrowUpRight, BookOpen, CalendarDays, ChevronDown, ChevronRight, Download, Medal, MessageCircle, Plus, ScanLine, Settings, Sparkles, Trophy, Video } from "lucide-react";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import NewsPanel, { type NewsItem } from "@/app/components/NewsPanel";
import { eventKindMap } from "@/lib/performance-events";
import SchedulePanel, { type ScheduleItem } from "@/app/components/SchedulePanel";
import PushNotificationButton from "@/app/components/PushNotificationButton";
import BugReportButton from "@/app/components/BugReportButton";
import MonthlyGrowthReport, { type GrowthRecord } from "@/app/components/MonthlyGrowthReport";
import { evaluateAthleteScan, type AthleteMeasurement, type AthleteStandard, type TypeSettings } from "@/lib/athlete-scan";
import MypageTutorial, { MYPAGE_TUTORIAL_VERSION } from "@/app/components/MypageTutorial";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mypage");
  }

  const { currentMonth, previousMonth, previousMonthStart } = japanMonthKeys();

  const [
    { data: player },
    { data: coachRole },
    { data: schedules },
    { data: announcements },
    { data: ownRecords },
    { data: videoRequests },
    { data: growthRecords },
    { data: latestScan },
    { data: currentStandard },
  ] = await Promise.all([
    supabase.from("players").select("*").eq("user_id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle(),
    supabase.from("schedules").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(2),
    supabase.from("announcements").select("id, title, body, priority, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("performance_records").select("id, category, record_kind").eq("user_id", user.id),
    supabase.from("video_feedback_requests").select("id, event_name").eq("user_id", user.id),
    supabase.from("performance_records").select("id, category, value, date, awareness_category, awareness_categories").eq("user_id", user.id).gte("date", previousMonthStart).order("date", { ascending: false }),
    supabase.from("control_test_scans").select("id, scan_number, measured_on, athlete_standard_version, control_test_measurements(test_code, primary_value, metrics, implement_weight_kg, implement_name, equipment, distance_m, jump_count)").eq("user_id", user.id).order("scan_number", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("athlete_scan_standard_sets").select("version, label").eq("is_current", true).maybeSingle(),
  ]);

  if (!player) {
    redirect("/profile/create");
  }

  const scanVersion = latestScan?.athlete_standard_version ?? currentStandard?.version ?? null;
  const [{ data: athleteStandards }, { data: athleteTypeSettings }] = latestScan && scanVersion && player.gender ? await Promise.all([
    supabase.from("athlete_scan_standards").select("standard_version, gender, test_code, equipment, weight_kg, distance_m, jump_count, score_100_value, score_0_value, higher_is_better, status, notes").eq("standard_version", scanVersion).eq("gender", player.gender),
    supabase.from("athlete_scan_type_settings").select("balanced_max_spread, composite_max_gap, type_descriptions").eq("standard_version", scanVersion).maybeSingle(),
  ]) : [{ data: [] }, { data: null }];
  const latestAthleteScan = latestScan && athleteTypeSettings ? evaluateAthleteScan((latestScan.control_test_measurements ?? []) as AthleteMeasurement[], (athleteStandards ?? []) as AthleteStandard[], athleteTypeSettings as TypeSettings) : null;

  const announcementIds = (announcements ?? []).map((item) => item.id);
  const ownRecordIds = (ownRecords ?? []).map((item) => item.id);
  const videoRequestIds = (videoRequests ?? []).map((item) => item.id);
  const [{ data: readRows }, { data: unreadFeedback }, { data: videoMessages }] = await Promise.all([
    announcementIds.length
      ? supabase.from("announcement_reads").select("announcement_id").eq("user_id", user.id).in("announcement_id", announcementIds)
      : Promise.resolve({ data: [] }),
    ownRecordIds.length
      ? supabase.from("coach_feedback").select("id, record_id, body, created_at").in("record_id", ownRecordIds).is("acknowledged_at", null).order("created_at", { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
    videoRequestIds.length
      ? supabase.from("video_feedback_messages").select("id, request_id, body, created_at").in("request_id", videoRequestIds).eq("sender_role", "coach").order("created_at", { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
  ]);
  const readIds = new Set((readRows ?? []).map((item) => item.announcement_id));
  const videoMessageIds = (videoMessages ?? []).map((item) => item.id);
  const { data: videoMessageReads } = videoMessageIds.length ? await supabase.from("video_feedback_message_reads").select("message_id").eq("user_id", user.id).in("message_id", videoMessageIds) : { data: [] };
  const readVideoMessageIds = new Set((videoMessageReads ?? []).map((item) => item.message_id));
  const videoRequestMap = new Map((videoRequests ?? []).map((item) => [item.id, item]));
  const recordById = new Map((ownRecords ?? []).map((record) => [record.id, record]));
  const newsItems: NewsItem[] = [
    ...(announcements ?? []).map((item) => ({ id: `announcement-${item.id}`, kind: "announcement" as const, title: item.title, body: item.body, date: item.created_at, important: item.priority === "important", unread: !readIds.has(item.id), announcementId: item.id })),
    ...(unreadFeedback ?? []).map((item) => { const record = recordById.get(item.record_id); const kind = record?.record_kind ?? (record ? eventKindMap[record.category] : "control-test"); const baseHref = kind === "athletics" ? "/mypage/athletics" : kind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests"; const href = `${baseHref}?feedback=${item.record_id}`; return { id: `feedback-${item.id}`, kind: "feedback" as const, title: `${record?.category ?? "記録"}にフィードバックが届きました`, body: item.body, date: item.created_at, href, unread: true }; }),
    ...(videoMessages ?? []).map((item) => ({ id: `video-message-${item.id}`, kind: "feedback" as const, title: `${videoRequestMap.get(item.request_id)?.event_name ?? "動画"}に返信が届きました`, body: item.body, date: item.created_at, href: "/mypage/video-feedback", unread: !readVideoMessageIds.has(item.id), videoMessageId: item.id })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  const unreadCount = newsItems.filter((item) => item.unread).length;
  const currentMonthRecordCount = (growthRecords ?? []).filter((record) => record.date.startsWith(currentMonth)).length;
  const nextSchedule = (schedules ?? [])[0] as ScheduleItem | undefined;
  const nextScheduleDate = nextSchedule ? new Date(nextSchedule.starts_at) : null;

  return (
    <main className="mx-auto my-16 max-w-[1480px] px-4 pb-16 sm:px-7 lg:my-20 xl:px-10">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-[10px] font-black tracking-[.28em] text-orange-400">ATHLETE DASHBOARD</p><h1 className="mt-1 text-3xl font-black tracking-[-.04em] lg:text-5xl">MY PAGE</h1></div>
        <span className="hidden text-xs font-bold tracking-[.16em] text-white/25 sm:block">SHONAI VAULTEX</span>
      </div>
      <MypageTutorial autoOpen={(player.mypage_tutorial_version ?? 0) < MYPAGE_TUTORIAL_VERSION} userId={user.id} />

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
            <Link data-tutorial="schedule-action" href="/mypage/schedules" className="col-span-2 flex min-h-32 items-center justify-between gap-5 border-b border-white/10 p-5 transition hover:bg-white/[.035] sm:p-7">
              <div><p className="text-[10px] font-black tracking-[.18em] text-white/30">NEXT SESSION</p>{nextSchedule && nextScheduleDate ? <><strong className="mt-2 block text-lg sm:text-xl">{nextSchedule.title}</strong><p className="mt-1 text-sm text-white/45">{nextScheduleDate.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", timeZone: "Asia/Tokyo" })}　{nextScheduleDate.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}{nextSchedule.location ? `　${nextSchedule.location}` : ""}</p></> : <strong className="mt-2 block text-white/45">予定はありません</strong>}</div><CalendarDays className="shrink-0 text-orange-400" size={25}/>
            </Link>
            <Link href="/mypage/growth-report" className="border-r border-white/10 p-5 transition hover:bg-white/[.035] sm:p-7"><p className="text-[10px] font-black tracking-[.14em] text-white/30">THIS MONTH</p><strong className="mt-2 block text-3xl tracking-[-.04em]">{currentMonthRecordCount}<small className="ml-1 text-xs text-white/35">RECORDS</small></strong></Link>
            <a href="#news" className="p-5 transition hover:bg-white/[.035] sm:p-7"><p className="text-[10px] font-black tracking-[.14em] text-white/30">TO CHECK</p><strong className={`mt-2 block text-3xl tracking-[-.04em] ${unreadCount ? "text-orange-400" : ""}`}>{unreadCount}<small className="ml-1 text-xs text-white/35">ITEMS</small></strong></a>
          </div>
        </div>
      </section>

      <section className="mt-5">
        <div className="grid gap-2.5 sm:grid-cols-3">
          <Link data-tutorial="record-action" href="/performance" className="group flex min-h-20 items-center justify-between rounded-2xl bg-orange-500 px-5 font-black text-black transition hover:bg-orange-400"><span className="flex items-center gap-3"><Plus size={22}/><span>記録を追加</span></span><ArrowUpRight size={18} className="transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></Link>
          <Link data-tutorial="video-action" href="/mypage/video-feedback" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-sky-400/50"><span className="flex items-center gap-3"><Video size={21} className="text-sky-400"/><span>動画を送る</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
          <Link data-tutorial="ai-navigator" href="/mypage/ai-navigator" className="group flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#131313] px-5 font-black text-white transition hover:border-orange-400/50"><span className="flex items-center gap-3"><MessageCircle size={21} className="text-orange-400"/><span>AIに相談</span></span><ChevronRight size={18} className="text-white/25 transition group-hover:translate-x-1"/></Link>
        </div>
      </section>

      <div className="mt-5">
      <section data-tutorial="athlete-scan" className="overflow-hidden rounded-3xl border border-orange-500/50 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.2),transparent_42%),#111] p-5 text-white shadow-[0_14px_42px_rgba(0,0,0,.22)] lg:p-7">
        <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-black"><ScanLine size={24}/></span><div className="min-w-0 flex-1"><p className="text-[10px] font-black tracking-[.2em] text-orange-400">VAULTEX ATHLETE SCAN</p><h2 className="mt-1 text-xl font-black">身体能力の現在地を知る</h2><p className="mt-2 text-sm leading-6 text-white/50">CONTROL TESTから6能力・3特性・現在のATHLETE TYPEを確認します。</p></div></div>
        {latestScan ? <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-xs text-white/40">LATEST SCAN #{String(latestScan.scan_number).padStart(2,"0")} ・ {latestScan.measured_on}</p><p className="mt-1 text-lg font-black text-orange-300">{latestAthleteScan?.typeNameJa ?? "評価結果を確認"}</p>{latestAthleteScan?.typeCode ? <p className="mt-0.5 text-[10px] font-black tracking-[.12em] text-white/45">{latestAthleteScan.typeCode}</p> : null}</div><Sparkles className="shrink-0 text-orange-400" size={24}/></div><Link href={`/mypage/control-tests/${latestScan.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black transition hover:bg-orange-400">ATHLETE SCAN結果を見る<ChevronRight size={17}/></Link></div> : <Link href="/mypage/control-tests/new" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-black transition hover:bg-orange-400"><Plus size={18}/>最初のVAULTEX SCANを記録</Link>}
        <Link href="/mypage/control-tests" className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-white/50 transition hover:text-orange-300">CONTROL TESTの履歴・詳細<ChevronRight size={14}/></Link>
      </section>
      </div>

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
        <MonthlyGrowthReport records={(growthRecords ?? []) as GrowthRecord[]} currentMonth={currentMonth} previousMonth={previousMonth} />
        <div id="news" className="space-y-6"><NewsPanel initialItems={newsItems} userId={user.id} /><SchedulePanel items={(schedules ?? []) as ScheduleItem[]} /></div>
      </div>
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

      <details data-tutorial="settings" className="group mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111] text-white open:border-orange-500/35">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden"><Settings size={19} className="text-white/45" /><strong>その他</strong><span className="text-xs text-white/35">設定・保存・ヘルプ</span><ChevronDown size={18} className="ml-auto text-white/40 transition group-open:rotate-180" /></summary>
        <div className="border-t border-white/10 p-4">
          <PushNotificationButton />
          <a href="/api/performance/export" download className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/75 transition hover:border-orange-500/40 hover:text-white"><span className="flex items-center gap-2 font-bold"><Download size={17} className="text-orange-400" />記録データをCSVで保存</span><span className="text-xs text-white/35">バックアップ</span></a>
          <a href="/member-manual.pdf" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/75"><span className="flex items-center gap-2 font-bold"><BookOpen size={17} className="text-orange-400" />使用マニュアル</span><ChevronRight size={16} /></a>
          <BugReportButton />
          <Link href="/edit" className="mt-3 block rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70">プロフィール編集</Link>
        </div>
      </details>

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
