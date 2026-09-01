import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Subscription = { user_id: string; endpoint: string; p256dh: string; auth: string };
type FamilyLink = { guardian_id: string; athlete_id: string };
type Player = { user_id: string; name: string; program_class: string | null };
type Schedule = { id: number; title: string; starts_at: string; audience: string; program_class: string | null; registration_deadline: string | null };

function japanDateTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Cron is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return NextResponse.json({ error: "Push is not configured" }, { status: 503 });

  const admin = createAdminClient();
  const now = new Date();
  const until = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const { data: subscriptionRows, error: subscriptionError } = await admin
    .from("push_subscriptions")
    .select("user_id,endpoint,p256dh,auth")
    .eq("notify_attendance_reminder", true);
  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });

  const subscriptions = (subscriptionRows ?? []) as Subscription[];
  const guardianIds = [...new Set(subscriptions.map((item) => item.user_id))];
  if (!guardianIds.length) return NextResponse.json({ eligible: 0, sentUsers: 0, sentDevices: 0 });

  const { data: linkRows, error: linksError } = await admin
    .from("guardian_athlete_links")
    .select("guardian_id,athlete_id")
    .in("guardian_id", guardianIds)
    .eq("guardian_role", "primary_guardian")
    .eq("status", "active");
  if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });

  const links = (linkRows ?? []) as FamilyLink[];
  const athleteIds = [...new Set(links.map((item) => item.athlete_id))];
  if (!athleteIds.length) return NextResponse.json({ eligible: 0, sentUsers: 0, sentDevices: 0 });

  const [{ data: playerRows, error: playersError }, { data: scheduleRows, error: schedulesError }] = await Promise.all([
    admin.from("players").select("user_id,name,program_class").in("user_id", athleteIds).eq("member_status", "active"),
    admin.from("schedules").select("id,title,starts_at,audience,program_class,registration_deadline").eq("registration_enabled", true).gte("starts_at", now.toISOString()).lte("starts_at", until.toISOString()).order("starts_at"),
  ]);
  const lookupError = playersError ?? schedulesError;
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  const players = new Map(((playerRows ?? []) as Player[]).map((item) => [item.user_id, item]));
  const schedules = ((scheduleRows ?? []) as Schedule[]).filter((item) => !item.registration_deadline || new Date(item.registration_deadline) >= now);
  if (!schedules.length) return NextResponse.json({ eligible: 0, sentUsers: 0, sentDevices: 0 });

  const { data: attendanceRows, error: attendanceError } = await admin
    .from("schedule_attendance")
    .select("schedule_id,user_id")
    .in("schedule_id", schedules.map((item) => item.id))
    .in("user_id", athleteIds);
  if (attendanceError) return NextResponse.json({ error: attendanceError.message }, { status: 500 });
  const answered = new Set((attendanceRows ?? []).map((item) => `${item.user_id}:${item.schedule_id}`));

  const eligible = links.flatMap((link) => {
    const player = players.get(link.athlete_id);
    if (!player) return [];
    return schedules
      .filter((schedule) => (schedule.audience === "all" || schedule.program_class === player.program_class) && !answered.has(`${link.athlete_id}:${schedule.id}`))
      .map((schedule) => ({ link, player, schedule }));
  });

  webpush.setVapidDetails("mailto:info@shonai-vaultex.jp", publicKey, privateKey);
  let sentUsers = 0;
  let sentDevices = 0;
  const staleEndpoints: string[] = [];
  for (const item of eligible) {
    const { error: claimError } = await admin.from("family_attendance_reminders").insert({
      guardian_id: item.link.guardian_id,
      athlete_id: item.link.athlete_id,
      schedule_id: item.schedule.id,
    });
    if (claimError?.code === "23505") continue;
    if (claimError) {
      console.error("Family attendance reminder claim failed", { message: claimError.message });
      continue;
    }

    const targets = subscriptions.filter((target) => target.user_id === item.link.guardian_id);
    const payload = JSON.stringify({
      title: "出欠の回答をお願いします",
      body: `${item.player.name}さんの「${item.schedule.title}」（${japanDateTime(item.schedule.starts_at)}）が未回答です。`,
      url: `/family/schedule?athlete=${item.link.athlete_id}`,
      tag: `family-attendance-${item.link.athlete_id}-${item.schedule.id}`,
    });
    const results = await Promise.all(targets.map(async (target) => {
      try {
        await webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, payload);
        return true;
      } catch (error) {
        const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : null;
        if (statusCode === 404 || statusCode === 410) staleEndpoints.push(target.endpoint);
        console.error("Family attendance reminder push failed", { statusCode });
        return false;
      }
    }));
    const delivered = results.filter(Boolean).length;
    if (delivered) {
      sentUsers += 1;
      sentDevices += delivered;
    } else {
      await admin.from("family_attendance_reminders").delete().eq("guardian_id", item.link.guardian_id).eq("athlete_id", item.link.athlete_id).eq("schedule_id", item.schedule.id);
    }
  }

  if (staleEndpoints.length) await admin.from("push_subscriptions").delete().in("endpoint", [...new Set(staleEndpoints)]);
  return NextResponse.json({ eligible: eligible.length, sentUsers, sentDevices });
}
