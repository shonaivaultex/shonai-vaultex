import Link from "next/link";
import DeleteRecordButton from "@/app/components/DeleteRecordButton";
import PerformanceChart from "@/app/components/PerformanceChart";
import TargetGoalEditor from "@/app/components/TargetGoalEditor";

type PerformanceRecord = {
  id: number;
  value: number | string;
  date: string;
  awareness_category?: string | null;
  awareness_note?: string | null;
  video_path?: string | null;
  video_url?: string | null;
};

type PerformanceEventCardProps = {
  category: string;
  unit: string;
  best: PerformanceRecord;
  records: PerformanceRecord[];
  target: number | null;
  userId: string;
};

function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}

function formatChange(value: number, unit: string) {
  const normalized = Math.abs(value) < 0.000001 ? 0 : value;
  const sign = normalized > 0 ? "+" : normalized < 0 ? "−" : "±";
  if (unit === "m") return `${sign}${round(Math.abs(normalized) * 100, 1)}cm`;
  return `${sign}${round(Math.abs(normalized))}${unit}`;
}

export default function PerformanceEventCard({
  category,
  unit,
  best,
  records,
  target,
  userId,
}: PerformanceEventCardProps) {
  const chronological = [...records].sort((a, b) => {
    const dateDifference = new Date(b.date).getTime() - new Date(a.date).getTime();
    return dateDifference || b.id - a.id;
  });
  const latest = chronological[0];
  const previous = chronological[1];
  const firstEver = chronological.at(-1)!;
  const latestChange = previous ? Number(latest.value) - Number(previous.value) : null;
  const currentYear = new Date().getFullYear();
  const yearlyRecords = chronological.filter((record) => new Date(`${record.date}T00:00:00`).getFullYear() === currentYear);
  const yearlyLatest = yearlyRecords[0];
  const yearlyFirst = yearlyRecords.at(-1);
  const yearlyChange = yearlyLatest && yearlyFirst ? Number(yearlyLatest.value) - Number(yearlyFirst.value) : null;
  const isTimeEvent = unit === "秒" || unit === "分";
  const bestValue = Number(best.value);
  const initialValue = Number(firstEver.value);
  const remaining = target === null ? null : isTimeEvent ? bestValue - target : target - bestValue;
  const progressSpan = target === null ? 0 : isTimeEvent ? initialValue - target : target - initialValue;
  const progressMade = isTimeEvent ? initialValue - bestValue : bestValue - initialValue;
  const progress = target === null
    ? null
    : remaining !== null && remaining <= 0
      ? 100
      : progressSpan > 0
        ? Math.max(0, Math.min(100, Math.round((progressMade / progressSpan) * 100)))
        : Math.max(0, Math.min(100, Math.round(isTimeEvent ? (target / bestValue) * 100 : (bestValue / target) * 100)));
  return (
    <article
      style={{
        marginBottom: 16,
        borderRadius: 20,
        background: "#111",
        border: "1px solid rgba(255, 122, 0, 0.75)",
        color: "white",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "22px 24px 18px" }}>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>{category}</p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/[0.045] p-4">
            <span className="block text-[11px] font-extrabold tracking-[0.12em] text-orange-400">PB</span>
            <strong className="mt-2 block text-2xl leading-none sm:text-3xl">
              {best.value}<span className="ml-1.5 text-sm text-white/60">{unit}</span>
            </strong>
          </div>
          <div className="rounded-xl bg-white/[0.045] p-4">
            <span className="mb-2 block text-[11px] font-extrabold tracking-[0.12em] text-orange-400">目標</span>
            <TargetGoalEditor category={category} initialTarget={target} unit={unit} userId={userId} />
          </div>
        </div>

        {target !== null && progress !== null && remaining !== null && (
          <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="m-0 text-xs text-white/50">目標まで</p>
                <strong className="mt-1 block text-lg text-orange-300">
                  {remaining <= 0 ? "目標達成" : `あと ${round(remaining)}${unit}`}
                </strong>
              </div>
              <strong className="text-xl">{progress}%</strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label={`${category}の目標達成率`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-300 transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-white/10 p-4">
            <p className="m-0 text-[11px] font-bold tracking-[0.08em] text-white/45">前回比</p>
            {latestChange === null ? (
              <strong className="mt-2 block text-base text-white/35">記録待ち</strong>
            ) : (
              <strong className={`mt-2 block text-xl ${latestChange > 0 ? "text-emerald-400" : latestChange < 0 ? "text-red-400" : "text-white/50"}`}>
                {formatChange(latestChange, unit)}
              </strong>
            )}
          </div>
          <div className="rounded-xl border border-white/10 p-4">
            <p className="m-0 text-[11px] font-bold tracking-[0.08em] text-white/45">年間成長</p>
            <strong className={`mt-2 block text-xl ${yearlyChange === null || yearlyChange === 0 ? "text-white/50" : yearlyChange > 0 ? "text-emerald-400" : "text-red-400"}`}>
              {currentYear} {yearlyChange === null ? "—" : formatChange(yearlyChange, unit)}
            </strong>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <PerformanceChart
            records={records.map((record) => ({
              date: record.date,
              value: Number(record.value),
            }))}
          />
        </div>
      </div>

      <details style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <summary
          style={{
            padding: "15px 24px",
            color: "#ff7a00",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 700,
            userSelect: "none",
          }}
        >
          履歴を見る（{records.length}件）
        </summary>

        <div style={{ padding: "0 24px 8px" }}>
          {records.map((record) => (
            <div
              key={record.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "16px 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <strong style={{ fontSize: 20 }}>
                  {record.value}
                  <span style={{ marginLeft: 4, fontSize: 13 }}>{unit}</span>
                </strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.55 }}>
                  {record.date}
                </p>
                {record.awareness_category && (
                  <span className="mt-2 inline-flex rounded-full border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-300">
                    {record.awareness_category}
                  </span>
                )}
                {record.awareness_note && (
                  <p className="mt-2 max-w-sm whitespace-pre-wrap text-sm leading-6 text-white/70">{record.awareness_note}</p>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link
                  href={`/edit/${record.id}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 36,
                    padding: "0 13px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "#1a1a1a",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 14,
                  }}
                >
                  編集
                </Link>
                <DeleteRecordButton recordId={record.id} videoPath={record.video_path} compact />
              </div>
            </div>
          ))}
        </div>
      </details>

      <details style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <summary className="cursor-pointer select-none px-6 py-4 text-sm font-bold text-orange-400">
          動画を見る（{records.filter((record) => record.video_url).length}件）
        </summary>
        <div className="space-y-5 px-6 pb-6">
          {records.some((record) => record.video_url) ? records.filter((record) => record.video_url).map((record) => (
            <div key={record.id} className="border-t border-white/10 pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <strong>{record.value}{unit}</strong>
                <span className="text-xs text-white/50">{record.date}</span>
              </div>
              <video controls preload="metadata" playsInline className="w-full rounded-xl bg-black" src={record.video_url ?? undefined}>
                お使いのブラウザは動画再生に対応していません。
              </video>
            </div>
          )) : <p className="border-t border-white/10 pt-5 text-sm text-white/45">動画付きの記録はまだありません。</p>}
        </div>
      </details>
    </article>
  );
}
