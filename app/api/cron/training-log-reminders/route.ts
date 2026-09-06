import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendLineMessage } from "@/lib/line";

export const runtime = "nodejs";

type Subscription = {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};
type LineTarget = { user_id: string; line_user_id: string };
type ScheduleLineTarget = LineTarget & { portal: "athlete" | "family" };

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

type TomorrowSchedule = Schedule & { title: string; starts_at: string };

function japanTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function sendTomorrowScheduleReminders(admin: ReturnType<typeof createAdminClient>, tomorrow: string) {
  if (!process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN) return 0;
  const [{ data: connectionRows, error: connectionError }, { data: scheduleRows, error: scheduleError }] = await Promise.all([
    admin.from("line_account_connections").select("user_id,line_user_id,portal").eq("notify_schedule", true),
    admin
      .from("schedules")
      .select("id,title,starts_at,schedule_type")
      .gte("starts_at", `${tomorrow}T00:00:00+09:00`)
      .lte("starts_at", `${tomorrow}T23:59:59.999+09:00`)
      .order("starts_at"),
  ]);
  if (connectionError || scheduleError) throw connectionError ?? scheduleError;
  const connections = (connectionRows ?? []) as ScheduleLineTarget[];
  const schedules = (scheduleRows ?? []) as TomorrowSchedule[];
  if (!connections.length || !schedules.length) return 0;

  const { data: attendanceRows, error: attendanceError } = await admin
    .from("schedule_attendance")
    .select("user_id,schedule_id")
    .in("schedule_id", schedules.map((item) => item.id))
    .eq("status", "attending");
  if (attendanceError) throw attendanceError;
  const attendance = (attendanceRows ?? []) as Attendance[];
  const athleteIds = [...new Set(attendance.map((item) => item.user_id))];
  const { data: linkRows, error: linksError } = athleteIds.length
    ? await admin.from("guardian_athlete_links").select("guardian_id,athlete_id").in("athlete_id", athleteIds).eq("status", "active")
    : { data: [], error: null };
  if (linksError) throw linksError;

  const athletesByGuardian = new Map<string, string[]>();
  for (const link of linkRows ?? []) {
    const current = athletesByGuardian.get(link.guardian_id) ?? [];
    current.push(link.athlete_id);
    athletesByGuardian.set(link.guardian_id, current);
  }

  let sent = 0;
  for (const connection of connections) {
    const linkedAthletes = connection.portal === "athlete"
      ? [connection.user_id]
      : athletesByGuardian.get(connection.user_id) ?? [];
    const scheduleIds = new Set(
      attendance
        .filter((item) => linkedAthletes.includes(item.user_id))
        .map((item) => item.schedule_id),
    );
    const userSchedules = schedules.filter((item) => scheduleIds.has(item.id));
    if (!userSchedules.length) continue;

    const { error: claimError } = await admin.from("line_daily_reminder_deliveries").insert({
      user_id: connection.user_id,
      reminder_date: tomorrow,
      reminder_kind: "tomorrow_schedule",
    });
    if (claimError?.code === "23505") continue;
    if (claimError) throw claimError;

    const competition = userSchedules.some((item) => item.schedule_type === "competition");
    const scheduleText = userSchedules.map((item) => `${japanTime(item.starts_at)} ${item.title}`).join("\n");
    const result = await sendLineMessage(
      connection.line_user_id,
      competition ? "明日は大会です。準備を確認しましょう" : "明日のVAULTEX予定",
      scheduleText,
      connection.portal === "family" ? "/family/schedule" : "/mypage/my-calendar",
    );
    if (result.sent) sent += 1;
    else {
      await admin
        .from("line_daily_reminder_deliveries")
        .delete()
        .eq("user_id", connection.user_id)
        .eq("reminder_date", tomorrow)
        .eq("reminder_kind", "tomorrow_schedule");
    }
  }
  return sent;
}

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
  const admin = createAdminClient();
  const reminderDate = japanDate();
  const tomorrow = japanDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [{ data: subscriptionRows, error: subscriptionError }, { data: lineRows, error: lineError }] = await Promise.all([
    admin.from("push_subscriptions").select("user_id, endpoint, p256dh, auth").eq("notify_training_log_reminder", true),
    admin.from("line_account_connections").select("user_id,line_user_id").eq("portal", "athlete").eq("notify_training_log_reminder", true),
  ]);
  if (subscriptionError || lineError) return NextResponse.json({ error: (subscriptionError ?? lineError)?.message }, { status: 500 });

  const subscriptions = (subscriptionRows ?? []) as Subscription[];
  const lineTargets = (lineRows ?? []) as LineTarget[];
  const subscribedUserIds = [...new Set([...subscriptions.map((item) => item.user_id), ...lineTargets.map((item) => item.user_id)])];
  if (!subscribedUserIds.length) {
    const tomorrowLineSent = await sendTomorrowScheduleReminders(admin, tomorrow);
    return NextResponse.json({ date: reminderDate, eligible: 0, sent: 0, tomorrowLineSent });
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

  if (publicKey && privateKey) webpush.setVapidDetails("mailto:info@shonai-vaultex.jp", publicKey, privateKey);
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
    const deliveries = publicKey && privateKey ? await Promise.all(targets.map(async (target) => {
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
    })) : [];
    const lineTarget = lineTargets.find((target) => target.user_id === userId);
    const lineDelivery = lineTarget
      ? await sendLineMessage(lineTarget.line_user_id, competition ? "今日の本番記録を残そう" : "今日の練習を振り返ろう", competition ? "今日の試合記録を入力して、次の挑戦につなげましょう。" : "今日の練習記録を入力して、短い振り返りを残しましょう。", `/performance?kind=${competition ? "athletics" : "unofficial-athletics"}&date=${reminderDate}&quick=1`)
      : { sent: false };
    const delivered = deliveries.filter(Boolean).length;
    if (delivered || lineDelivery.sent) {
      sentUsers += 1;
      sentDevices += delivered;
    } else {
      await admin.from("training_log_reminders").delete().eq("user_id", userId).eq("reminder_date", reminderDate);
    }
  }

  if (staleEndpoints.length) {
    await admin.from("push_subscriptions").delete().in("endpoint", [...new Set(staleEndpoints)]);
  }
  const tomorrowLineSent = await sendTomorrowScheduleReminders(admin, tomorrow);

  return NextResponse.json({
    date: reminderDate,
    eligible: eligibleUsers.length,
    sentUsers,
    sentDevices,
    sentLine: eligibleUsers.filter(({ userId }) => lineTargets.some((target) => target.user_id === userId)).length,
    tomorrowLineSent,
  });
}
