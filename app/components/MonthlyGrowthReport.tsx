import { BarChart3, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
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

export default function MonthlyGrowthReport({ records, currentMonth, previousMonth }: Props) {
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
      const spread = currentValues.length >= 3 && currentAverage !== 0
        ? (Math.max(...currentValues) - Math.min(...currentValues)) / Math.abs(currentAverage)
        : null;
      const stability = spread === null ? "3件から判定" : spread <= 0.02 ? "安定" : spread <= 0.06 ? "やや変動" : "変動あり";

      return { category, unit, count: currentValues.length, best, rawChange, improved, stability };
    })
    .filter((summary): summary is NonNullable<typeof summary> => summary !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

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
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.045] p-4"><span className="text-xs text-white/45">今月の記録</span><strong className="mt-1 block text-2xl">{currentRecords.length}<small className="ml-1 text-xs text-white/45">件・{categories.length}種目</small></strong></div>
            <div className="rounded-xl bg-white/[0.045] p-4"><span className="text-xs text-white/45">よく使った意識</span><strong className="mt-2 flex items-center gap-1.5 text-base text-orange-300"><Sparkles size={15} />{topTag ? topTag[0] : "記録待ち"}</strong>{topTag && <small className="mt-1 block text-[10px] text-white/35">{topTag[1]}件で選択</small>}</div>
          </div>

          <div className="mt-4 space-y-3">
            {summaries.map((summary) => (
              <article key={summary.category} className="rounded-xl border border-white/10 p-4">
                <div className="flex items-center justify-between gap-3"><strong>{summary.category}</strong><span className="text-xs text-white/35">{summary.count}件</span></div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div><span className="block text-[10px] text-white/40">今月ベスト</span><strong className="mt-1 block">{formatValue(summary.best, summary.unit)}</strong></div>
                  <div><span className="block text-[10px] text-white/40">{monthLabel(previousMonth)}平均比</span>{summary.rawChange === null ? <strong className="mt-1 block text-xs text-white/35">比較待ち</strong> : <strong className={`mt-1 flex items-center gap-1 ${summary.improved ? "text-emerald-400" : "text-red-400"}`}>{summary.improved ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{summary.rawChange > 0 ? "+" : ""}{formatValue(summary.rawChange, summary.unit)}</strong>}</div>
                  <div><span className="block text-[10px] text-white/40">安定度</span><strong className="mt-1 block text-xs">{summary.stability}</strong></div>
                </div>
              </article>
            ))}
          </div>
          {categories.length > summaries.length && <p className="mt-3 text-center text-[11px] text-white/35">記録数の多い3種目を表示しています</p>}
          <p className="mt-4 text-[11px] leading-5 text-white/35">前月比は月ごとの平均記録を比較しています。記録が少ない項目は参考値としてご覧ください。</p>
          <Link href="/mypage/growth-report" className="mt-5 flex items-center justify-center rounded-xl border border-orange-500/35 bg-orange-500/[0.08] px-4 py-3 text-sm font-black text-orange-300 transition hover:bg-orange-500/[0.14]">全期間の成長レポートを見る</Link>
        </div>
      )}
      {currentRecords.length === 0 && <div className="border-t border-white/10 px-5 pb-5"><Link href="/mypage/growth-report" className="flex items-center justify-center rounded-xl border border-orange-500/35 bg-orange-500/[0.08] px-4 py-3 text-sm font-black text-orange-300">全期間の成長レポートを見る</Link></div>}
    </section>
  );
}
