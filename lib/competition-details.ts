export type CompetitionDetailStatus = "valid" | "foul" | "pass" | "dns" | "dnf" | "dq";

export type CompetitionDetailInput = {
  sequenceNumber: number;
  roundName?: string | null;
  value?: string;
  windSpeed?: string;
  place?: string;
  status: CompetitionDetailStatus;
};

export const attemptStatusLabels: Record<CompetitionDetailStatus, string> = {
  valid: "記録", foul: "ファウル", pass: "パス", dns: "欠場", dnf: "途中棄権", dq: "失格",
};

export function bestCompetitionDetail(details: CompetitionDetailInput[], lowerIsBetter: boolean) {
  const valid = details.flatMap((detail) => {
    const value = Number(detail.value);
    return detail.status === "valid" && Number.isFinite(value) && value > 0 ? [{ ...detail, numericValue: value }] : [];
  });
  if (!valid.length) return null;
  return valid.reduce((best, item) => lowerIsBetter ? (item.numericValue < best.numericValue ? item : best) : (item.numericValue > best.numericValue ? item : best));
}
