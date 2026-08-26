export type PerformanceKind = "control-test" | "athletics" | "unofficial-athletics";

export type PerformanceEvent = {
  name: string;
  unit: string;
  kind: PerformanceKind;
};

export const performanceEvents: PerformanceEvent[] = [
  { name: "30m走", unit: "秒", kind: "control-test" },
  { name: "Flying 30m", unit: "秒", kind: "control-test" },
  { name: "50m走", unit: "秒", kind: "control-test" },
  { name: "立幅跳", unit: "m", kind: "control-test" },
  { name: "立三段跳", unit: "m", kind: "control-test" },
  { name: "立五段跳", unit: "m", kind: "control-test" },
  { name: "砲丸フロント投げ", unit: "m", kind: "control-test" },
  { name: "砲丸バック投げ", unit: "m", kind: "control-test" },
  { name: "メディシンボールフロント投げ", unit: "m", kind: "control-test" },
  { name: "メディシンボールバック投げ", unit: "m", kind: "control-test" },
  { name: "3kgメディシンボール フロント投げ", unit: "m", kind: "control-test" },
  { name: "3kgメディシンボール バック投げ", unit: "m", kind: "control-test" },
  { name: "リバウンドジャンプ", unit: "RJ-index", kind: "control-test" },
  { name: "リバウンドジャンプ（3回）", unit: "RJ-index", kind: "control-test" },
  { name: "リバウンドジャンプ（4回）", unit: "RJ-index", kind: "control-test" },
  { name: "リバウンドジャンプ（5回）", unit: "RJ-index", kind: "control-test" },
  { name: "300m走", unit: "秒", kind: "control-test" },
  { name: "150m走", unit: "秒", kind: "control-test" },
  { name: "垂直跳", unit: "cm", kind: "control-test" },
  { name: "CMJ", unit: "cm", kind: "control-test" },
  { name: "ドロップジャンプ", unit: "DJ-index", kind: "control-test" },
  { name: "メディシンボール投げ", unit: "m", kind: "control-test" },
  { name: "ベンチプレス", unit: "kg", kind: "control-test" },
  { name: "スクワット", unit: "kg", kind: "control-test" },
  { name: "クリーン", unit: "kg", kind: "control-test" },
  { name: "デッドリフト", unit: "kg", kind: "control-test" },
  { name: "100m", unit: "秒", kind: "athletics" },
  { name: "200m", unit: "秒", kind: "athletics" },
  { name: "400m", unit: "秒", kind: "athletics" },
  { name: "800m", unit: "分", kind: "athletics" },
  { name: "1500m", unit: "分", kind: "athletics" },
  { name: "5000m", unit: "分", kind: "athletics" },
  { name: "100mH", unit: "秒", kind: "athletics" },
  { name: "110mH", unit: "秒", kind: "athletics" },
  { name: "400mH", unit: "秒", kind: "athletics" },
  { name: "走幅跳", unit: "m", kind: "athletics" },
  { name: "三段跳", unit: "m", kind: "athletics" },
  { name: "走高跳", unit: "m", kind: "athletics" },
  { name: "棒高跳", unit: "m", kind: "athletics" },
  { name: "砲丸投", unit: "m", kind: "athletics" },
  { name: "円盤投", unit: "m", kind: "athletics" },
  { name: "ハンマー投", unit: "m", kind: "athletics" },
  { name: "やり投", unit: "m", kind: "athletics" },
  { name: "十種競技", unit: "点", kind: "athletics" },
  { name: "八種競技", unit: "点", kind: "athletics" },
  { name: "七種競技", unit: "点", kind: "athletics" },
  { name: "その他", unit: "", kind: "control-test" },
];

export const standaloneControlTestEvents = [
  "Flying 30m",
  "立幅跳",
  "立三段跳",
  "立五段跳",
  "3kgメディシンボール フロント投げ",
  "3kgメディシンボール バック投げ",
  "砲丸フロント投げ",
  "砲丸バック投げ",
  "リバウンドジャンプ",
  "CMJ",
  "ドロップジャンプ",
  "150m走",
  "300m走",
] as const;

const namesForStoredKind = (kind: Exclude<PerformanceKind, "unofficial-athletics">) =>
  performanceEvents.filter((event) => event.kind === kind).map((event) => event.name);

export const eventGroupsByKind = (kind: PerformanceKind) => {
  if (kind === "unofficial-athletics") {
    return [
      { label: "通常の練習種目", events: namesForStoredKind("athletics") },
      { label: "CONTROL TEST（単発測定）", events: [...standaloneControlTestEvents] },
    ];
  }
  return [{ label: null, events: namesForStoredKind(kind) }];
};

export const eventNamesByKind = (kind: PerformanceKind) =>
  [...new Set(eventGroupsByKind(kind).flatMap((group) => group.events))];

export const eventKindMap = Object.fromEntries(
  performanceEvents.map((event) => [event.name, event.kind]),
) as Record<string, PerformanceKind>;

export const unitMap = Object.fromEntries(
  performanceEvents.map((event) => [event.name, event.unit]),
) as Record<string, string>;

export const windAffectedEvents = ["100m", "200m", "100mH", "110mH", "走幅跳", "三段跳"] as const;

export const competitionAttemptEvents = ["走幅跳", "三段跳", "砲丸投", "円盤投", "ハンマー投", "やり投"] as const;
export const competitionRoundEvents = ["100m", "200m", "400m", "800m", "1500m", "5000m", "100mH", "110mH", "400mH"] as const;
export const competitionBarEvents = ["走高跳", "棒高跳"] as const;
export const competitionCombinedEvents = ["十種競技", "八種競技", "七種競技"] as const;

export function competitionDetailMode(category: string) {
  if ((competitionAttemptEvents as readonly string[]).includes(category)) return "attempt" as const;
  if ((competitionRoundEvents as readonly string[]).includes(category)) return "round" as const;
  if ((competitionBarEvents as readonly string[]).includes(category)) return "bar" as const;
  if ((competitionCombinedEvents as readonly string[]).includes(category)) return "combined" as const;
  return null;
}

export function isWindAffectedEvent(category: string) {
  return (windAffectedEvents as readonly string[]).includes(category);
}

export function isWindLegalForRanking(category: string, windSpeed: number | string | null | undefined) {
  if (!isWindAffectedEvent(category) || windSpeed === null || windSpeed === undefined || windSpeed === "") return true;
  const value = Number(windSpeed);
  return Number.isFinite(value) && value <= 2;
}

export function formatWindSpeed(windSpeed: number | string | null | undefined) {
  if (windSpeed === null || windSpeed === undefined || windSpeed === "") return null;
  const value = Number(windSpeed);
  if (!Number.isFinite(value)) return null;
  const formatted = `${value > 0 ? "+" : value < 0 ? "−" : "±"}${Math.abs(value).toFixed(1)}m/s`;
  return value > 2 ? `${formatted}（追い風参考）` : formatted;
}
