import PerformanceRecordsPage from "@/app/components/PerformanceRecordsPage";
import ControlTestIntro from "@/app/components/ControlTestIntro";
import ControlTestScanOverview, { type ScanRow } from "@/app/components/ControlTestScanOverview";
import { createClient } from "@/lib/supabase-server";

export default async function ControlTestsPage({ searchParams }: { searchParams: Promise<{ season?: string; feedback?: string }> }) {
  const params = await searchParams;
  const season = Number(params.season);
  const feedback = Number(params.feedback);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: scans, error: scanError } = user ? await supabase.from("control_test_scans").select("id, scan_number, measured_on, status, control_test_measurements(test_code, primary_value, metrics, implement_weight_kg, implement_name, distance_m, jump_count, protocol_version, control_test_rj_trials(trial_number, jump_height_cm, contact_time_ms, rj_index))").eq("user_id", user.id).order("measured_on", { ascending: false }) : { data: [], error: null };
  if (scanError && scanError.code !== "42P01") console.error("CONTROL TEST SCAN ERROR", scanError);
  return <PerformanceRecordsPage kind="control-test" selectedYear={Number.isInteger(season) && season > 1900 ? season : null} focusRecordId={Number.isInteger(feedback) && feedback > 0 ? feedback : null} eyebrow="VAULTEX CONTROL TEST" title="コントロールテスト" description="身体能力の特徴を知り、その変化を継続的に可視化するための測定です。" addHref="/mypage/control-tests/new" addLabel="VAULTEX SCANを記録" beforeRecords={<><ControlTestIntro /><ControlTestScanOverview scans={(scans ?? []) as ScanRow[]} /></>} />;
}
