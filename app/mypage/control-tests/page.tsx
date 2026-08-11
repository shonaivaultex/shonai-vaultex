import PerformanceRecordsPage from "@/app/components/PerformanceRecordsPage";

export default async function ControlTestsPage({ searchParams }: { searchParams: Promise<{ season?: string; feedback?: string }> }) {
  const params = await searchParams;
  const season = Number(params.season);
  const feedback = Number(params.feedback);
  return <PerformanceRecordsPage kind="control-test" selectedYear={Number.isInteger(season) && season > 1900 ? season : null} focusRecordId={Number.isInteger(feedback) && feedback > 0 ? feedback : null} eyebrow="CONTROL TEST" title="コントロールテスト" description="スプリント・ジャンプ・筋力など、トレーニングの成長を確認します。" />;
}
