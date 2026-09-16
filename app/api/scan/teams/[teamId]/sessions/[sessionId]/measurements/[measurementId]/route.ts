import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { controlTestByCode } from "@/lib/control-test";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ teamId: string; sessionId: string; measurementId: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "不正なリクエストです。" }, { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  if (!hasAdminKey()) return NextResponse.json({ error: "サーバー設定を確認してください。" }, { status: 503 });
  const { teamId, sessionId, measurementId } = await params;
  const admin = createAdminClient();
  const { data: member, error: memberError } = await admin.from("scan_team_members").select("role").eq("team_id", teamId).eq("user_id", user.id).in("role", ["owner", "coach"]).maybeSingle();
  if (memberError) return NextResponse.json({ error: "権限を確認できませんでした。" }, { status: 500 });
  if (!member) return NextResponse.json({ error: "編集権限がありません。" }, { status: 403 });
  const body = await request.json().catch(() => null);
  const attempts: unknown = body?.attempts;
  if (!Array.isArray(attempts) || attempts.length < 1 || attempts.length > 10 || attempts.some(n => typeof n !== "number" || !Number.isFinite(n) || n <= 0 || n >= 100000) || typeof body?.updatedAt !== "string") {
    return NextResponse.json({ error: "試技は1〜10件、0より大きい100000未満の数値で入力してください。" }, { status: 400 });
  }
  const { data: row, error: readError } = await admin.from("scan_team_measurements").select("id,test_code,updated_at").eq("id", measurementId).eq("team_id", teamId).eq("session_id", sessionId).maybeSingle();
  if (readError) return NextResponse.json({ error: "記録を取得できませんでした。" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "記録が見つかりません。" }, { status: 404 });
  const definition = controlTestByCode[row.test_code];
  if (!definition) return NextResponse.json({ error: "この種目は編集に対応していません。" }, { status: 400 });
  if (row.updated_at !== body.updatedAt) return NextResponse.json({ error: "別の更新がありました。ページを再読み込みして確認してください。" }, { status: 409 });
  const primary = definition.betterDirection === "lower" ? Math.min(...attempts) : Math.max(...attempts);
  const { data: saved, error } = await admin.from("scan_team_measurements").update({ attempts, primary_value: primary, updated_at: new Date().toISOString() }).eq("id", measurementId).eq("team_id", teamId).eq("session_id", sessionId).eq("updated_at", row.updated_at).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "保存できませんでした。入力内容は残っています。" }, { status: 500 });
  if (!saved) return NextResponse.json({ error: "記録が変更されました。ページを再読み込みしてください。" }, { status: 409 });
  return NextResponse.json({ ok: true });
}
