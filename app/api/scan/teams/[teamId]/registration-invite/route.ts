import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { randomInviteCode } from "@/lib/scan-invite";
import QRCode from "qrcode";

export async function POST(_: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 }); if (!hasAdminKey()) return NextResponse.json({ error: "サーバー設定が完了していません。" }, { status: 503 });
  const admin = createAdminClient(); const { data: member } = await admin.from("scan_team_members").select("role").eq("team_id", teamId).eq("user_id", user.id).in("role", ["owner", "coach"]).maybeSingle(); if (!member) return NextResponse.json({ error: "操作権限がありません。" }, { status: 403 });
  await admin.from("scan_roster_invites").update({ active: false }).eq("team_id", teamId).eq("active", true); const code = randomInviteCode(); const { error } = await admin.from("scan_roster_invites").insert({ team_id: teamId, invite_code: code, created_by: user.id }); if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const url = `${new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://shonai-vaultex.vercel.app")}/scan/register/${code}`; return NextResponse.json({ ok: true, url, qrDataUrl: await QRCode.toDataURL(url, { width: 640, margin: 2 }) });
}
