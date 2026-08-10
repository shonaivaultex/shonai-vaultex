import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import PerformanceEventCard from "@/app/components/PerformanceEventCard";
import { createClient } from "@/lib/supabase-server";
import { eventKindMap, type PerformanceKind, unitMap } from "@/lib/performance-events";

type Props = {
  kind: PerformanceKind;
  title: string;
  eyebrow: string;
  description: string;
};

export default async function PerformanceRecordsPage({ kind, title, eyebrow, description }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div>ログインしてください</div>;

  const { data: records, error } = await supabase
    .from("performance_records")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  if (error) console.error("RECORD ERROR", error);

  const safeRecords = (records ?? []).filter(
    (record) => (eventKindMap[record.category] ?? "control-test") === kind,
  );
  const recordsByCategory = safeRecords.reduce<Record<string, typeof safeRecords>>((groups, record) => {
    (groups[record.category] ??= []).push(record);
    return groups;
  }, {});

  const eventGroups = Object.entries(recordsByCategory).map(([category, categoryRecords]) => {
    const isTimeEvent = ["秒", "分"].includes(unitMap[category]);
    const best = categoryRecords.reduce((currentBest, record) => {
      const value = Number(record.value);
      const bestValue = Number(currentBest.value);
      return isTimeEvent ? (value < bestValue ? record : currentBest) : (value > bestValue ? record : currentBest);
    });
    return { category, records: categoryRecords, best };
  });

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 transition hover:text-orange-400">
          <ArrowLeft size={16} aria-hidden="true" /> MY PAGE
        </Link>
        <header className="mt-10 border-l-2 border-orange-500 pl-5">
          <p className="text-xs font-black tracking-[0.22em] text-orange-400">{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">{title}</h1>
          <p className="mt-3 leading-7 text-white/60">{description}</p>
        </header>

        <div className="mt-10">
          {eventGroups.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-white/55">まだ記録がありません</div>
          ) : eventGroups.map(({ category, records: eventRecords, best }) => (
            <PerformanceEventCard key={category} category={category} unit={unitMap[category] ?? ""} best={best} records={eventRecords} />
          ))}
        </div>

        <Link href={`/performance?kind=${kind}`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black tracking-[0.12em] transition hover:bg-orange-400">
          <Plus size={18} aria-hidden="true" /> 記録を追加
        </Link>
      </div>
    </main>
  );
}
