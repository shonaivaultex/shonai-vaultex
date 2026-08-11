"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

function decodeKey(value: string) { const padding = "=".repeat((4 - value.length % 4) % 4); const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)); }

export default function PushNotificationButton() {
  const [supported, setSupported] = useState(false); const [enabled, setEnabled] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => { setSupported("serviceWorker" in navigator && "PushManager" in window && "Notification" in window); navigator.serviceWorker?.ready.then((registration) => registration.pushManager.getSubscription()).then((subscription) => setEnabled(Boolean(subscription))).catch(() => undefined); }, []);
  if (!supported) return null;
  async function enable() {
    setSaving(true);
    try {
      const permission = await Notification.requestPermission(); if (permission !== "granted") { alert("通知が許可されませんでした。端末の設定から通知を許可してください。"); return; }
      const registration = await navigator.serviceWorker.ready; const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; if (!publicKey) throw new Error("通知設定がまだ完了していません。");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) }); const json = subscription.toJSON(); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user || !json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("端末を登録できませんでした。");
      const { error } = await supabase.from("push_subscriptions").upsert({ user_id: user.id, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, user_agent: navigator.userAgent, updated_at: new Date().toISOString() }, { onConflict: "endpoint" }); if (error) throw error; setEnabled(true);
    } catch (error) { alert(error instanceof Error ? error.message : "通知を設定できませんでした。"); } finally { setSaving(false); }
  }
  return <button type="button" onClick={enable} disabled={saving || enabled} className={`mt-5 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold ${enabled ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-orange-500/30 bg-orange-500/[0.07] text-orange-300"}`}><span className="flex items-center gap-2">{enabled ? <BellRing size={17} /> : <Bell size={17} />}{enabled ? "通知はONです" : "お知らせ通知をONにする"}</span><span className="text-xs font-normal opacity-60">{saving ? "設定中…" : enabled ? "設定済み" : "タップして許可"}</span></button>;
}
