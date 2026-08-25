export type BarAttemptResult = "o" | "x" | "pass" | null;
export type BarHeightRow = { height: string; attempts: [BarAttemptResult, BarAttemptResult, BarAttemptResult] };

export type CombinedEventResult = { event: string; value: string; points: number | null };

export type AdvancedPerformanceDetails =
  | { type: "bar"; heights: BarHeightRow[]; bestHeight: number | null; endedByThreeMisses: boolean }
  | { type: "combined"; discipline: string; formulaVersion: "WA_COMBINED_2025"; events: CombinedEventResult[]; totalPoints: number; complete: boolean };

type Coefficient = { event: string; unit: "seconds" | "metres" | "centimetres"; direction: "track" | "field"; a: number; b: number; c: number };

const decathlon: Coefficient[] = [
  { event: "100m", unit: "seconds", direction: "track", a: 25.4347, b: 18, c: 1.81 },
  { event: "走幅跳", unit: "centimetres", direction: "field", a: 0.14354, b: 220, c: 1.4 },
  { event: "砲丸投", unit: "metres", direction: "field", a: 51.39, b: 1.5, c: 1.05 },
  { event: "走高跳", unit: "centimetres", direction: "field", a: 0.8465, b: 75, c: 1.42 },
  { event: "400m", unit: "seconds", direction: "track", a: 1.53775, b: 82, c: 1.81 },
  { event: "110mH", unit: "seconds", direction: "track", a: 5.74352, b: 28.5, c: 1.92 },
  { event: "円盤投", unit: "metres", direction: "field", a: 12.91, b: 4, c: 1.1 },
  { event: "棒高跳", unit: "centimetres", direction: "field", a: 0.2797, b: 100, c: 1.35 },
  { event: "やり投", unit: "metres", direction: "field", a: 10.14, b: 7, c: 1.08 },
  { event: "1500m", unit: "seconds", direction: "track", a: 0.03768, b: 480, c: 1.85 },
];

const heptathlon: Coefficient[] = [
  { event: "100mH", unit: "seconds", direction: "track", a: 9.23076, b: 26.7, c: 1.835 },
  { event: "走高跳", unit: "centimetres", direction: "field", a: 1.84523, b: 75, c: 1.348 },
  { event: "砲丸投", unit: "metres", direction: "field", a: 56.0211, b: 1.5, c: 1.05 },
  { event: "200m", unit: "seconds", direction: "track", a: 4.99087, b: 42.5, c: 1.81 },
  { event: "走幅跳", unit: "centimetres", direction: "field", a: 0.188807, b: 210, c: 1.41 },
  { event: "やり投", unit: "metres", direction: "field", a: 15.9803, b: 3.8, c: 1.04 },
  { event: "800m", unit: "seconds", direction: "track", a: 0.11193, b: 254, c: 1.88 },
];

const octathlonNames = ["100m", "走幅跳", "砲丸投", "400m", "110mH", "走高跳", "やり投", "1000m"];
const oneThousand: Coefficient = { event: "1000m", unit: "seconds", direction: "track", a: 0.08713, b: 305.5, c: 1.85 };

export function combinedEventCoefficients(discipline: string) {
  if (discipline === "七種競技") return heptathlon;
  if (discipline === "八種競技") return octathlonNames.map((name) => name === "1000m" ? oneThousand : decathlon.find((item) => item.event === name)!).filter(Boolean);
  return decathlon;
}

export function combinedPoints(coefficient: Coefficient, rawValue: number) {
  if (!Number.isFinite(rawValue) || rawValue <= 0) return null;
  const performance = coefficient.unit === "centimetres" ? rawValue * 100 : rawValue;
  const base = coefficient.direction === "track" ? coefficient.b - performance : performance - coefficient.b;
  return base > 0 ? Math.max(0, Math.floor(coefficient.a * Math.pow(base, coefficient.c))) : 0;
}

export function barSummary(rows: BarHeightRow[]) {
  let consecutiveMisses = 0;
  let bestHeight: number | null = null;
  let endedByThreeMisses = false;
  for (const row of rows) {
    const height = Number(row.height);
    for (const attempt of row.attempts) {
      if (endedByThreeMisses || !attempt || attempt === "pass") continue;
      if (attempt === "o") {
        consecutiveMisses = 0;
        if (Number.isFinite(height) && height > 0) bestHeight = Math.max(bestHeight ?? 0, height);
      } else {
        consecutiveMisses += 1;
        if (consecutiveMisses >= 3) endedByThreeMisses = true;
      }
    }
  }
  return { bestHeight, endedByThreeMisses };
}
