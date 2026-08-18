import { performanceCategoryForMeasurement } from "@/lib/control-test";

export type AthleteAxis = "SPEED" | "POWER" | "REACTIVE";
export type AthleteAbilityKey = "max_speed" | "horizontal_power" | "bounce_power" | "total_body_power" | "reactive_performance" | "speed_endurance";

export type AthleteStandard = {
  standard_version: string; gender: "male" | "female"; test_code: string; equipment: string | null;
  weight_kg: number | string | null; distance_m: number | string | null; jump_count: number | null;
  score_100_value: number | string | null; score_0_value: number | string | null;
  higher_is_better: boolean; status: string; notes: string | null;
};

export type AthleteMeasurement = {
  test_code: string; primary_value: number | string; metrics: Record<string, number | string | null> | null;
  implement_weight_kg: number | string | null; implement_name?: string | null; equipment?: string | null;
  distance_m?: number | string | null; jump_count?: number | null;
};

export type AthleteAbility = {
  key: AthleteAbilityKey; nameJa: string; nameEn: string; score: number | null; rawValue: number | null;
  unit: string; testName: string; standard: AthleteStandard | null; standardDisplay: string; status: "ready" | "missing" | "pending";
};

export type AthleteScanEvaluation = {
  abilities: Record<AthleteAbilityKey, AthleteAbility>;
  axes: Record<AthleteAxis, number | null>;
  typeCode: string | null;
  typeNameJa: string | null;
  typeDescription: string | null;
  nextGrowth: AthleteAxis | null;
};

export type TypeSettings = {
  balanced_max_spread: number | string; composite_max_gap: number | string;
  type_descriptions: Record<string, string> | null;
};

const labels: Record<AthleteAbilityKey, [string,string,string]> = {
  max_speed: ["最大疾走速度","MAX SPEED","秒"],
  horizontal_power: ["水平瞬発力","HORIZONTAL EXPLOSIVE POWER","m"],
  bounce_power: ["連続水平跳躍力","BOUNCE POWER","m"],
  total_body_power: ["全身爆発力","TOTAL BODY POWER","m"],
  reactive_performance: ["反発パフォーマンス","REACTIVE PERFORMANCE","RJ-index"],
  speed_endurance: ["スピード持久力","SPEED ENDURANCE","秒"],
};

const round = (value: number) => Math.round(value * 10) / 10;
const numeric = (value: number | string | null | undefined) => value == null ? null : Number(value);

function conditions(measurement: AthleteMeasurement) {
  return {
    distance: numeric(measurement.distance_m ?? measurement.metrics?.distance_m),
    jumps: numeric(measurement.jump_count ?? measurement.metrics?.jump_count ?? measurement.metrics?.trial_count),
    weight: numeric(measurement.implement_weight_kg),
    equipment: measurement.implement_name ?? measurement.equipment ?? null,
  };
}

function matches(measurement: AthleteMeasurement, standard: AthleteStandard) {
  if (measurement.test_code !== standard.test_code) return false;
  if (measurement.test_code === "acceleration_30m" && measurement.metrics?.flying_30m_time == null) return false;
  const c = conditions(measurement);
  if (standard.distance_m != null && (measurement.test_code === "acceleration_30m" ? 30 : c.distance) !== Number(standard.distance_m)) return false;
  if (standard.jump_count != null && c.jumps !== Number(standard.jump_count)) return false;
  if (standard.weight_kg != null && c.weight !== Number(standard.weight_kg)) return false;
  if (standard.equipment && !String(c.equipment ?? "").includes(standard.equipment)) return false;
  return true;
}

export function scoreMeasurement(value: number, standard: AthleteStandard) {
  const hundred = numeric(standard.score_100_value);
  const zero = numeric(standard.score_0_value);
  if (hundred == null || !Number.isFinite(hundred) || standard.status !== "active") return null;
  if (standard.higher_is_better) return hundred === 0 ? null : round((value / hundred) * 100);
  if (zero == null || zero === hundred) return null;
  return round(((zero - value) / (zero - hundred)) * 100);
}

