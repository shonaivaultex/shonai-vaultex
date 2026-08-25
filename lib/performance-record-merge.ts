export type MergeablePerformanceFields = {
  awareness_category?: string | null;
  awareness_categories?: string[] | null;
  awareness_note?: string | null;
  video_path?: string | null;
  wind_speed?: number | null;
};

export function mergePerformanceFields(
  existing: MergeablePerformanceFields,
  incoming: MergeablePerformanceFields,
) {
  const categories = [...new Set([
    ...(existing.awareness_categories ?? (existing.awareness_category ? [existing.awareness_category] : [])),
    ...(incoming.awareness_categories ?? (incoming.awareness_category ? [incoming.awareness_category] : [])),
  ])];

  return {
    awareness_category: categories[0] ?? null,
    awareness_categories: categories.length ? categories : null,
    awareness_note: incoming.awareness_note?.trim() || existing.awareness_note?.trim() || null,
    video_path: incoming.video_path || existing.video_path || null,
    wind_speed: incoming.wind_speed ?? existing.wind_speed ?? null,
  };
}

export function performanceRecordIdentity(input: {
  userId: string;
  kind: string;
  category: string;
  date: string;
  value: number;
}) {
  return `${input.userId}\u001f${input.kind}\u001f${input.category}\u001f${input.date}\u001f${input.value}`;
}
