import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendLineMessage } from "@/lib/line";

type PushTarget = { endpoint: string; p256dh: string; auth: string; athlete_name?: string; portal?: "athlete" | "family" };

export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return NextResponse.json({ error: "Push is not configured" }, { status: 503 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json(); const kind = body.kind === "feedback" ? "feedback" : body.kind === "announcement" ? "announcement" : body.kind === "schedule" ? "schedule" : body.kind === "video_feedback" ? "video_feedback" : body.kind === "test" ? "test" : null; if (!kind) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const pushQuery = kind === "test"
    ? supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", user.id)
    : kind === "video_feedback"
      ? supabase.rpc("get_video_feedback_push_targets", { p_request_id: body.requestId, p_sender_role: body.senderRole })
      : supabase.rpc("get_push_targets", { p_kind: kind, p_record_id: body.recordId ?? null, p_audience: body.audience ?? null, p_program_class: body.programClass ?? null });
  const { data: targets, error } = await pushQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  webpush.setVapidDetails("mailto:info@shonai-vaultex.jp", publicKey, privateKey);
  const athleteName = (targets?.[0] as PushTarget | undefined)?.athlete_name ?? "選手";
  const familyForTarget = (target?: PushTarget) => target?.portal === "family" || (kind === "test" && body.portal === "family");
  const notificationFor = (family: boolean) => kind === "test" ? { title: "SHONAI VAULTEX 通知テスト", body: "LINE通知は正常に設定されています。", url: family ? "/family" : "/mypage" } : kind === "video_feedback" ? body.senderRole === "athlete" ? { title: body.isInitial ? "新しいコーチ相談" : "相談に返信が届きました", body: `${athleteName}さんからメッセージが届きました。`, url: `/coach/video-feedback/${body.requestId}` } : { title: "コーチから返信が届きました", body: "コーチ相談を確認しましょう。", url: "/mypage/video-feedback" } : kind === "feedback" ? { title: "フィードバックが届きました", body: "コーチからのアドバイスを確認しましょう。", url: "/mypage" } : kind === "schedule" ? { title: body.title || "予定が変更されました", body: body.body || "最新の予定を確認してください。", url: family ? "/family/schedule" : "/mypage/schedules" } : { title: body.title || "重要なお知らせ", body: body.body || "新しいお知らせがあります。", url: family ? "/family/news" : "/mypage" };
  const deliveries = await Promise.all(((targets ?? []) as PushTarget[]).map(async (target) => {
    const family = familyForTarget(target);
    const payload = { ...notificationFor(family), tag: kind === "test" ? "push-test" : kind === "video_feedback" ? `video-feedback-${body.requestId}` : kind === "feedback" ? `feedback-${body.recordId}` : kind === "schedule" ? "schedule-change" : "important-announcement" };
    try {
      await webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, JSON.stringify(payload));
      return { ok: true, endpoint: target.endpoint };
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : null;
      const responseBody = typeof error === "object" && error && "body" in error && typeof error.body === "string" ? error.body : "";
      let reason = responseBody;
      try { reason = JSON.parse(responseBody).reason ?? responseBody; } catch { /* Use the original response text. */ }
      console.error("Push notification failed", { statusCode, reason, endpointHost: new URL(target.endpoint).host });
      return { ok: false, endpoint: target.endpoint, statusCode, reason };
    }
  }));
  const staleEndpoints = deliveries.filter((item) => !item.ok && (item.statusCode === 404 || item.statusCode === 410)).map((item) => item.endpoint);
  if (kind === "test" && staleEndpoints.length) await supabase.from("push_subscriptions").delete().eq("user_id", user.id).in("endpoint", staleEndpoints);

  const admin = createAdminClient();
  let recipientIds: string[] = [];
  if (kind === "test") recipientIds = [user.id];
  else if (kind === "feedback" && body.recordId) {
    const { data: record } = await admin.from("performance_records").select("user_id").eq("id", body.recordId).maybeSingle();
    if (record?.user_id) recipientIds = [record.user_id];
  } else if (kind === "video_feedback" && body.requestId) {
    const { data: requestRow } = await admin.from("video_feedback_requests").select("user_id").eq("id", body.requestId).maybeSingle();
    if (requestRow?.user_id && body.senderRole === "coach") recipientIds = [requestRow.user_id];
  } else if (kind === "announcement" || kind === "schedule") {
    let playersQuery = admin.from("players").select("user_id").eq("member_status", "active");
    if (body.audience === "class" && body.programClass) playersQuery = playersQuery.eq("program_class", body.programClass);
    const { data: players } = await playersQuery;
    const athleteIds = (players ?? []).map((item) => item.user_id as string);
    recipientIds = athleteIds;
    if (athleteIds.length) {
      const { data: familyLinks } = await admin.from("guardian_athlete_links").select("guardian_id").in("athlete_id", athleteIds).eq("status", "active");
      recipientIds.push(...(familyLinks ?? []).map((item) => item.guardian_id as string));
    }
  }
  const preference = kind === "feedback" || kind === "video_feedback" ? "notify_feedback" : kind === "schedule" ? "notify_schedule" : "notify_important";
  const { data: lineTargets } = recipientIds.length ? await admin.from("line_account_connections").select("user_id,line_user_id,portal").in("user_id", [...new Set(recipientIds)]).eq(preference, true) : { data: [] };
  const lineResults = await Promise.all((lineTargets ?? []).map((target) => {
    const payload = notificationFor(target.portal === "family");
    return sendLineMessage(target.line_user_id, payload.title, payload.body, payload.url);
  }));
  return NextResponse.json({ attempted: deliveries.length, sent: deliveries.filter((item) => item.ok).length, failed: deliveries.filter((item) => !item.ok).length, lineSent: lineResults.filter((item) => item.sent).length, reasons: kind === "test" ? [...new Set(deliveries.filter((item) => !item.ok).map((item) => item.reason || `HTTP ${item.statusCode ?? "error"}`))] : undefined });
}
