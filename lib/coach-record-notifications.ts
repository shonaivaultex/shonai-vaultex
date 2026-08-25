import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase-admin";

type RecordNotice = {
  athleteId: string;
  kind: "athletics" | "unofficial-athletics" | "control-test";
  updated?: boolean;
};

type PushTarget = { user_id: string; endpoint: string; p256dh: string; auth: string };

const destinations = {
  athletics: "/mypage/athletics",
  "unofficial-athletics": "/mypage/unofficial-athletics",
  "control-test": "/mypage/control-tests",
} as const;

export async function sendCoachRecordNotifications(notices: RecordNotice[]) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!notices.length || !publicKey || !privateKey) return;

  const unique = [...new Map(notices.map((notice) => [`${notice.athleteId}:${notice.kind}`, notice])).values()];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", [...new Set(unique.map((notice) => notice.athleteId))])
    .eq("notify_coach_records", true);
  if (error) {
    console.error("Coach record notification targets failed", error);
    return;
  }

  webpush.setVapidDetails("mailto:info@shonai-vaultex.jp", publicKey, privateKey);
  const targets = (data ?? []) as PushTarget[];
  await Promise.all(unique.flatMap((notice) => targets.filter((target) => target.user_id === notice.athleteId).map(async (target) => {
    const payload = {
      title: notice.updated ? "コーチが記録を更新しました" : "コーチが記録を追加しました",
      body: "マイページで記録を確認しましょう。",
      url: destinations[notice.kind],
      tag: `coach-record-${notice.kind}`,
    };
    try {
      await webpush.sendNotification({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, JSON.stringify(payload));
    } catch (pushError) {
      const statusCode = typeof pushError === "object" && pushError && "statusCode" in pushError ? Number(pushError.statusCode) : null;
      console.error("Coach record notification failed", { statusCode });
    }
  })));
}
