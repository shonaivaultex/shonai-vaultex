export const schedulePhases = [
  { value: "normal", label: "通常", dot: "bg-orange-400", badge: "border-white/15 bg-white/5 text-white/55" },
  { value: "build", label: "強化期", dot: "bg-red-400", badge: "border-red-500/30 bg-red-500/10 text-red-300" },
  { value: "recovery", label: "回復期", dot: "bg-emerald-400", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  { value: "taper", label: "調整期", dot: "bg-sky-400", badge: "border-sky-500/30 bg-sky-500/10 text-sky-300" },
  { value: "competition", label: "試合期", dot: "bg-violet-400", badge: "border-violet-500/30 bg-violet-500/10 text-violet-300" },
] as const;

export type SchedulePhase = (typeof schedulePhases)[number]["value"];

export function schedulePhase(value?: string | null) {
  return schedulePhases.find((phase) => phase.value === value) ?? schedulePhases[0];
}
