import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const allowed = new Set(["notify_important", "notify_schedule", "notify_feedback", "notify_training_log_reminder", "notify_attendance_reminder"]);

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>;
  const updates = Object.fromEntries(Object.entries(body).filter(([key, value]) => allowed.has(key) && typeof value === "boolean"));
  if (!Object.keys(updates).length) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { error } = await supabase.from("line_account_connections").update({ ...updates, updated_at: new Date().toISOString() }).eq("user_id", user.id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { error } = await supabase.from("line_account_connections").delete().eq("user_id", user.id);
  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true });
}
