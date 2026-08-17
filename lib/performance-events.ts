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
  { name: "リバウンドジャンプ", unit: "RJ-index", kind: "control-test" },
  { name: "リバウンドジャンプ（3回）", unit: "RJ-index", kind: "control-test" },
  { name: "リバウンドジャンプ（4回）", unit: "RJ-index", kind: "control-test" },
  { name: "リバウンドジャンプ（5回）", unit: "RJ-index", kind: "control-test" },
  { name: "300m走", unit: "秒", kind: "control-test" },
  { name: "150m走", unit: "秒", kind: "control-test" },
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

export const eventNamesByKind = (kind: PerformanceKind) =>
  performanceEvents
    .filter((event) => event.kind === (kind === "unofficial-athletics" ? "athletics" : kind))
    .map((event) => event.name);

export const eventKindMap = Object.fromEntries(
  performanceEvents.map((event) => [event.name, event.kind]),
) as Record<string, PerformanceKind>;

export const unitMap = Object.fromEntries(
  performanceEvents.map((event) => [event.name, event.unit]),
) as Record<string, string>;
