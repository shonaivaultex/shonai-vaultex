export type PerformanceCompetitionContext = {
  scheduleId: number;
  title: string;
  startDate: string;
  endDate: string;
};

type CompetitionSchedule = {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string | null;
  schedule_type: string;
};

const tokyoDateKey = (value: string) =>
  new Date(value).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });

export function competitionContextForRecord(
  recordDate: string,
  category: string,
  schedules: CompetitionSchedule[],
  applicationEventsBySchedule: Map<number, string[]>,
) {
  const matching = schedules.filter((schedule) => {
    if (schedule.schedule_type !== "competition") return false;
    const start = tokyoDateKey(schedule.starts_at);
    const end = schedule.ends_at ? tokyoDateKey(schedule.ends_at) : start;
    return start <= recordDate && recordDate <= end;
  });
  if (!matching.length) return null;

  const schedule = matching.find((item) =>
    (applicationEventsBySchedule.get(item.id) ?? []).includes(category),
  ) ?? matching[0];
  const startKey = tokyoDateKey(schedule.starts_at);
  const endKey = schedule.ends_at ? tokyoDateKey(schedule.ends_at) : startKey;
  return {
    scheduleId: schedule.id,
    title: schedule.title,
    startDate: startKey,
    endDate: endKey,
  } satisfies PerformanceCompetitionContext;
}
