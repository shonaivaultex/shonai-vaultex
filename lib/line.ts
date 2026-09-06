import "server-only";

export type LinePortal = "athlete" | "family";
export type LineNotificationKind =
  | "important"
  | "schedule"
  | "feedback"
  | "training_log_reminder"
  | "attendance_reminder";

type LineProfile = { userId: string; displayName?: string };

export function lineConfigured() {
  return Boolean(process.env.LINE_LOGIN_CHANNEL_ID && process.env.LINE_LOGIN_CHANNEL_SECRET);
}

export function safeInternalPath(value: string | null, fallback = "/mypage") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

export function lineCallbackUrl(origin: string) {
  const configured = process.env.LINE_LOGIN_CALLBACK_URL;
  return configured || `${origin}/api/line/callback`;
}

export async function exchangeLineCode(code: string, redirectUri: string) {
  const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("LINE認証コードを確認できませんでした。");
  return response.json() as Promise<{ access_token: string }>;
}

export async function fetchLineProfile(accessToken: string) {
  const response = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("LINEプロフィールを確認できませんでした。");
  return response.json() as Promise<LineProfile>;
}

export async function sendLineMessage(lineUserId: string, title: string, body: string, path: string) {
  const token = process.env.LINE_MESSAGING_CHANNEL_ACCESS_TOKEN;
  if (!token) return { sent: false, reason: "not_configured" as const };
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://shonai-vaultex.vercel.app").replace(/\/$/, "");
  const response = await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text: `${title}\n${body}\n${appUrl}${safeInternalPath(path)}` }],
    }),
    cache: "no-store",
  });
  return { sent: response.ok, reason: response.ok ? undefined : `http_${response.status}` };
}

export function preferenceColumn(kind: LineNotificationKind) {
  return `notify_${kind}` as const;
}