function singleAbility(key: AthleteAbilityKey, testCode: string, measurements: AthleteMeasurement[], standards: AthleteStandard[]) {
  const measurement = measurements.find((item) => item.test_code === testCode);
  const [nameJa,nameEn,unit] = labels[key];
  if (!measurement) return { key,nameJa,nameEn,unit,score:null,rawValue:null,testName:"未測定",standard:null,standardDisplay:"—",status:"missing" as const };
  const standard = standards.find((item) => matches(measurement,item)) ?? null;
  const c = conditions(measurement);
  const testName = performanceCategoryForMeasurement(measurement.test_code,{distanceM:c.distance,jumpCount:c.jumps,equipment:c.equipment});
  const rawValue = Number(measurement.primary_value);
  const score = standard ? scoreMeasurement(rawValue,standard) : null;
  return { key,nameJa,nameEn,unit,score,rawValue,testName,standard,standardDisplay:standard?.score_100_value == null?"VAULTEX STANDARD設定中":String(standard.score_100_value),status:score == null ? "pending" as const : "ready" as const };
}

function mean(values: Array<number | null>) { return values.some((value) => value == null) ? null : round(values.reduce<number>((sum,value)=>sum+(value ?? 0),0)/values.length); }

export function evaluateAthleteScan(measurements: AthleteMeasurement[], standards: AthleteStandard[], settings: TypeSettings): AthleteScanEvaluation {
  const maxSpeed = singleAbility("max_speed","acceleration_30m",measurements,standards);
  const horizontal = singleAbility("horizontal_power","standing_long_jump",measurements,standards);
  const bounce = singleAbility("bounce_power","standing_five_bound",measurements,standards);
  const front = singleAbility("total_body_power","shot_front_throw",measurements,standards);
  const back = singleAbility("total_body_power","shot_back_throw",measurements,standards);
  const totalScore = mean([front.score,back.score]);
  const total: AthleteAbility = {
    ...front, score: totalScore,
    rawValue: front.rawValue != null && back.rawValue != null ? round((front.rawValue+back.rawValue)/2) : null,
    testName: front.testName === "未測定" && back.testName === "未測定" ? "未測定" : `${front.testName}／${back.testName}`,
    standardDisplay: front.standard?.score_100_value == null || back.standard?.score_100_value == null ? "VAULTEX STANDARD設定中" : `Front ${front.standard.score_100_value}／Back ${back.standard.score_100_value}`,
    status: totalScore != null ? "ready" : (front.status === "missing" || back.status === "missing" ? "missing" : "pending"),
  };
  const reactive = singleAbility("reactive_performance","rebound_jump",measurements,standards);
  const endurance = singleAbility("speed_endurance","speed_endurance_300m",measurements,standards);
  const abilities = { max_speed:maxSpeed, horizontal_power:horizontal, bounce_power:bounce, total_body_power:total, reactive_performance:reactive, speed_endurance:endurance };
  const axes: Record<AthleteAxis,number|null> = {
    SPEED: mean([maxSpeed.score,endurance.score]),
    POWER: mean([horizontal.score,total.score]),
    REACTIVE: mean([bounce.score,reactive.score]),
  };
  const available = (Object.entries(axes) as Array<[AthleteAxis,number|null]>).filter((item): item is [AthleteAxis,number] => item[1] != null).sort((a,b)=>b[1]-a[1]);
  let typeCode: string | null = null;
  if (available.length === 3) {
    const spread = available[0][1]-available[2][1];
    if (spread <= Number(settings.balanced_max_spread)) typeCode="BALANCED";
    else if (available[0][1]-available[1][1] <= Number(settings.composite_max_gap)) typeCode=`${available[0][0]} × ${available[1][0]}`;
    else typeCode=available[0][0];
  }
  const typeNames: Record<string,string> = { SPEED:"スピード型",POWER:"パワー型",REACTIVE:"反発型",BALANCED:"バランス型",
    "SPEED × POWER":"スピード・パワー型","SPEED × REACTIVE":"スピード・反発型","POWER × SPEED":"パワー・スピード型","POWER × REACTIVE":"パワー・反発型","REACTIVE × SPEED":"反発・スピード型","REACTIVE × POWER":"反発・パワー型" };
  return { abilities, axes, typeCode, typeNameJa:typeCode ? typeNames[typeCode] : null,
    typeDescription:typeCode ? settings.type_descriptions?.[typeCode] ?? null : null,
    nextGrowth:available.length === 3 ? available[2][0] : null };
}

export const abilityKeys: AthleteAbilityKey[] = ["max_speed","horizontal_power","bounce_power","total_body_power","reactive_performance","speed_endurance"];
