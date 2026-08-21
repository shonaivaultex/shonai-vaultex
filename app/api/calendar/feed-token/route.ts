import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function subscriptionDetails(request: Request, token: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const feedUrl = `${origin}/api/calendar/feed/${token}`;
  const webcalUrl = feedUrl.replace(/^https?:\/\//, "webcal://");
  const googleUrl = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(feedUrl)}`;
  return { feedUrl, webcalUrl, googleUrl };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });

  const { data: existing, error: readError } = await supabase.from("calendar_feed_tokens").select("token").eq("user_id", user.id).maybeSingle();
  if (readError) return NextResponse.json({ error: "カレンダー同期の準備が完了していません。" }, { status: 503 });
  if (existing?.token) return NextResponse.json(subscriptionDetails(request, existing.token));

  const { data: created, error: createError } = await supabase.from("calendar_feed_tokens").insert({ user_id: user.id }).select("token").single();
  if (createError || !created) return NextResponse.json({ error: "同期用URLを作成できませんでした。" }, { status: 500 });
  return NextResponse.json(subscriptionDetails(request, created.token));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  const token = crypto.randomUUID();
  const { error } = await supabase.from("calendar_feed_tokens").upsert({ user_id: user.id, token, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "同期URLを再発行できませんでした。" }, { status: 500 });
  return NextResponse.json(subscriptionDetails(request, token));
}

