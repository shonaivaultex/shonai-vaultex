import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json(
      { error: "ログインが必要です。" },
      { status: 401 },
    );
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["coach", "admin"]);
  if (!roles?.length || !hasAdminKey())
    return NextResponse.json(
      { error: "編集する権限がありません。" },
      { status: 403 },
    );
  const detailId = Number((await params).id);
  const body = (await request.json()) as { videoPath?: unknown };
  const videoPath =
    typeof body.videoPath === "string" &&
    /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.[a-z0-9]{1,10}$/i.test(body.videoPath)
      ? body.videoPath
      : "";
  if (!Number.isInteger(detailId) || detailId < 1 || !videoPath)
    return NextResponse.json(
      { error: "動画または試技を確認してください。" },
      { status: 400 },
    );
  const admin = createAdminClient();
  const { data: detail } = await admin
    .from("performance_record_details")
    .select("id,performance_records!inner(user_id,entry_source,entered_by)")
    .eq("id", detailId)
    .maybeSingle();
  const parent = Array.isArray(detail?.performance_records)
    ? detail.performance_records[0]
    : detail?.performance_records;
  if (
    !detail ||
    !parent ||
    parent.entry_source !== "coach" ||
    parent.entered_by !== user.id
  )
    return NextResponse.json(
      { error: "自分が入力した試技だけ編集できます。" },
      { status: 403 },
    );
  if (!videoPath.startsWith(`${parent.user_id}/`))
    return NextResponse.json(
      { error: "この選手用にアップロードした動画だけ追加できます。" },
      { status: 403 },
    );
  const { error } = await admin
    .from("performance_record_details")
    .update({ video_path: videoPath })
    .eq("id", detailId);
  if (error)
    return NextResponse.json(
      { error: "試技の動画を保存できませんでした。" },
      { status: 500 },
    );
  return NextResponse.json({ ok: true });
}
