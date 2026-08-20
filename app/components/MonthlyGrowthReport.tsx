import { ArrowRight, BarChart3, Sparkles, Target, Trophy } from "lucide-react";
import Link from "next/link";
import { unitMap } from "@/lib/performance-events";

export type GrowthRecord = {
  id: number;
  category: string;
  value: number | string;
  date: string;
  awareness_category?: string | null;
  awareness_categories?: string[] | null;
};

type Props = {
  records: GrowthRecord[];
  personalBests: Record<string, number>;
  currentMonth: string;
  previousMonth: string;
};

const timeUnits = new Set(["秒", "分"]);

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatValue(value: number, unit: string) {
  const digits = unit === "点" || unit === "kg" ? 1 : 2;
  return `${Number(value.toFixed(digits))}${unit}`;
}

function monthLabel(month: string) {
  const [, monthNumber] = month.split("-");
  return `${Number(monthNumber)}月`;
}

export default function MonthlyGrowthReport({ records, personalBests, currentMonth, previousMonth }: Props) {
  const currentRecords = records.filter((record) => record.date.startsWith(currentMonth));
  const previousRecords = records.filter((record) => record.date.startsWith(previousMonth));
  const categories = [...new Set(currentRecords.map((record) => record.category))];

  const tagCounts = new Map<string, number>();
  currentRecords.forEach((record) => {
    const tags = record.awareness_categories?.length
      ? record.awareness_categories
      : record.awareness_category
        ? [record.awareness_category]
        : [];
    tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  });
  const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  const summaries = categories
    .map((category) => {
      const unit = unitMap[category] ?? "";
      const current = currentRecords.filter((record) => record.category === category);
      const previous = previousRecords.filter((record) => record.category === category);
      const currentValues = current.map((record) => Number(record.value)).filter(Number.isFinite);
      const previousValues = previous.map((record) => Number(record.value)).filter(Number.isFinite);
      if (!currentValues.length) return null;

      const lowerIsBetter = timeUnits.has(unit);
      const best = lowerIsBetter ? Math.min(...currentValues) : Math.max(...currentValues);
      const currentAverage = average(currentValues);
      const previousAverage = previousValues.length ? average(previousValues) : null;
      const rawChange = previousAverage === null ? null : currentAverage - previousAverage;
      const improved = rawChange === null ? null : lowerIsBetter ? rawChange < 0 : rawChange > 0;
      const personalBest = personalBests[category];
      const gapToPb = personalBest === undefined ? null : lowerIsBetter ? best - personalBest : personalBest - best;
      const relativeGap = gapToPb === null || personalBest === 0 ? Number.POSITIVE_INFINITY : Math.abs(gapToPb / personalBest);

      return { category, unit, count: currentValues.length, best, rawChange, improved, personalBest, gapToPb, relativeGap };
    })
    .filter((summary): summary is NonNullable<typeof summary> => summary !== null)
    .sort((a, b) => b.count - a.count);
  const highlight = summaries.find((summary) => summary.improved) ?? summaries[0];
  const closestToPb = [...summaries].filter((summary) => summary.personalBest !== undefined).sort((a, b) => a.relativeGap - b.relativeGap)[0] ?? highlight;
  const needsMoreRecords = summaries.find((summary) => summary.count < 3);
  const nextStep = needsMoreRecords
    ? `${needsMoreRecords.category}をあと${3 - needsMoreRecords.count}件記録すると、変化の安定度も確認できます。`
    : topTag
      ? `次の練習でも「${topTag[0]}」を残して、感覚と結果のつながりを比べてみよう。`
      : "次の練習では、意識したことか動画を1つ残して振り返りの材料を増やそう。";

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-orange-500/35 bg-[#111] text-white">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] text-orange-400">MONTHLY GROWTH</p>
          <h2 className="mt-1 text-xl font-black">{monthLabel(currentMonth)}の成長レポート</h2>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><BarChart3 size={21} /></span>
      </div>

      {currentRecords.length === 0 ? (
        <div className="px-5 py-7 text-center">
          <strong className="block">今月の記録はまだありません</strong>
          <p className="mt-2 text-sm text-white/45">記録を追加すると、自動で成長を分析します。</p>
        </div>
      ) : (
        <div className="p-5">
          <div className="rounded-2xl border border-orange-500/30 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.2),transparent_45%),rgba(249,115,22,.06)] p-5">
            <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-black tracking-[.16em] text-orange-300">MONTH&apos;S HIGHLIGHT</span><h3 className="mt-2 text-xl font-black">{highlight?.category} 今月ベスト</h3><strong className="mt-2 block text-4xl tracking-[-.05em] text-white">{highlight ? formatValue(highlight.best, highlight.unit) : "—"}</strong></div><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-500 text-black"><Trophy size={21}/></span></div>
            <p className="mt-4 text-sm leading-6 text-white/55">{highlight?.improved && highlight.rawChange !== null ? `${monthLabel(previousMonth)}の平均より${formatValue(Math.abs(highlight.rawChange), highlight.unit)}前進しました。` : `${currentRecords.length}件・${categories.length}種目の記録を残しました。`}</p>
            {topTag ? <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-orange-200"><Sparkles size={14}/>よく使った意識は「{topTag[0]}」</p> : null}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><div className="flex items-center gap-2 text-[10px] font-black tracking-[.14em] text-emerald-300"><Target size={15}/>PB CHASE</div>{closestToPb ? <><h3 className="mt-3 font-black">{closestToPb.category}</h3>{closestToPb.gapToPb !== null && Math.abs(closestToPb.gapToPb) < 0.000001 ? <strong className="mt-2 block text-xl text-emerald-300">今月PBに到達</strong> : <><strong className="mt-2 block text-xl">PBまであと {closestToPb.gapToPb === null ? "—" : formatValue(Math.abs(closestToPb.gapToPb), closestToPb.unit)}</strong><p className="mt-1 text-xs text-white/35">PB {closestToPb.personalBest === undefined ? "未登録" : formatValue(closestToPb.personalBest, closestToPb.unit)}</p></>}</> : <p className="mt-3 text-sm text-white/40">比較できる記録を待っています</p>}</article>
            <article className="rounded-2xl border border-sky-400/15 bg-sky-400/[.04] p-5"><div className="text-[10px] font-black tracking-[.14em] text-sky-300">NEXT STEP</div><p className="mt-3 text-sm font-bold leading-6 text-white/70">{nextStep}</p><Link href="/mypage/my-calendar" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-sky-300">マイカレンダーを開く<ArrowRight size={14}/></Link></article>
          </div>
          <Link href="/mypage/growth-report" className="mt-5 flex items-center justify-center rounded-xl border border-orange-500/35 bg-orange-500/[0.08] px-4 py-3 text-sm font-black text-orange-300 transition hover:bg-orange-500/[0.14]">全期間の成長レポートを見る</Link>
        </div>
      )}
      {currentRecords.length === 0 && <div className="border-t border-white/10 px-5 pb-5"><Link href="/mypage/growth-report" className="flex items-center justify-center rounded-xl border border-orange-500/35 bg-orange-500/[0.08] px-4 py-3 text-sm font-black text-orange-300">全期間の成長レポートを見る</Link></div>}
    </section>
  );
}
