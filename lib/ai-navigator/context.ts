import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateAthleteScan, type AthleteMeasurement, type AthleteStandard, type TypeSettings } from "@/lib/athlete-scan";
import type { AthleteContext } from "@/lib/ai-navigator/knowledge";
import { unitMap } from "@/lib/performance-events";

type RecordRow = { category: string; value: number | string; date: string; record_kind: string | null; awareness_category: string | null; awareness_categories: string[] | null; awareness_note: string | null; video_path: string | null };
type ScanRow = { id: string; scan_number: number; measured_on: string; athlete_standard_version: string | null; profile_snapshot: Record<string, unknown>; control_test_measurements: AthleteMeasurement[] | null };

function bestRecords(records: RecordRow[]) {
  const groups = new Map<string, RecordRow[]>();
  records.forEach((record) => groups.set(record.category, [...(groups.get(record.category) ?? []), record]));
  return [...groups.entries()].map(([category, rows]) => {
    const lowerIsBetter = ["秒", "分"].includes(unitMap[category]);
    const best = rows.reduce((current, row) => lowerIsBetter ? (Number(row.value) < Number(current.value) ? row : current) : (Number(row.value) > Number(current.value) ? row : current));
    return { category, value: Number(best.value), date: best.date };
  }).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
}

function awarenessSummary(records: RecordRow[]) {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const labels = record.awareness_categories?.length ? record.awareness_categories : record.awareness_category ? [record.awareness_category] : [];
    labels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));
  });
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 5);
}

export async function getAthleteContext(supabase: SupabaseClient, userId: string): Promise<AthleteContext> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const [{ data: player }, { data: recordRows }, { data: goals }, { data: scans }, { data: currentSet }] = await Promise.all([
    supabase.from("players").select("name, program_class, event, gender").eq("user_id", userId).maybeSingle(),
    supabase.from("performance_records").select("category, value, date, record_kind, awareness_category, awareness_categories, awareness_note, video_path").eq("user_id", userId).order("date", { ascending: false }).limit(200),
    supabase.from("performance_goals").select("category, target_value").eq("user_id", userId),
    supabase.from("control_test_scans").select("id, scan_number, measured_on, athlete_standard_version, profile_snapshot, control_test_measurements(test_code, primary_value, metrics, implement_weight_kg, implement_name, equipment, distance_m, jump_count)").eq("user_id", userId).order("scan_number", { ascending: false }).limit(2),
    supabase.from("athlete_scan_standard_sets").select("version").eq("is_current", true).maybeSingle(),
  ]);
  const records = (recordRows ?? []) as RecordRow[];
  const scanRows = (scans ?? []) as ScanRow[];
  const version = scanRows[0]?.athlete_standard_version ?? currentSet?.version ?? null;
  let latestScan: AthleteContext["latestScan"] = null;
  if (scanRows[0] && version && player?.gender) {
    const [{ data: standards }, { data: settings }] = await Promise.all([
      supabase.from("athlete_scan_standards").select("standard_version, gender, test_code, equipment, weight_kg, distance_m, jump_count, score_100_value, score_0_value, higher_is_better, status, notes").eq("standard_version", version).eq("gender", player.gender),
      supabase.from("athlete_scan_type_settings").select("balanced_max_spread, composite_max_gap, type_descriptions").eq("standard_version", version).maybeSingle(),
    ]);
    if (settings && standards?.length) {
      const evaluate = (scan: ScanRow) => evaluateAthleteScan(scan.control_test_measurements ?? [], standards as AthleteStandard[], settings as TypeSettings);
      const current = evaluate(scanRows[0]);
      const previous = scanRows[1] ? evaluate(scanRows[1]) : null;
      const labels = { SPEED: "速度", POWER: "出力", REACTIVE: "反発" } as const;
      latestScan = {
        scanNumber: scanRows[0].scan_number,
        measuredOn: scanRows[0].measured_on,
        typeName: current.typeNameJa,
        scores: Object.entries(current.axes).flatMap(([key, score]) => score == null ? [] : [{ label: labels[key as keyof typeof labels], score }]),
        evolution: previous ? Object.entries(current.axes).flatMap(([key, score]) => {
          const old = previous.axes[key as keyof typeof previous.axes];
          return score == null || old == null ? [] : [{ label: labels[key as keyof typeof labels], change: Math.round((score - old) * 10) / 10 }];
        }) : [],
      };
    }
  }
  return {
    name: player?.name ?? null,
    programClass: player?.program_class ?? null,
    event: player?.event ?? null,
    recordCount: records.length,
    recentRecordCount: records.filter((record) => record.date >= thirtyDaysAgo).length,
    videoCount: records.filter((record) => Boolean(record.video_path)).length,
    goals: (goals ?? []).map((goal) => ({ category: goal.category, target: Number(goal.target_value) })),
    recentRecords: records.slice(0, 12).map((record) => ({ category: record.category, value: Number(record.value), date: record.date, kind: record.record_kind })),
    personalBests: bestRecords(records),
    awarenessCounts: awarenessSummary(records),
    latestScan,
  };
}
