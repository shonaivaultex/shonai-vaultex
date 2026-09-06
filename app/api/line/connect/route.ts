import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { lineCallbackUrl, lineConfigured, safeInternalPath, type LinePortal } from "@/lib/line";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!lineConfigured()) return NextResponse.redirect(new URL("/login?line=not_configured", url.origin));
  const mode = url.searchParams.get("mode") === "login" ? "login" : "connect";
  const portal: LinePortal = url.searchParams.get("portal") === "family" ? "family" : "athlete";
  const next = safeInternalPath(url.searchParams.get("next"), portal === "family" ? "/family/settings" : "/mypage/menu");
  if (mode === "connect") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, url.origin));
  }
  const state = randomBytes(32).toString("base64url");
  const store = await cookies();
  const secure = url.protocol === "https:";
  store.set("vaultex_line_oauth", JSON.stringify({ state, mode, portal, next }), { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 600 });
  const authorize = new URL("https://access.line.me/oauth2/v2.1/authorize");
  authorize.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
    redirect_uri: lineCallbackUrl(url.origin),
    state,
    scope: "profile openid",
    bot_prompt: "aggressive",
  }).toString();
  return NextResponse.redirect(authorize);
}
