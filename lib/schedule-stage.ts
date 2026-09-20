export function scheduleStage(start: string, end: string | null | undefined, allDay: boolean, now: number) {
  const startMs = Date.parse(start);
  if (!Number.isFinite(startMs)) return "before";
  const dateKey = new Date(end || start).toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  const dayEnd = Date.parse(`${dateKey}T00:00:00+09:00`) + 86400000;
  const endMs = !allDay && end && Date.parse(end) > startMs ? Date.parse(end) : dayEnd;
  if (now >= endMs) return "after";
  if (now >= startMs) return "during";
  return "before";
}
