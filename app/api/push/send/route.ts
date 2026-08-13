import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@/lib/supabase-server";

type PushTarget = { endpoint: string; p256dh: string; auth: string };

export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return NextResponse.json({ error: "Push is not configured" }, { status: 503 });
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json(); const kind = body.kind === "feedback" ? "feedback" : body.kind === "announcement" ? "announcement" : body.kind === "schedule" ? "schedule" : null; if (!kind) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { data: targets, error } = await supabase.rpc("get_push_targets", { p_kind: kind, p_record_id: body.recordId ?? null, p_audience: body.audience ?? null, p_program_class: body.programClass ?? null });
  if (error) return NextResponse.json({ error: error.message }, { status: 403 });
  webpush.setVapidDetails("mailto:info@shonai-vaultex.jp", publicKey, privateKey);
  const payload = kind === "feedback" ? { title: "フィードバックが届きました", body: "コーチからのアドバイスを確認しましょう。", url: "/mypage", tag: `feedback-${body.recordId}` } : kind === "schedule" ? { title: body.title || "予定が変更されました", body: body.body || "最新の予定を確認してください。", url: "/mypage/schedules", tag: "schedule-change" } : { title: body.title || "重要なお知らせ", body: body.body || "新しいお知らせがあります。", url: "/mypage", tag: "important-announcement" };
  const results = await Promise.allSettled(((targets ?? []) as PushTarget[]).map((target) => webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, JSON.stringify(payload))));
  return NextResponse.json({ sent: results.filter((result) => result.status === "fulfilled").length });
}
