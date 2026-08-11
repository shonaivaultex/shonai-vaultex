import PerformanceRecordsPage from "@/app/components/PerformanceRecordsPage";

export default async function AthleticsPage({ searchParams }: { searchParams: Promise<{ season?: string; feedback?: string }> }) {
  const params = await searchParams;
  const season = Number(params.season);
  const feedback = Number(params.feedback);
  return <PerformanceRecordsPage kind="athletics" selectedYear={Number.isInteger(season) && season > 1900 ? season : null} focusRecordId={Number.isInteger(feedback) && feedback > 0 ? feedback : null} eyebrow="ATHLETICS" title="陸上競技記録" description="大会・記録会で残した競技記録と自己ベストを確認します。" />;
}
