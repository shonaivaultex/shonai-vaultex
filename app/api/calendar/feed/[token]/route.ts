import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type CalendarEvent = { uid: string; title: string; startsAt: string; endsAt?: string | null; allDay: boolean; location?: string | null; description?: string | null };

function dateOnly(value: string) { return value.slice(0, 10); }
function compactDate(value: string) { return dateOnly(value).replaceAll("-", ""); }
function dateAfter(value: string) { const date = new Date(`${dateOnly(value)}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10); }
function compactUtc(value: string) { return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"); }
function oneHourAfter(value: string) { return new Date(new Date(value).getTime() + 3600000).toISOString(); }
function escapeIcs(value = "") { return value.replaceAll("\\", "\\\\").replaceAll("\r\n", "\\n").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;"); }
function eventLines(event: CalendarEvent) {
  const end = event.endsAt || (event.allDay ? event.startsAt : oneHourAfter(event.startsAt));
  const dates = event.allDay
    ? [`DTSTART;VALUE=DATE:${compactDate(event.startsAt)}`, `DTEND;VALUE=DATE:${compactDate(dateAfter(end))}`]
    : [`DTSTART:${compactUtc(event.startsAt)}`, `DTEND:${compactUtc(end)}`];
  return ["BEGIN:VEVENT", `UID:${event.uid}@shonai-vaultex.vercel.app`, `DTSTAMP:${compactUtc(new Date().toISOString())}`, ...dates, `SUMMARY:${escapeIcs(event.title)}`, `DESCRIPTION:${escapeIcs(event.description ?? "")}`, `LOCATION:${escapeIcs(event.location ?? "")}`, "END:VEVENT"];
}

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token) || !hasAdminKey()) return new Response("Not found", { status: 404 });
  const supabase = createAdminClient();
  const { data: owner } = await supabase.from("calendar_feed_tokens").select("user_id").eq("token", token).maybeSingle();
  if (!owner) return new Response("Not found", { status: 404 });

  const userId = owner.user_id;
  const [{ data: entries }, { data: attendance }, { data: applications }, { data: records }, { data: goals }] = await Promise.all([
    supabase.from("personal_calendar_entries").select("id,schedule_id,entry_date,starts_at,ends_at,all_day,title,location,journal").eq("user_id", userId),
    supabase.from("schedule_attendance").select("schedule_id").eq("user_id", userId).eq("status", "attending"),
    supabase.from("competition_applications").select("schedule_id").eq("user_id", userId).eq("status", "submitted"),
    supabase.from("performance_records").select("id,date,category,value,awareness_note").eq("user_id", userId),
    supabase.from("personal_calendar_goals").select("id,title,target_date,event_name,target_value,target_unit").eq("user_id", userId).eq("status", "active"),
  ]);
  const scheduleIds = [...new Set([...(attendance ?? []).map((row) => row.schedule_id), ...(applications ?? []).map((row) => row.schedule_id), ...(entries ?? []).flatMap((row) => row.schedule_id ? [row.schedule_id] : [])])];
  const { data: schedules } = scheduleIds.length ? await supabase.from("schedules").select("id,title,details,location,starts_at,ends_at,all_day").in("id", scheduleIds) : { data: [] };

  const events: CalendarEvent[] = [
    ...(entries ?? []).filter((entry) => !entry.schedule_id).map((entry) => ({ uid: `personal-${entry.id}`, title: entry.title, startsAt: entry.starts_at ?? `${entry.entry_date}T00:00:00+09:00`, endsAt: entry.ends_at, allDay: entry.all_day, location: entry.location, description: entry.journal })),
    ...(schedules ?? []).map((schedule) => ({ uid: `schedule-${schedule.id}`, title: schedule.title, startsAt: schedule.starts_at, endsAt: schedule.ends_at, allDay: schedule.all_day, location: schedule.location, description: schedule.details })),
    ...(records ?? []).map((record) => ({ uid: `record-${record.id}`, title: `練習記録：${record.category} ${record.value}`, startsAt: `${record.date}T00:00:00+09:00`, allDay: true, description: record.awareness_note })),
    ...(goals ?? []).map((goal) => ({ uid: `goal-${goal.id}`, title: `目標：${goal.title}`, startsAt: `${goal.target_date}T00:00:00+09:00`, allDay: true, description: [goal.event_name, goal.target_value ? `${goal.target_value}${goal.target_unit ?? ""}` : null].filter(Boolean).join(" / ") })),
  ];
  const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SHONAI VAULTEX//MY CALENDAR//JA", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:VAULTEX マイカレンダー", "X-WR-TIMEZONE:Asia/Tokyo", "REFRESH-INTERVAL;VALUE=DURATION:PT15M", "X-PUBLISHED-TTL:PT15M", ...events.flatMap(eventLines), "END:VCALENDAR", ""].join("\r\n");
  return new Response(calendar, { headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": "inline; filename=vaultex-calendar.ics", "Cache-Control": "no-store, max-age=0" } });
}

