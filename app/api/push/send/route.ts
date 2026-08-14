import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase-server";

type PushTarget = { endpoint: string; p256dh: string; auth: string; athlete_name?: string };

export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return NextResponse.json({ error: "Push is not configured" }, { status: 503 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json(); const kind = body.kind === "feedback" ? "feedback" : body.kind === "announcement" ? "announcement" : body.kind === "schedule" ? "schedule" : body.kind === "video_feedback" ? "video_feedback" : body.kind === "test" ? "test" : null; if (!kind) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const pushQuery = kind === "test"
    ? supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", user.id).eq("endpoint", body.endpoint)
    : kind === "video_feedback"
      ? supabase.rpc("get_video_feedback_push_targets", { p_request_id: body.requestId, p_sender_role: body.senderRole })
      : supabase.rpc("get_push_targets", { p_kind: kind, p_record_id: body.recordId ?? null, p_audience: body.audience ?? null, p_program_class: body.programClass ?? null });
  const { data: targets, error } = await pushQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  webpush.setVapidDetails("mailto:info@shonai-vaultex.jp", publicKey, privateKey);
  const athleteName = (targets?.[0] as PushTarget | undefined)?.athlete_name ?? "選手";
  const payload = kind === "test" ? { title: "SHONAI VAULTEX 通知テスト", body: "通知は正常に設定されています。", url: "/mypage", tag: "push-test" } : kind === "video_feedback" ? body.senderRole === "athlete" ? { title: body.isInitial ? "新しいフィードバック依頼" : "フィードバックに返信が届きました", body: `${athleteName}さんからメッセージが届きました。`, url: `/coach/video-feedback/${body.requestId}`, tag: `video-feedback-${body.requestId}` } : { title: "コーチから返信が届きました", body: "動画フィードバックを確認しましょう。", url: "/mypage/video-feedback", tag: `video-feedback-${body.requestId}` } : kind === "feedback" ? { title: "フィードバックが届きました", body: "コーチからのアドバイスを確認しましょう。", url: "/mypage", tag: `feedback-${body.recordId}` } : kind === "schedule" ? { title: body.title || "予定が変更されました", body: body.body || "最新の予定を確認してください。", url: "/mypage/schedules", tag: "schedule-change" } : { title: body.title || "重要なお知らせ", body: body.body || "新しいお知らせがあります。", url: "/mypage", tag: "important-announcement" };
  const results = await Promise.allSettled(((targets ?? []) as PushTarget[]).map((target) => webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, JSON.stringify(payload))));
  return NextResponse.json({ sent: results.filter((result) => result.status === "fulfilled").length });
}
