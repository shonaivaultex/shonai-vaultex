import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { eventKindMap, unitMap, type PerformanceKind } from "@/lib/performance-events";

const labels: Record<PerformanceKind, string> = {
  athletics: "本番記録",
  "unofficial-athletics": "練習記録",
  "control-test": "コントロールテスト",
};

export default async function GrowthHistoryPage({ searchParams }: {
  searchParams: Promise<{ kind?: string; category?: string }>;
}) {
  const { kind, category } = await searchParams;
  if (!kind || !Object.hasOwn(labels, kind) || !category || category.length > 200) notFound();
  const selectedKind = kind as PerformanceKind;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/mypage/growth-report/history?${new URLSearchParams({ kind, category })}`)}`);
  const { data, error } = await supabase.from("performance_records")
    .select("id,category,value,date,record_kind")
    .eq("user_id", user.id).eq("category", category)
    .order("date", { ascending: false }).order("id", { ascending: false });
  // Match the report's handling of legacy records without an explicit kind.
  const records = (data ?? []).filter(record =>
    (record.record_kind ?? eventKindMap[record.category] ?? "control-test") === selectedKind);
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-28 text-white sm:px-8">
    <div className="mx-auto max-w-2xl">
      <Link href="/mypage/growth-report" className="text-sm font-bold text-orange-300">← 成長レポートへ戻る</Link>
      <header className="mt-8">
        <p className="text-sm text-orange-300">{labels[selectedKind]}</p>
        <h1 className="mt-2 text-3xl font-black">{category}の記録履歴</h1>
        <p className="mt-3 text-sm text-white/50">これまでの記録を新しい順に表示しています。</p>
      </header>
      {error ? <p role="alert" className="mt-6 rounded-xl border border-red-400/30 p-4 text-red-200">記録を読み込めませんでした。時間をおいて再読み込みしてください。</p> : records.length ? <>
        <p className="mt-6 text-sm text-white/50">全{records.length}件</p>
        <ol className="mt-3 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
          {records.map(record => <li key={record.id} className="flex items-center justify-between gap-4 px-5 py-5">
            <time dateTime={record.date} className="text-sm text-white/70">{record.date.replaceAll("-", "/")}</time>
            <strong className="text-xl text-orange-300">{record.value}<span className="ml-1 text-sm text-white/50">{unitMap[category] ?? ""}</span></strong>
          </li>)}
        </ol>
      </> : <p className="mt-8 rounded-2xl border border-dashed border-white/20 p-8 text-center text-white/50">この種目・区分の記録はまだありません。</p>}
    </div>
  </main>;
}
