import { Award, CalendarRange, Sparkles, Target, TrendingUp } from "lucide-react";
import { eventKindMap, unitMap, type PerformanceKind } from "@/lib/performance-events";
import type { GrowthRecord } from "@/app/components/MonthlyGrowthReport";

type RecordWithKind = GrowthRecord & { record_kind?: PerformanceKind | null };
const timeUnits = new Set(["秒", "分"]);
const kindLabels: Record<PerformanceKind, string> = {
  athletics: "本番記録",
  "unofficial-athletics": "練習記録",
  "control-test": "コントロールテスト",
};

function formatValue(value: number, unit: string) {
  const digits = unit === "点" || unit === "kg" ? 1 : 2;
  return `${Number(value.toFixed(digits))}${unit}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
}

export default function OverallGrowthReport({ records }: { records: RecordWithKind[] }) {
  const ordered = [...records].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);
  const groups = new Map<string, { kind: PerformanceKind; category: string; records: RecordWithKind[] }>();
  const tagCounts = new Map<string, number>();

  ordered.forEach((record) => {
    const kind = record.record_kind ?? eventKindMap[record.category] ?? "control-test";
    const key = `${kind}:${record.category}`;
    const group = groups.get(key) ?? { kind, category: record.category, records: [] };
    group.records.push(record);
    groups.set(key, group);
    const tags = record.awareness_categories?.length ? record.awareness_categories : record.awareness_category ? [record.awareness_category] : [];
    tags.forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1));
  });

  const topTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
  let pbUpdates = 0;
  const summaries = [...groups.values()].map((group) => {
    const values = group.records.map((record) => Number(record.value)).filter(Number.isFinite);
    const unit = unitMap[group.category] ?? "";
    const lowerIsBetter = timeUnits.has(unit);
    let runningBest = values[0];
    values.slice(1).forEach((value) => {
      if (lowerIsBetter ? value < runningBest : value > runningBest) {
        runningBest = value;
        pbUpdates += 1;
      }
    });
    const first = values[0];
    const best = lowerIsBetter ? Math.min(...values) : Math.max(...values);
    const growth = lowerIsBetter ? first - best : best - first;
    const growthPercent = first === 0 ? 0 : (growth / Math.abs(first)) * 100;
    return { ...group, unit, first, best, growth, growthPercent };
  }).sort((a, b) => b.records.length - a.records.length);

  const firstDate = ordered[0]?.date;
  const lastDate = ordered.at(-1)?.date;

  if (!ordered.length) return <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center text-white/55">記録を追加すると、全期間の成長を自動で分析します。</div>;

  return <>
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Summary icon={<Target size={18} />} label="累計記録" value={`${ordered.length}件`} note={`${groups.size}種目`} />
      <Summary icon={<Award size={18} />} label="自己ベスト更新" value={`${pbUpdates}回`} note="初回記録を除く" />
      <Summary icon={<Sparkles size={18} />} label="最も多い意識" value={topTag?.[0] ?? "記録待ち"} note={topTag ? `${topTag[1]}件で選択` : "意識タグを追加"} />
      <Summary icon={<CalendarRange size={18} />} label="記録期間" value={firstDate && lastDate ? `${formatDate(firstDate)}〜` : "—"} note={lastDate ? `最新 ${formatDate(lastDate)}` : ""} />
    </div>

    {(Object.keys(kindLabels) as PerformanceKind[]).map((kind) => {
      const items = summaries.filter((summary) => summary.kind === kind);
      if (!items.length) return null;
      return <section key={kind} className="mt-7">
        <div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-black tracking-[0.18em] text-orange-400">{kind.toUpperCase()}</p><h2 className="mt-1 text-xl font-black">{kindLabels[kind]}</h2></div><span className="text-xs text-white/35">{items.reduce((sum, item) => sum + item.records.length, 0)}件</span></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => <article key={`${kind}-${item.category}`} className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <div className="flex items-center justify-between gap-3"><strong className="text-lg">{item.category}</strong><span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/45">{item.records.length}件</span></div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Metric label="開始記録" value={formatValue(item.first, item.unit)} />
              <Metric label="最高記録" value={formatValue(item.best, item.unit)} highlight />
              <Metric label="全期間の伸び" value={`${item.growth > 0 ? "+" : "±"}${formatValue(item.growth, item.unit)}`} highlight={item.growth > 0} />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs"><span className="text-white/40">成長率</span><strong className={item.growth > 0 ? "flex items-center gap-1 text-emerald-400" : "text-white/45"}>{item.growth > 0 && <TrendingUp size={14} />} {item.growthPercent > 0 ? "+" : ""}{item.growthPercent.toFixed(1)}%</strong></div>
          </article>)}
        </div>
      </section>;
    })}
    <p className="mt-7 text-xs leading-6 text-white/35">本番・練習・コントロールテストは別々に集計しています。タイム種目は数値が小さくなるほど成長、それ以外は数値が大きくなるほど成長として計算しています。</p>
  </>;
}

function Summary({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <div className="rounded-2xl border border-orange-500/25 bg-[#111] p-4"><span className="text-orange-400">{icon}</span><span className="mt-3 block text-xs text-white/40">{label}</span><strong className="mt-1 block text-lg">{value}</strong><small className="mt-1 block text-[10px] text-white/30">{note}</small></div>;
}

function Metric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return <div className="min-w-0 rounded-xl bg-white/[0.04] p-3"><span className="block text-[10px] text-white/40">{label}</span><strong className={`mt-1 block truncate text-sm ${highlight ? "text-orange-300" : ""}`}>{value}</strong></div>;
}
