import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { redirect } from "next/navigation";
import OverallGrowthReport from "@/app/components/OverallGrowthReport";
import { createClient } from "@/lib/supabase-server";
import type { GrowthRecord } from "@/app/components/MonthlyGrowthReport";
import type { PerformanceKind } from "@/lib/performance-events";

export default async function GrowthReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/growth-report");

  const { data: records } = await supabase
    .from("performance_records")
    .select("id, category, value, date, awareness_category, awareness_categories, record_kind")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-28 text-white sm:px-8">
    <div className="mx-auto max-w-5xl">
      <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/55 transition hover:text-orange-400"><ArrowLeft size={16} /> MY PAGE</Link>
      <header className="mt-8 flex items-start gap-4 border-l-2 border-orange-500 pl-5"><div className="min-w-0 flex-1"><p className="text-[10px] font-black tracking-[0.22em] text-orange-400">TOTAL GROWTH</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">全期間の成長レポート</h1><p className="mt-2 text-sm leading-6 text-white/50">これまでに蓄積した全記録から、種目ごとの伸びと取り組みの傾向を確認できます。</p></div><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><BarChart3 /></span></header>
      <div className="mt-8"><OverallGrowthReport records={(records ?? []) as Array<GrowthRecord & { record_kind?: PerformanceKind | null }>} /></div>
    </div>
  </main>;
}
