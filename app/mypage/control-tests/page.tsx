import PerformanceRecordsPage from "@/app/components/PerformanceRecordsPage";

export default async function ControlTestsPage({ searchParams }: { searchParams: Promise<{ season?: string }> }) {
  const season = Number((await searchParams).season);
  return <PerformanceRecordsPage kind="control-test" selectedYear={Number.isInteger(season) && season > 1900 ? season : null} eyebrow="CONTROL TEST" title="コントロールテスト" description="スプリント・ジャンプ・筋力など、トレーニングの成長を確認します。" />;
}
