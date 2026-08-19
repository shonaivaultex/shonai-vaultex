import { createClient } from "@/lib/supabase-server";
import type { PerformanceKind } from "@/lib/performance-events";

type Ranking = { overall_rank: number; overall_total: number; overall_top_percent: number; class_rank: number | null; class_total: number | null; class_top_percent: number | null; program_class: string | null; gender: "male" | "female" };
type LeaderboardRow = { ranking_scope: "overall" | "class"; leaderboard_position: number; display_name: string; best_value: number | string; is_current_user: boolean };

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function Leaderboard({ title, rows, unit }: { title: string; rows: LeaderboardRow[]; unit: string }) {
  return <div><p className="text-[10px] font-black tracking-[.12em] text-white/40">{title}</p><ol className="mt-2 space-y-1.5">{rows.slice(0, 3).map((item) => <li key={`${item.ranking_scope}-${item.leaderboard_position}`} className={`flex items-center justify-between gap-3 text-xs ${item.is_current_user ? "text-orange-300" : "text-white/65"}`}><span><b className="mr-2 text-white/35">{item.leaderboard_position}</b>{item.display_name}</span><strong>{item.best_value}{unit}</strong></li>)}</ol></div>;
}

export function PerformanceRankingSkeleton() {
  return <div className="mt-4 h-32 animate-pulse rounded-xl border border-white/10 bg-white/[0.025]" aria-label="ランキングを読み込んでいます"/>;
}

export default async function PerformanceRankingPanel({ category, kind, selectedYear, bestValue, unit }: { category: string; kind: PerformanceKind; selectedYear: number | null; bestValue: number; unit: string }) {
  const supabase = await createClient();
  const [{ data: rankingData }, { data: leaderboardData }] = await Promise.all([
    supabase.rpc("get_performance_rankings", { p_category: category, p_record_kind: kind, p_year: selectedYear }).maybeSingle(),
    supabase.rpc("get_performance_leaderboard", { p_category: category, p_record_kind: kind, p_year: selectedYear }),
  ]);
  const ranking = rankingData as Ranking | null;
  const leaderboard = (leaderboardData ?? []) as LeaderboardRow[];
  if (!ranking) return null;
  const overallLeaders = leaderboard.filter((item) => item.ranking_scope === "overall");
  const classLeaders = leaderboard.filter((item) => item.ranking_scope === "class");
  const thirdPlace = overallLeaders.find((item) => item.leaderboard_position === 3);
  const differenceToThird = thirdPlace && ranking.overall_rank > 3 ? Math.abs(Number(thirdPlace.best_value) - bestValue) : null;

  return <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
    <p className="m-0 text-[11px] font-bold tracking-[0.08em] text-white/45">VAULTEX {ranking.gender === "female" ? "女子" : "男子"}ランキング</p>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div><span className="block text-xs text-white/45">全体</span><strong className="mt-1 block text-base text-orange-300">{ranking.overall_rank}位／{ranking.overall_total}人</strong><span className="text-xs text-white/50">上位{Math.max(1, Math.ceil(ranking.overall_top_percent))}%</span></div>
      <div><span className="block text-xs text-white/45">{ranking.program_class ?? "クラス未選択"}</span>{ranking.class_rank !== null && ranking.class_total !== null && ranking.class_top_percent !== null ? <><strong className="mt-1 block text-base text-orange-300">{ranking.class_rank}位／{ranking.class_total}人</strong><span className="text-xs text-white/50">上位{Math.max(1, Math.ceil(ranking.class_top_percent))}%</span></> : <strong className="mt-1 block text-sm text-white/35">プロフィールで選択</strong>}</div>
    </div>
    {leaderboard.length > 0 ? <div className="mt-4 grid gap-4 border-t border-white/10 pt-4 sm:grid-cols-2"><Leaderboard title={`${ranking.gender === "female" ? "女子" : "男子"} 全体 TOP 3`} rows={overallLeaders} unit={unit}/><Leaderboard title={`${ranking.program_class ?? "クラス"} TOP 3`} rows={classLeaders} unit={unit}/></div> : null}
    {differenceToThird !== null ? <p className="mt-4 rounded-lg bg-orange-500/10 px-3 py-2 text-xs text-orange-200">3位まであと <strong>{round(differenceToThird)}{unit}</strong></p> : null}
  </div>;
}
