type Plan = {
  entry_date: string;
  entry_type: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  all_day: boolean;
};

export function planKey(entry: Plan) {
  return JSON.stringify([entry.entry_date, entry.entry_type, entry.title.trim(), entry.all_day,
    entry.starts_at ? new Date(entry.starts_at).toISOString() : null,
    entry.ends_at ? new Date(entry.ends_at).toISOString() : null]);
}

export function newPlans<T extends Plan>(candidates: T[], existing: Plan[]): T[] {
  const keys = new Set(existing.map(planKey));
  return candidates.filter((entry) => {
    const key = planKey(entry);
    if (keys.has(key)) return false;
    keys.add(key);
    return true;
  });
}

export function followingWeek<T extends Plan>(entry: T): T {
  const date = new Date(`${entry.entry_date}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 7);
  const shift = (value: string | null) => value ? new Date(new Date(value).getTime() + 7 * 86400000).toISOString() : null;
  return { ...entry, entry_date: date.toISOString().slice(0, 10), starts_at: shift(entry.starts_at), ends_at: shift(entry.ends_at) };
}
