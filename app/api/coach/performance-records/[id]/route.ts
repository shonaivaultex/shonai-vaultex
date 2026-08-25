import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["coach", "admin"]);
  if (!roles?.length) return NextResponse.json({ error: "コーチ権限が必要です。" }, { status: 403 });
  if (!hasAdminKey()) return NextResponse.json({ error: "削除用のサーバー設定が完了していません。" }, { status: 503 });

  const recordId = Number((await params).id);
  if (!Number.isInteger(recordId) || recordId < 1) return NextResponse.json({ error: "記録が見つかりません。" }, { status: 400 });

  const admin = createAdminClient();
  const { data: record } = await admin.from("performance_records").select("id,user_id,entry_source").eq("id", recordId).maybeSingle();
  if (!record) return NextResponse.json({ error: "記録が見つかりません。" }, { status: 404 });
  if (record.entry_source !== "coach") return NextResponse.json({ error: "選手本人が入力した記録はコーチ側から削除できません。" }, { status: 403 });

  const isAdmin = roles.some((item) => item.role === "admin");
  if (!isAdmin) {
    const [{ data: player }, { data: assignments }] = await Promise.all([
      admin.from("players").select("program_class,member_status").eq("user_id", record.user_id).maybeSingle(),
      admin.from("coach_class_assignments").select("program_class").eq("coach_id", user.id),
    ]);
    const assignedClasses = new Set((assignments ?? []).map((item) => item.program_class));
    if (!player || player.member_status !== "active" || !player.program_class || !assignedClasses.has(player.program_class)) {
      return NextResponse.json({ error: "担当外の選手の記録は削除できません。" }, { status: 403 });
    }
  }

  const { error } = await admin.from("performance_records").delete().eq("id", recordId).eq("entry_source", "coach");
  if (error) return NextResponse.json({ error: "記録を削除できませんでした。" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
