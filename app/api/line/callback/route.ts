import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { exchangeLineCode, fetchLineProfile, lineCallbackUrl, safeInternalPath, type LinePortal } from "@/lib/line";

type OAuthState = { state: string; mode: "connect" | "login"; portal: LinePortal; next: string };

function errorRedirect(origin: string, code: string, fallback = "/login") {
  const target = new URL(fallback, origin);
  target.searchParams.set("line", code);
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const store = await cookies();
  const raw = store.get("vaultex_line_oauth")?.value;
  store.delete("vaultex_line_oauth");
  let saved: OAuthState | null = null;
  try { saved = raw ? JSON.parse(raw) as OAuthState : null; } catch { saved = null; }
  const code = url.searchParams.get("code");
  if (!saved || !code || url.searchParams.get("state") !== saved.state) return errorRedirect(url.origin, "invalid_state");
  try {
    const token = await exchangeLineCode(code, lineCallbackUrl(url.origin));
    const profile = await fetchLineProfile(token.access_token);
    const admin = createAdminClient();
    if (saved.mode === "connect") {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return errorRedirect(url.origin, "login_required", `/login?next=${encodeURIComponent(saved.next)}`);
      const { data: occupied } = await admin.from("line_account_connections").select("user_id").eq("line_user_id", profile.userId).maybeSingle();
      if (occupied && occupied.user_id !== user.id) return errorRedirect(url.origin, "already_connected", saved.next);
      const { error } = await admin.from("line_account_connections").upsert({
        user_id: user.id, line_user_id: profile.userId, portal: saved.portal,
        display_name: profile.displayName ?? null, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,portal" });
      if (error) throw error;
      const destination = new URL(safeInternalPath(saved.next), url.origin);
      destination.searchParams.set("line", "connected");
      return NextResponse.redirect(destination);
    }

    const { data: connection } = await admin.from("line_account_connections").select("user_id,portal").eq("line_user_id", profile.userId).maybeSingle();
    if (!connection) return errorRedirect(url.origin, "not_connected");
    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(connection.user_id);
    const email = userResult.user?.email;
    if (userError || !email) throw userError ?? new Error("Email missing");
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    if (linkError) throw linkError;
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
    if (verifyError) throw verifyError;
    const fallback = connection.portal === "family" ? "/family" : "/mypage";
    return NextResponse.redirect(new URL(safeInternalPath(saved.next, fallback), url.origin));
  } catch (error) {
    console.error("LINE OAuth failed", { message: error instanceof Error ? error.message : "unknown" });
    return errorRedirect(url.origin, "failed");
  }
}
