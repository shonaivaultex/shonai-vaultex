import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Subscription = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type CalendarEntry = {
  user_id: string;
  entry_type: string;
  journal: string | null;
  performance_record_id: number | null;
  schedule_id: number | null;
  schedules: { schedule_type: string } | { schedule_type: string }[] | null;
};

type Schedule = {
  id: number;
  schedule_type: string;
};

type Attendance = {
  user_id: string;
  schedule_id: number;
};

function japanDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function isTrainingEntry(entry: CalendarEntry) {
  if (["school_practice", "personal_training"].includes(entry.entry_type)) return true;
  if (entry.entry_type !== "club_schedule") return false;
  const schedule = Array.isArray(entry.schedules) ? entry.schedules[0] : entry.schedules;
  return schedule?.schedule_type === "practice" || schedule?.schedule_type === "measurement";
}

function japanDayRange(date: string) {
  return {
    start: `${date}T00:00:00+09:00`,
    end: `${date}T23:59:59.999+09:00`,
  };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "Push is not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const reminderDate = japanDate();
  const { data: subscriptionRows, error: subscriptionError } = await admin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .eq("notify_training_log_reminder", true);
  if (subscriptionError) {
    return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
  }

  const subscriptions = (subscriptionRows ?? []) as Subscription[];
  const subscribedUserIds = [...new Set(subscriptions.map((item) => item.user_id))];
  if (!subscribedUserIds.length) {
    return NextResponse.json({ date: reminderDate, eligible: 0, sent: 0 });
  }

  const dayRange = japanDayRange(reminderDate);
  const [{ data: activePlayers, error: playersError }, { data: entries, error: entriesError }, { data: records, error: recordsError }, { data: scheduleRows, error: schedulesError }] = await Promise.all([
    admin.from("players").select("user_id").in("user_id", subscribedUserIds).eq("member_status", "active"),
    admin
      .from("personal_calendar_entries")
      .select("user_id, entry_type, journal, performance_record_id, schedule_id, schedules(schedule_type)")
      .in("user_id", subscribedUserIds)
      .eq("entry_date", reminderDate),
    admin
      .from("performance_records")
      .select("user_id, record_kind")
      .in("user_id", subscribedUserIds)
      .eq("date", reminderDate),
    admin
      .from("schedules")
      .select("id, schedule_type")
      .gte("starts_at", dayRange.start)
      .lte("starts_at", dayRange.end)
      .in("schedule_type", ["practice", "measurement", "competition"]),
  ]);
  const dataError = playersError ?? entriesError ?? recordsError ?? schedulesError;
  if (dataError) return NextResponse.json({ error: dataError.message }, { status: 500 });

  const schedules = (scheduleRows ?? []) as Schedule[];
  const scheduleById = new Map(schedules.map((item) => [item.id, item]));
  const { data: attendanceRows, error: attendanceError } = schedules.length
    ? await admin
        .from("schedule_attendance")
        .select("user_id, schedule_id")
        .in("user_id", subscribedUserIds)
        .in("schedule_id", schedules.map((item) => item.id))
        .eq("status", "attending")
    : { data: [] as Attendance[], error: null };
  if (attendanceError) return NextResponse.json({ error: attendanceError.message }, { status: 500 });

  const activeUserIds = new Set((activePlayers ?? []).map((item) => item.user_id as string));
  const recordKindsByUser = new Map<string, Set<string>>();
  for (const record of records ?? []) {
    const kinds = recordKindsByUser.get(record.user_id as string) ?? new Set<string>();
    kinds.add(record.record_kind as string);
    recordKindsByUser.set(record.user_id as string, kinds);
  }
  const entriesByUser = new Map<string, CalendarEntry[]>();
  for (const rawEntry of (entries ?? []) as unknown as CalendarEntry[]) {
    if (!isTrainingEntry(rawEntry)) continue;
    const current = entriesByUser.get(rawEntry.user_id) ?? [];
    current.push(rawEntry);
    entriesByUser.set(rawEntry.user_id, current);
  }

  const attendedTypesByUser = new Map<string, Set<string>>();
  for (const attendance of (attendanceRows ?? []) as Attendance[]) {
    const schedule = scheduleById.get(attendance.schedule_id);
    if (!schedule) continue;
    const types = attendedTypesByUser.get(attendance.user_id) ?? new Set<string>();
    types.add(schedule.schedule_type);
    attendedTypesByUser.set(attendance.user_id, types);
  }

  const eligibleUsers = subscribedUserIds.flatMap((userId) => {
    if (!activeUserIds.has(userId)) return [];
    const userEntries = entriesByUser.get(userId) ?? [];
    const attendedTypes = attendedTypesByUser.get(userId) ?? new Set<string>();
    const competition = attendedTypes.has("competition")
      || userEntries.some((entry) => entry.entry_type === "competition");
    const training = attendedTypes.has("practice")
      || attendedTypes.has("measurement")
      || userEntries.some(isTrainingEntry);
    if (!competition && !training) return [];

    const requiredKind = competition ? "athletics" : "unofficial-athletics";
    if (recordKindsByUser.get(userId)?.has(requiredKind)) return [];
    if (!competition && userEntries.some((entry) => Boolean(entry.performance_record_id) || Boolean(entry.journal?.trim()))) return [];
    return [{ userId, kind: competition ? "competition" as const : "training" as const }];
  });

  webpush.setVapidDetails("mailto:info@shonai-vaultex.jp", publicKey, privateKey);
  let sentUsers = 0;
  let sentDevices = 0;
  const staleEndpoints: string[] = [];

  for (const { userId, kind } of eligibleUsers) {
    const targets = subscriptions.filter((item) => item.user_id === userId);
    if (!targets.length) continue;
    const { error: claimError } = await admin
      .from("training_log_reminders")
      .insert({ user_id: userId, reminder_date: reminderDate });
    if (claimError?.code === "23505") continue;
    if (claimError) {
      console.error("Training reminder claim failed", { userId, message: claimError.message });
      continue;
    }

    const competition = kind === "competition";
    const payload = JSON.stringify({
      title: competition ? "今日の本番記録を残そう" : "今日の練習を振り返ろう",
      body: competition ? "今日の試合記録を入力して、次の挑戦につなげましょう。" : "今日の練習記録を入力して、短い振り返りを残しましょう。",
      url: `/performance?kind=${competition ? "athletics" : "unofficial-athletics"}&date=${reminderDate}&quick=1`,
      tag: `training-log-reminder-${reminderDate}`,
    });
    const deliveries = await Promise.all(targets.map(async (target) => {
      try {
        await webpush.sendNotification(
          { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
          payload,
        );
        return true;
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : null;
        if (statusCode === 404 || statusCode === 410) staleEndpoints.push(target.endpoint);
        console.error("Training reminder push failed", { userId, statusCode });
        return false;
      }
    }));
    const delivered = deliveries.filter(Boolean).length;
    if (delivered) {
      sentUsers += 1;
      sentDevices += delivered;
    } else {
      await admin.from("training_log_reminders").delete().eq("user_id", userId).eq("reminder_date", reminderDate);
    }
  }

  if (staleEndpoints.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", [...new Set(staleEndpoints)]);
  }

  return NextResponse.json({
    date: reminderDate,
    eligible: eligibleUsers.length,
    sentUsers,
    sentDevices,
  });
}
