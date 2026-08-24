import Link from "next/link";
import { BarChart3, Bell, ChevronRight, Medal, Plus, ScanLine, Sparkles, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { eventKindMap, unitMap } from "@/lib/performance-events";
import { evaluateAthleteScan, type AthleteMeasurement, type AthleteStandard, type TypeSettings } from "@/lib/athlete-scan";
import MonthlyGrowthReport, { type GrowthRecord } from "@/app/components/MonthlyGrowthReport";
import NewsPanel, { type NewsItem } from "@/app/components/NewsPanel";

type DeferredData = {
  currentMonthRecordCount: number;
  unreadCount: number;
  growthRecords: GrowthRecord[];
  personalBests: Record<string, number>;
  newsItems: NewsItem[];
  latestScan: {
    id: number;
    scan_number: number;
    measured_on: string;
    athlete_standard_version: string | null;
    control_test_measurements: AthleteMeasurement[] | null;
  } | null;
  latestAthleteScan: ReturnType<typeof evaluateAthleteScan> | null;
};

export async function loadMypageDeferredData({
  userId,
  gender,
  currentMonth,
  previousMonthStart,
}: {
  userId: string;
  gender: string | null | Promise<string | null>;
  currentMonth: string;
  previousMonthStart: string;
}): Promise<DeferredData> {
  const supabase = await createClient();
  const [
    { data: announcements },
    { data: ownRecords },
    { data: videoRequests },
    { data: growthRecords },
    { data: latestScan },
    { data: currentStandard },
    { data: videoMessageReads },
  ] = await Promise.all([
    supabase.from("announcements").select("id, title, body, priority, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("performance_records").select("id, category, record_kind, value").eq("user_id", userId),
    supabase.from("video_feedback_requests").select("id, event_name").eq("user_id", userId),
    supabase.from("performance_records").select("id, category, value, date, awareness_category, awareness_categories").eq("user_id", userId).gte("date", previousMonthStart).order("date", { ascending: false }),
    supabase.from("control_test_scans").select("id, scan_number, measured_on, athlete_standard_version, control_test_measurements(test_code, primary_value, metrics, implement_weight_kg, implement_name, equipment, distance_m, jump_count)").eq("user_id", userId).order("scan_number", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("athlete_scan_standard_sets").select("version, label").eq("is_current", true).maybeSingle(),
    supabase.from("video_feedback_message_reads").select("message_id").eq("user_id", userId).limit(1000),
  ]);

  const resolvedGender = await gender;
  const announcementIds = (announcements ?? []).map((item) => item.id);
  const ownRecordIds = (ownRecords ?? []).map((item) => item.id);
  const videoRequestIds = (videoRequests ?? []).map((item) => item.id);
  const scanVersion = latestScan?.athlete_standard_version ?? currentStandard?.version ?? null;

  const [
    { data: readRows },
    { data: unreadFeedback },
    { data: videoMessages },
    { data: athleteStandards },
    { data: athleteTypeSettings },
  ] = await Promise.all([
    announcementIds.length
      ? supabase.from("announcement_reads").select("announcement_id").eq("user_id", userId).in("announcement_id", announcementIds)
      : Promise.resolve({ data: [] }),
    ownRecordIds.length
      ? supabase.from("coach_feedback").select("id, record_id, body, created_at").in("record_id", ownRecordIds).is("acknowledged_at", null).order("created_at", { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
    videoRequestIds.length
      ? supabase.from("video_feedback_messages").select("id, request_id, body, created_at").in("request_id", videoRequestIds).eq("sender_role", "coach").order("created_at", { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
    latestScan && scanVersion && resolvedGender
      ? supabase.from("athlete_scan_standards").select("standard_version, gender, test_code, equipment, weight_kg, distance_m, jump_count, score_100_value, score_0_value, higher_is_better, status, notes").eq("standard_version", scanVersion).eq("gender", resolvedGender)
      : Promise.resolve({ data: [] }),
    latestScan && scanVersion && resolvedGender
      ? supabase.from("athlete_scan_type_settings").select("balanced_max_spread, composite_max_gap, type_descriptions").eq("standard_version", scanVersion).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const readIds = new Set((readRows ?? []).map((item) => item.announcement_id));
  const readVideoMessageIds = new Set((videoMessageReads ?? []).map((item) => item.message_id));
  const videoRequestMap = new Map((videoRequests ?? []).map((item) => [item.id, item]));
  const recordById = new Map((ownRecords ?? []).map((record) => [record.id, record]));
  const newsItems: NewsItem[] = [
    ...(announcements ?? []).map((item) => ({ id: `announcement-${item.id}`, kind: "announcement" as const, title: item.title, body: item.body, date: item.created_at, important: item.priority === "important", unread: !readIds.has(item.id), announcementId: item.id })),
    ...(unreadFeedback ?? []).map((item) => {
      const record = recordById.get(item.record_id);
      const kind = record?.record_kind ?? (record ? eventKindMap[record.category] : "control-test");
      const baseHref = kind === "athletics" ? "/mypage/athletics" : kind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests";
      return { id: `feedback-${item.id}`, kind: "feedback" as const, title: `${record?.category ?? "記録"}にフィードバックが届きました`, body: item.body, date: item.created_at, href: `${baseHref}?feedback=${item.record_id}`, unread: true };
    }),
    ...(videoMessages ?? []).map((item) => ({ id: `video-message-${item.id}`, kind: "feedback" as const, title: `${videoRequestMap.get(item.request_id)?.event_name ?? "動画"}に返信が届きました`, body: item.body, date: item.created_at, href: "/mypage/video-feedback", unread: !readVideoMessageIds.has(item.id), videoMessageId: item.id })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  const latestAthleteScan = latestScan && athleteTypeSettings
    ? evaluateAthleteScan((latestScan.control_test_measurements ?? []) as AthleteMeasurement[], (athleteStandards ?? []) as AthleteStandard[], athleteTypeSettings as TypeSettings)
    : null;
  const personalBests = (ownRecords ?? []).reduce<Record<string, number>>((bests, record) => {
    const value = Number(record.value);
    if (!Number.isFinite(value)) return bests;
    const current = bests[record.category];
    const lowerIsBetter = unitMap[record.category] === "秒" || unitMap[record.category] === "分";
    if (current === undefined || (lowerIsBetter ? value < current : value > current)) bests[record.category] = value;
    return bests;
  }, {});

  return {
    currentMonthRecordCount: (growthRecords ?? []).filter((record) => record.date.startsWith(currentMonth)).length,
    unreadCount: newsItems.filter((item) => item.unread).length,
    growthRecords: (growthRecords ?? []) as GrowthRecord[],
    personalBests,
    newsItems,
    latestScan: latestScan as DeferredData["latestScan"],
    latestAthleteScan,
  };
}

export async function MypageStats({ dataPromise }: { dataPromise: Promise<DeferredData> }) {
  const data = await dataPromise;
  return <>
    <Link href="/mypage/growth-report" className="border-r border-white/10 p-5 transition hover:bg-white/[.035] sm:p-7"><p className="text-[10px] font-black tracking-[.14em] text-white/30">THIS MONTH</p><strong className="mt-2 block text-3xl tracking-[-.04em]">{data.currentMonthRecordCount}<small className="ml-1 text-xs text-white/35">RECORDS</small></strong></Link>
    <a href="#news" className="p-5 transition hover:bg-white/[.035] sm:p-7"><p className="text-[10px] font-black tracking-[.14em] text-white/30">TO CHECK</p><strong className={`mt-2 block text-3xl tracking-[-.04em] ${data.unreadCount ? "text-orange-400" : ""}`}>{data.unreadCount}<small className="ml-1 text-xs text-white/35">ITEMS</small></strong></a>
  </>;
}

export async function LatestNewsSummary({ dataPromise }: { dataPromise: Promise<DeferredData> }) {
  const data = await dataPromise;
  const orderedItems = [...data.newsItems].sort(
    (a, b) =>
      Number(b.unread) - Number(a.unread) ||
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const latestItem = orderedItems[0];

  if (!latestItem) {
    return (
      <div className="rounded-2xl border border-white/[.07] bg-black/15 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-400">
            <Bell size={17}/>
          </span>
          <div>
            <p className="text-[9px] font-black tracking-[.2em] text-white/25">NEWS</p>
            <p className="mt-1 text-xs font-bold text-white/35">新しいお知らせはありません</p>
          </div>
        </div>
      </div>
    );
  }

  const unreadCount = orderedItems.filter((item) => item.unread).length;
  return (
    <Link
      href={latestItem.href ?? "#news-desktop"}
      className={`group block rounded-2xl border px-4 py-4 transition ${latestItem.unread ? "border-orange-400/30 bg-orange-400/[.07] hover:border-orange-300/50" : "border-white/[.07] bg-black/15 hover:border-white/20"}`}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${latestItem.unread ? "bg-orange-500/15 text-orange-300" : "bg-white/[.05] text-white/30"}`}>
          <Bell size={17}/>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-black tracking-[.2em] text-white/30">LATEST NEWS</span>
            {unreadCount > 0 ? <span className="shrink-0 rounded-full bg-orange-500/15 px-2 py-1 text-[9px] font-black text-orange-300">未読 {unreadCount}件</span> : null}
          </span>
          <strong className="mt-1.5 block truncate text-sm text-white/80">{latestItem.title}</strong>
          <span className="mt-1 flex items-center justify-between gap-3 text-[10px] text-white/30">
            <time>{new Date(latestItem.date).toLocaleDateString("ja-JP")}</time>
            <span className="inline-flex items-center gap-1 font-black text-orange-300/70">確認する<ChevronRight size={12} className="transition group-hover:translate-x-0.5"/></span>
          </span>
        </span>
      </div>
    </Link>
  );
}

export function MypageStatsSkeleton() {
  return <>{[0, 1].map((item) => <div key={item} className={`${item === 0 ? "border-r" : ""} border-white/10 p-5 sm:p-7`}><div className="h-2.5 w-20 animate-pulse rounded bg-white/10"/><div className="mt-3 h-8 w-14 animate-pulse rounded bg-white/10"/></div>)}</>;
}

export function MypageDeferredSkeleton() {
  return <div className="mt-5 space-y-6" aria-label="成長情報を読み込んでいます"><div className="h-52 animate-pulse rounded-3xl border border-orange-500/20 bg-[#111]"/><div className="grid grid-cols-2 gap-2.5 md:hidden"><div className="col-span-2 h-24 animate-pulse rounded-2xl bg-[#111]"/><div className="h-24 animate-pulse rounded-2xl bg-[#111]"/><div className="h-24 animate-pulse rounded-2xl bg-[#111]"/></div><div className="hidden gap-6 md:grid xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]"><div className="h-64 animate-pulse rounded-2xl bg-[#111]"/><div className="h-64 animate-pulse rounded-2xl bg-[#111]"/></div></div>;
}

export default async function MypageDeferredContent({
  dataPromise,
  userId,
  currentMonth,
  previousMonth,
}: {
  dataPromise: Promise<DeferredData>;
  userId: string;
  currentMonth: string;
  previousMonth: string;
}) {
  const data = await dataPromise;
  const { latestScan, latestAthleteScan } = data;
  return <>
    <div className="mt-5">
      <section data-tutorial="athlete-scan" className="overflow-hidden rounded-3xl border border-orange-500/50 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.2),transparent_42%),#111] p-5 text-white shadow-[0_14px_42px_rgba(0,0,0,.22)] lg:p-7">
        <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-black"><ScanLine size={24}/></span><div className="min-w-0 flex-1"><p className="text-[10px] font-black tracking-[.2em] text-orange-400">VAULTEX ATHLETE SCAN</p><h2 className="mt-1 text-xl font-black">身体能力の現在地を知る</h2><p className="mt-2 text-sm leading-6 text-white/50">CONTROL TESTから6能力・3特性・現在のATHLETE TYPEを確認します。</p></div></div>
        {latestScan ? <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-xs text-white/40">LATEST SCAN #{String(latestScan.scan_number).padStart(2,"0")} ・ {latestScan.measured_on}</p><p className="mt-1 text-lg font-black text-orange-300">{latestAthleteScan?.typeNameJa ?? "評価結果を確認"}</p>{latestAthleteScan?.typeCode ? <p className="mt-0.5 text-[10px] font-black tracking-[.12em] text-white/45">{latestAthleteScan.typeCode}</p> : null}</div><Sparkles className="shrink-0 text-orange-400" size={24}/></div><Link href={`/mypage/control-tests/${latestScan.id}`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black transition hover:bg-orange-400">ATHLETE SCAN結果を見る<ChevronRight size={17}/></Link></div> : <Link href="/mypage/control-tests/new" className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 font-black text-black transition hover:bg-orange-400"><Plus size={18}/>最初のVAULTEX SCANを記録</Link>}
        <Link href="/mypage/control-tests" className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-white/50 transition hover:text-orange-300">CONTROL TESTの履歴・詳細<ChevronRight size={14}/></Link>
      </section>
    </div>
    <section className="mt-5 md:hidden" aria-labelledby="mobile-review-menu">
      <div className="flex items-end justify-between gap-3 px-1">
        <div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">REVIEW &amp; RECORDS</p><h2 id="mobile-review-menu" className="mt-1 text-xl font-black">振り返りメニュー</h2></div>
        <span className="text-[10px] text-white/30">タップして開く</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <Link href="/mypage/growth-report" className="col-span-2 flex min-h-24 items-center gap-4 rounded-2xl border border-orange-400/35 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.18),transparent_48%),#111] px-4 text-white">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500 text-black"><BarChart3 size={21}/></span>
          <span className="min-w-0 flex-1"><span className="block text-[10px] font-black tracking-[.14em] text-orange-300">GROWTH REPORT</span><strong className="mt-1 block">成長レポートを見る</strong><span className="mt-1 block text-xs text-white/40">記録推移・PB・意識を振り返る</span></span>
          <ChevronRight size={18} className="shrink-0 text-orange-300"/>
        </Link>
        <Link href="/mypage/unofficial-athletics" className="flex min-h-24 flex-col justify-between rounded-2xl border border-white/10 bg-[#111] p-4 text-white"><Medal size={20} className="text-emerald-300"/><span><strong className="block text-sm">練習記録</strong><span className="mt-1 block text-[10px] text-white/35">意識・動画・振り返り</span></span></Link>
        <Link href="/mypage/athletics" className="flex min-h-24 flex-col justify-between rounded-2xl border border-white/10 bg-[#111] p-4 text-white"><Trophy size={20} className="text-orange-300"/><span><strong className="block text-sm">本番記録</strong><span className="mt-1 block text-[10px] text-white/35">大会記録・PB</span></span></Link>
        <Link href="/mypage/ranking" className="flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#111] px-4 text-sm font-black text-white">ランキング<ChevronRight size={17} className="text-white/25"/></Link>
        <Link href="/mypage/control-tests" className="flex min-h-20 items-center justify-between rounded-2xl border border-white/10 bg-[#111] px-4 text-sm font-black text-white">CONTROL TEST<ChevronRight size={17} className="text-white/25"/></Link>
      </div>
      <div id="news"><NewsPanel initialItems={data.newsItems} userId={userId}/></div>
    </section>
    <div className="mt-7 hidden items-start gap-6 md:grid xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,.65fr)]">
      <MonthlyGrowthReport records={data.growthRecords} personalBests={data.personalBests} currentMonth={currentMonth} previousMonth={previousMonth}/>
      <div id="news-desktop"><NewsPanel initialItems={data.newsItems} userId={userId}/></div>
    </div>
  </>;
}
