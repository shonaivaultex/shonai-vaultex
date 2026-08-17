import { ArrowRight, ScanLine } from "lucide-react";
import { controlTestByCode, performanceCategoryForMeasurement } from "@/lib/control-test";

export type RJTrial = { trial_number: number; jump_height_cm: number | string; contact_time_ms: number | string; rj_index: number | string };
export type ScanMeasurement = { test_code: string; primary_value: number | string; metrics: Record<string, number | string | null> | null; implement_weight_kg: number | string | null; implement_name?: string | null; distance_m?: number | string | null; jump_count?: number | null; protocol_version?: number | null; control_test_rj_trials?: RJTrial[] | null };
export type ScanRow = { id: string; scan_number: number; measured_on: string; status: string; control_test_measurements: ScanMeasurement[] | null };

function value(item: ScanMeasurement | undefined) { return item ? Number(item.primary_value) : null; }
function format(value: number, unit: string) { return `${Number(value.toFixed(3))}${unit}`; }
function isComparable(current: ScanMeasurement, candidate: ScanMeasurement) {
  if (current.test_code !== candidate.test_code) return false;
  if (current.test_code === "acceleration_30m") {
    const currentFlying = current.metrics?.flying_30m_time != null;
    const candidateFlying = candidate.metrics?.flying_30m_time != null;
    return currentFlying === candidateFlying;
  }
  if (current.test_code === "speed_endurance_300m") return Number(current.distance_m ?? current.metrics?.distance_m) === Number(candidate.distance_m ?? candidate.metrics?.distance_m);
  if (current.test_code === "standing_five_bound" || current.test_code === "rebound_jump") return Number(current.jump_count ?? current.metrics?.jump_count ?? current.metrics?.trial_count) === Number(candidate.jump_count ?? candidate.metrics?.jump_count ?? candidate.metrics?.trial_count);
  if (current.test_code.startsWith("shot_")) return current.implement_name === candidate.implement_name && Number(current.implement_weight_kg) === Number(candidate.implement_weight_kg);
  return true;
}

export default function ControlTestScanOverview({ scans }: { scans: ScanRow[] }) {
  const ordered = [...scans].sort((a, b) => a.scan_number - b.scan_number);
  return (
    <section className="mt-8">
      <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black tracking-[0.2em] text-orange-400">SCAN HISTORY</p><h2 className="mt-1 text-2xl font-black">VAULTEX SCAN</h2></div><span className="text-xs text-white/35">{scans.length}回</span></div>
      {scans.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/45">最初のSCANを登録すると、次回から差分を比較できます。</div> : (
        <div className="mt-4 grid gap-3">
          {[...ordered].reverse().map((scan, reverseIndex) => {
            const index = ordered.length - 1 - reverseIndex;
            const measurements = scan.control_test_measurements ?? [];
            return <details key={scan.id} className="rounded-2xl border border-white/10 bg-[#111] p-5 open:border-orange-500/35">
              <summary className="flex cursor-pointer list-none items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><ScanLine size={21} /></span><span className="min-w-0 flex-1"><strong className="block">VAULTEX SCAN #{String(scan.scan_number).padStart(2,"0")}</strong><span className="mt-1 block text-xs text-white/40">{scan.measured_on}・{measurements.length}測定</span></span><span className="text-xs font-bold text-orange-300">詳しく見る</span></summary>
              <div className="mt-5 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
                {measurements.sort((a,b)=>(controlTestByCode[a.test_code]?.sortOrder ?? 99)-(controlTestByCode[b.test_code]?.sortOrder ?? 99)).map((measurement) => {
                  const definition = controlTestByCode[measurement.test_code]; if (!definition) return null;
                  const previousMeasurement = ordered.slice(0,index).reverse().flatMap((item)=>item.control_test_measurements??[]).find((item)=>isComparable(measurement,item));
                  const firstMeasurement = ordered.flatMap((item)=>item.control_test_measurements??[]).find((item)=>isComparable(measurement,item));
                  const previousValue = value(previousMeasurement);
                  const firstValue = value(firstMeasurement);
                  const current = Number(measurement.primary_value);
                  const isLegacy30m = measurement.test_code === "acceleration_30m" && measurement.metrics?.flying_30m_time == null;
                  const category = isLegacy30m ? "30m走（旧測定）" : performanceCategoryForMeasurement(measurement.test_code,{distanceM:Number(measurement.distance_m ?? measurement.metrics?.distance_m ?? 0),jumpCount:Number(measurement.jump_count ?? measurement.metrics?.jump_count ?? measurement.metrics?.trial_count ?? 0),equipment:measurement.implement_name});
                  const trials = [...(measurement.control_test_rj_trials ?? [])].sort((a,b)=>a.trial_number-b.trial_number);
                  return <div key={measurement.test_code} className="rounded-xl bg-white/[0.035] p-3"><div className="flex justify-between gap-3"><span className="text-xs text-white/50">{category}</span><strong>{format(current, definition.unit)}</strong></div><div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/35">{previousValue !== null && <span>前回差 {format(current-previousValue,definition.unit)}</span>}{firstValue !== null && <span className="inline-flex items-center gap-1"><ArrowRight size={10}/>初回差 {format(current-firstValue,definition.unit)}</span>}</div>{trials.length>0&&<div className="mt-3 grid grid-cols-5 gap-1 border-t border-white/10 pt-2">{trials.map((trial)=><div key={trial.trial_number} className="text-center text-[9px] text-white/40"><span className="block text-white/60">{trial.trial_number}回</span><span className="block">{trial.rj_index} RJ</span><span className="block">{trial.jump_height_cm}cm</span><span className="block">{trial.contact_time_ms}ms</span></div>)}</div>}</div>;
                })}
              </div>
            </details>;
          })}
        </div>
      )}
    </section>
  );
}
