import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import PerformanceEventCard from "@/app/components/PerformanceEventCard";
import { createClient } from "@/lib/supabase-server";
import { eventKindMap, isWindLegalForRanking, type PerformanceKind, unitMap } from "@/lib/performance-events";
import SeasonSelector from "@/app/components/SeasonSelector";
import PerformanceRankingPanel, { PerformanceRankingSkeleton } from "@/app/components/PerformanceRankingPanel";
import { Suspense, type ReactNode } from "react";

type Props = {
  kind: PerformanceKind;
  title: string;
  eyebrow: string;
  description: string;
  selectedYear?: number | null;
  focusRecordId?: number | null;
  beforeRecords?: ReactNode;
  addHref?: string;
  addLabel?: string;
};

type FeedbackRow = { id: number; record_id: number; coach_id: string; body: string; created_at: string; acknowledged_at: string | null };
export default async function PerformanceRecordsPage({ kind, title, eyebrow, description, selectedYear = null, focusRecordId = null, beforeRecords, addHref, addLabel = "記録を追加" }: Props) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;

  if (!userId) return <div>ログインしてください</div>;

  const recordsQuery = supabase
    .from("performance_records")
    .select("id, category, value, wind_speed, date, record_kind, awareness_category, awareness_categories, awareness_note, video_path")
    .eq("user_id", userId)
    .or(`record_kind.eq.${kind},record_kind.is.null`)
    .order("date", { ascending: false });

  if (selectedYear !== null) {
    recordsQuery
      .gte("date", `${selectedYear}-01-01`)
      .lte("date", `${selectedYear}-12-31`);
  }

  const [{ data: records, error }, { data: yearRows }, { data: goals, error: goalsError }] = await Promise.all([
    recordsQuery,
    supabase
      .from("performance_records")
      .select("date, category, record_kind")
      .eq("user_id", userId)
      .or(`record_kind.eq.${kind},record_kind.is.null`)
      .order("date", { ascending: false }),
    supabase
      .from("performance_goals")
      .select("category, target_value")
      .eq("user_id", userId),
  ]);

  if (error) console.error("RECORD ERROR", error);

  const recordIds = (records ?? []).map((record) => record.id);
  const [{ data: requestRows }, { data: feedbackRows }] = recordIds.length ? await Promise.all([
    supabase.from("feedback_requests").select("id, record_id, request_type, message, priority, status").in("record_id", recordIds).eq("status", "pending"),
    supabase.from("coach_feedback").select("id, record_id, coach_id, body, created_at, acknowledged_at").in("record_id", recordIds).order("created_at", { ascending: false }),
  ]) : [{ data: [] }, { data: [] }];
  const requestByRecord = new Map((requestRows ?? []).map((item) => [item.record_id, item]));
  const coachIds = [...new Set((feedbackRows ?? []).map((item) => item.coach_id))];
  const { data: coaches } = coachIds.length
    ? await supabase.from("players").select("user_id, name").in("user_id", coachIds)
    : { data: [] };
  const coachNames = new Map((coaches ?? []).map((coach) => [coach.user_id, coach.name]));
  const feedbackByRecord = ((feedbackRows ?? []) as FeedbackRow[]).reduce<Record<number, Array<FeedbackRow & { coach_name: string }>>>((groups, item) => {
    (groups[item.record_id] ??= []).push({ ...item, coach_name: coachNames.get(item.coach_id) ?? "VAULTEXコーチ" });
    return groups;
  }, {});

  if (goalsError) console.error("GOAL ERROR", goalsError);
  const goalsByCategory = new Map(
    (goals ?? []).map((goal) => [goal.category, Number(goal.target_value)]),
  );

  const recordsWithDetails = (records ?? []).filter((record) =>
    (record.record_kind ?? eventKindMap[record.category] ?? "control-test") === kind,
  ).map((record) => ({
    ...record,
    coach_feedback: feedbackByRecord[record.id] ?? [],
    feedback_request: requestByRecord.get(record.id) ?? null,
  }));

  const availableYears = [...new Set((yearRows ?? []).filter((record) =>
    (record.record_kind ?? eventKindMap[record.category] ?? "control-test") === kind,
  ).map((record) => new Date(`${record.date}T00:00:00`).getFullYear()))]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  const safeRecords = recordsWithDetails;
  const recordsByCategory = safeRecords.reduce<Record<string, typeof safeRecords>>((groups, record) => {
    (groups[record.category] ??= []).push(record);
    return groups;
  }, {});

  const eventGroups = Object.entries(recordsByCategory).map(([category, categoryRecords]) => {
    const isTimeEvent = ["秒", "分"].includes(unitMap[category]);
    const rankingEligibleRecords = categoryRecords.filter((record) => isWindLegalForRanking(category, record.wind_speed));
    const bestPool = rankingEligibleRecords.length ? rankingEligibleRecords : categoryRecords;
    const best = bestPool.reduce((currentBest, record) => {
      const value = Number(record.value);
      const bestValue = Number(currentBest.value);
      return isTimeEvent ? (value < bestValue ? record : currentBest) : (value > bestValue ? record : currentBest);
    });
    return {
      category,
      records: categoryRecords,
      best,
      scopeLabel: (rankingEligibleRecords.length ? (selectedYear === null ? "PB" : "SB") : "参考最高") as "PB" | "SB" | "参考最高",
    };
  });
  const renderEventCard = ({ category, records: eventRecords, best, scopeLabel }: (typeof eventGroups)[number]) => (
    <PerformanceEventCard
      key={category}
      category={category}
      unit={unitMap[category] ?? ""}
      best={best}
      records={eventRecords}
      target={goalsByCategory.get(category) ?? null}
      userId={userId}
      scopeLabel={scopeLabel}
      rankingContent={<Suspense fallback={<PerformanceRankingSkeleton/>}><PerformanceRankingPanel category={category} kind={kind} selectedYear={selectedYear} bestValue={Number(best.value)} unit={unitMap[category] ?? ""}/></Suspense>}
      focusRecordId={focusRecordId}
    />
  );

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8">
      <div className="mx-auto max-w-xl lg:max-w-7xl">
        <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 transition hover:text-orange-400">
          <ArrowLeft size={16} aria-hidden="true" /> MY PAGE
        </Link>
        <header className="mt-10 border-l-2 border-orange-500 pl-5">
          <p className="text-xs font-black tracking-[0.22em] text-orange-400">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-3 leading-7 text-white/60">{description}</p>
        </header>
        {beforeRecords}
        <SeasonSelector years={availableYears} selectedYear={selectedYear} />
        <Link href={addHref ?? `/performance?kind=${kind}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black tracking-[0.12em] transition hover:bg-orange-400 lg:ml-auto lg:w-fit lg:min-w-56">
          <Plus size={18} aria-hidden="true" /> {addLabel}
        </Link>

        {eventGroups.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/55">まだ記録がありません</div>
        ) : (
          <div className="mt-10 grid gap-5 lg:grid-cols-3">{eventGroups.map(renderEventCard)}</div>
        )}

        <Link href={addHref ?? `/performance?kind=${kind}`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black tracking-[0.12em] transition hover:bg-orange-400">
          <Plus size={18} aria-hidden="true" /> {addLabel}
        </Link>
      </div>
    </main>
  );
}
