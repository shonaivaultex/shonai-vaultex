import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import PerformanceEventCard from "@/app/components/PerformanceEventCard";
import { createClient } from "@/lib/supabase-server";
import { eventKindMap, type PerformanceKind, unitMap } from "@/lib/performance-events";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";
import SeasonSelector from "@/app/components/SeasonSelector";

type Props = {
  kind: PerformanceKind;
  title: string;
  eyebrow: string;
  description: string;
  selectedYear?: number | null;
  focusRecordId?: number | null;
};

type FeedbackRow = { id: number; record_id: number; coach_id: string; body: string; created_at: string; acknowledged_at: string | null };
type LeaderboardRow = { ranking_scope: "overall" | "class"; leaderboard_position: number; display_name: string; best_value: number | string; is_current_user: boolean };

export default async function PerformanceRecordsPage({ kind, title, eyebrow, description, selectedYear = null, focusRecordId = null }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>ログインしてください</div>;

  const { data: records, error } = await supabase
    .from("performance_records")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) console.error("RECORD ERROR", error);

  const recordIds = (records ?? []).map((record) => record.id);
  const { data: requestRows } = recordIds.length ? await supabase.from("feedback_requests").select("id, record_id, request_type, message, priority, status").in("record_id", recordIds).eq("status", "pending") : { data: [] };
  const requestByRecord = new Map((requestRows ?? []).map((item) => [item.record_id, item]));
  const { data: feedbackRows } = recordIds.length
    ? await supabase.from("coach_feedback").select("id, record_id, coach_id, body, created_at, acknowledged_at").in("record_id", recordIds).order("created_at", { ascending: false })
    : { data: [] };
  const coachIds = [...new Set((feedbackRows ?? []).map((item) => item.coach_id))];
  const { data: coaches } = coachIds.length
    ? await supabase.from("players").select("user_id, name").in("user_id", coachIds)
    : { data: [] };
  const coachNames = new Map((coaches ?? []).map((coach) => [coach.user_id, coach.name]));
  const feedbackByRecord = ((feedbackRows ?? []) as FeedbackRow[]).reduce<Record<number, Array<FeedbackRow & { coach_name: string }>>>((groups, item) => {
    (groups[item.record_id] ??= []).push({ ...item, coach_name: coachNames.get(item.coach_id) ?? "VAULTEXコーチ" });
    return groups;
  }, {});

  const { data: goals, error: goalsError } = await supabase
    .from("performance_goals")
    .select("category, target_value")
    .eq("user_id", user.id);

  if (goalsError) console.error("GOAL ERROR", goalsError);
  const goalsByCategory = new Map(
    (goals ?? []).map((goal) => [goal.category, Number(goal.target_value)]),
  );

  const recordsWithVideoUrls = await Promise.all((records ?? []).map(async (record) => {
    if (!record.video_path) return { ...record, video_url: null, coach_feedback: feedbackByRecord[record.id] ?? [], feedback_request: requestByRecord.get(record.id) ?? null };
    const { data } = await supabase.storage
      .from(PERFORMANCE_VIDEO_BUCKET)
      .createSignedUrl(record.video_path, 60 * 60);
    return { ...record, video_url: data?.signedUrl ?? null, coach_feedback: feedbackByRecord[record.id] ?? [], feedback_request: requestByRecord.get(record.id) ?? null };
  }));

  const recordsForKind = recordsWithVideoUrls.filter((record) =>
    (record.record_kind ?? eventKindMap[record.category] ?? "control-test") === kind,
  );
  const availableYears = [...new Set(recordsForKind.map((record) => new Date(`${record.date}T00:00:00`).getFullYear()))]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  const safeRecords = recordsForKind.filter((record) => {
    const recordYear = new Date(`${record.date}T00:00:00`).getFullYear();
    return selectedYear === null || recordYear === selectedYear;
  });
  const recordsByCategory = safeRecords.reduce<Record<string, typeof safeRecords>>((groups, record) => {
    (groups[record.category] ??= []).push(record);
    return groups;
  }, {});

  const eventGroups = await Promise.all(Object.entries(recordsByCategory).map(async ([category, categoryRecords]) => {
    const isTimeEvent = ["秒", "分"].includes(unitMap[category]);
    const best = categoryRecords.reduce((currentBest, record) => {
      const value = Number(record.value);
      const bestValue = Number(currentBest.value);
      return isTimeEvent ? (value < bestValue ? record : currentBest) : (value > bestValue ? record : currentBest);
    });
    const { data: ranking } = await supabase.rpc("get_performance_rankings", {
      p_category: category,
      p_record_kind: kind,
      p_year: selectedYear,
    }).maybeSingle();
    const { data: leaderboard } = await supabase.rpc("get_performance_leaderboard", {
      p_category: category,
      p_record_kind: kind,
      p_year: selectedYear,
    });
    return {
      category,
      records: categoryRecords,
      best,
      ranking: ranking as { overall_rank: number; overall_total: number; overall_top_percent: number; class_rank: number | null; class_total: number | null; class_top_percent: number | null; program_class: string | null } | null,
      leaderboard: (leaderboard ?? []) as LeaderboardRow[],
    };
  }));
  const renderEventCard = ({ category, records: eventRecords, best, ranking, leaderboard }: (typeof eventGroups)[number]) => (
    <PerformanceEventCard
      key={category}
      category={category}
      unit={unitMap[category] ?? ""}
      best={best}
      records={eventRecords}
      target={goalsByCategory.get(category) ?? null}
      userId={user.id}
      scopeLabel={selectedYear === null ? "PB" : "SB"}
      ranking={ranking}
      leaderboard={leaderboard}
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
        <SeasonSelector years={availableYears} selectedYear={selectedYear} />
        <Link href={`/performance?kind=${kind}`} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black tracking-[0.12em] transition hover:bg-orange-400 lg:ml-auto lg:w-fit lg:min-w-56">
          <Plus size={18} aria-hidden="true" /> 記録を追加
        </Link>

        {eventGroups.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/55">まだ記録がありません</div>
        ) : (
          <>
            <div className="mt-10 lg:hidden">{eventGroups.map(renderEventCard)}</div>
            <div className="mt-10 hidden gap-5 lg:grid lg:grid-cols-3">{eventGroups.map(renderEventCard)}</div>
          </>
        )}

        <Link href={`/performance?kind=${kind}`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black tracking-[0.12em] transition hover:bg-orange-400">
          <Plus size={18} aria-hidden="true" /> 記録を追加
        </Link>
      </div>
    </main>
  );
}
