import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { MAX_VIDEO_SIZE, PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["coach", "admin"]);
  if (!roles?.length) return NextResponse.json({ error: "コーチ権限が必要です。" }, { status: 403 });
  if (!hasAdminKey()) return NextResponse.json({ error: "動画保存用のサーバー設定が完了していません。" }, { status: 503 });

  const body = await request.json() as { athleteId?: unknown; fileName?: unknown; fileType?: unknown; fileSize?: unknown };
  const athleteId = typeof body.athleteId === "string" ? body.athleteId : "";
  const fileName = typeof body.fileName === "string" ? body.fileName : "";
  const fileType = typeof body.fileType === "string" ? body.fileType : "";
  const fileSize = Number(body.fileSize);
  if (!/^[0-9a-f-]{36}$/i.test(athleteId) || !fileType.startsWith("video/") || !Number.isFinite(fileSize) || fileSize <= 0 || fileSize > MAX_VIDEO_SIZE) {
    return NextResponse.json({ error: "動画ファイルを確認してください。動画は100MBまでです。" }, { status: 400 });
  }

  const isAdmin = roles.some((item) => item.role === "admin");
  const admin = createAdminClient();
  const { data: player } = await admin.from("players").select("user_id,program_class,member_status").eq("user_id", athleteId).maybeSingle();
  if (!player || player.member_status !== "active") return NextResponse.json({ error: "対象の選手を確認できませんでした。" }, { status: 404 });
  if (!isAdmin) {
    const { data: assignment } = await admin.from("coach_class_assignments").select("program_class").eq("coach_id", user.id).eq("program_class", player.program_class).maybeSingle();
    if (!assignment) return NextResponse.json({ error: "担当外の選手には動画を追加できません。" }, { status: 403 });
  }

  const extension = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  const path = `${athleteId}/${crypto.randomUUID()}.${extension}`;
  const { data, error } = await admin.storage.from(PERFORMANCE_VIDEO_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return NextResponse.json({ error: "動画のアップロード先を作成できませんでした。" }, { status: 500 });
  return NextResponse.json({ path, token: data.token });
}
