import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

const preferenceKeys = [
  "notify_feedback",
  "notify_important",
  "notify_schedule",
  "notify_coach_records",
  "notify_training_log_reminder",
  "notify_attendance_reminder",
] as const;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const p256dh = typeof body.p256dh === "string" ? body.p256dh : "";
  const auth = typeof body.auth === "string" ? body.auth : "";
  if (!endpoint.startsWith("https://") || endpoint.length > 2000 || !p256dh || p256dh.length > 500 || !auth || auth.length > 500) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const preferences = Object.fromEntries(preferenceKeys.map((key) => [key, body.preferences?.[key] !== false]));
  const admin = createAdminClient();
  const { data: existing, error: lookupError } = await admin.from("push_subscriptions").select("p256dh,auth").eq("endpoint", endpoint).maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (existing && (existing.p256dh !== p256dh || existing.auth !== auth)) return NextResponse.json({ error: "Subscription ownership could not be verified" }, { status: 409 });
  const { error } = await admin.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    p256dh,
    auth,
    user_agent: request.headers.get("user-agent"),
    ...preferences,
    updated_at: new Date().toISOString(),
  }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
