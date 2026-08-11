import PerformanceRecordsPage from "@/app/components/PerformanceRecordsPage";

export default async function UnofficialAthleticsPage({ searchParams }: { searchParams: Promise<{ season?: string; feedback?: string }> }) {
  const params = await searchParams;
  const season = Number(params.season);
  const feedback = Number(params.feedback);
  return <PerformanceRecordsPage kind="unofficial-athletics" selectedYear={Number.isInteger(season) && season > 1900 ? season : null} focusRecordId={Number.isInteger(feedback) && feedback > 0 ? feedback : null} eyebrow="UNOFFICIAL ATHLETICS" title="非公認陸上競技記録" description="練習跳躍・練習投擲・実践練習など、大会以外で残した競技記録を確認します。" />;
}
