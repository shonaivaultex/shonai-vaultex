"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

type Preferences = { notify_feedback: boolean; notify_important: boolean; notify_schedule: boolean; notify_coach_records: boolean; notify_training_log_reminder: boolean; notify_attendance_reminder: boolean };
const defaults: Preferences = { notify_feedback: true, notify_important: true, notify_schedule: true, notify_coach_records: true, notify_training_log_reminder: true, notify_attendance_reminder: true };
const options: Array<{ key: keyof Preferences; title: string; detail: string }> = [
  { key: "notify_feedback", title: "フィードバック", detail: "依頼・回答・再質問が届いた時" },
  { key: "notify_important", title: "重要なお知らせ", detail: "重要に設定されたクラブ連絡" },
  { key: "notify_schedule", title: "予定変更", detail: "練習予定の変更・中止" },
  { key: "notify_coach_records", title: "コーチ入力の記録", detail: "コーチが練習・大会記録や測定値を追加した時" },
  { key: "notify_training_log_reminder", title: "練習・本番記録の入力忘れ", detail: "参加日の21:00に、未入力の記録画面を直接開く通知" },
];
const familyOptions: Array<{ key: keyof Preferences; title: string; detail: string }> = [
  { key: "notify_schedule", title: "予定の追加・変更・中止", detail: "練習や大会の予定が更新された時" },
  { key: "notify_important", title: "重要なお知らせ", detail: "会場変更・持ち物などの大切な連絡" },
  { key: "notify_attendance_reminder", title: "出欠の回答忘れ", detail: "近い予定の出欠が未回答の時（代表保護者のみ）" },
];

function decodeKey(value: string) { const padding = "=".repeat((4 - value.length % 4) % 4); const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)); }

async function registerSubscription(subscription: PushSubscription, preferences: Preferences) {
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("端末を登録できませんでした。");
  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth, preferences }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "端末を登録できませんでした。");
  return json.endpoint;
}

export default function PushNotificationButton({ portal = "athlete" }: { portal?: "athlete" | "family" }) {
  const [supported] = useState(() => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window); const [enabled, setEnabled] = useState(false); const [saving, setSaving] = useState(false); const [open, setOpen] = useState(false); const [endpoint, setEndpoint] = useState<string | null>(null); const [preferences, setPreferences] = useState(defaults);
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then(async (registration) => {
      const subscription = await registration.pushManager.getSubscription(); setEnabled(Boolean(subscription)); setEndpoint(subscription?.endpoint ?? null);
      if (!subscription) return;
      const { data } = await createClient().from("push_subscriptions").select("notify_feedback, notify_important, notify_schedule, notify_coach_records, notify_training_log_reminder, notify_attendance_reminder").eq("endpoint", subscription.endpoint).maybeSingle();
      if (data) setPreferences(data as Preferences);
      else setEnabled(false);
    }).catch(() => undefined);
  }, [supported]);
  if (!supported) return null;

  async function enable() {
    setSaving(true);
    try {
      const permission = await Notification.requestPermission(); if (permission !== "granted") { alert("通知が許可されませんでした。端末の設定から通知を許可してください。"); return; }
      const registration = await navigator.serviceWorker.ready; const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY; if (!publicKey) throw new Error("通知設定がまだ完了していません。");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
      const registeredEndpoint = await registerSubscription(subscription, preferences); setEndpoint(registeredEndpoint); setEnabled(true); setOpen(true);
    } catch (error) { alert(error instanceof Error ? error.message : "通知を設定できませんでした。"); } finally { setSaving(false); }
  }

  async function toggle(key: keyof Preferences) {
    if (!endpoint) return; const next = { ...preferences, [key]: !preferences[key] }; setPreferences(next); setSaving(true);
    const { error } = await createClient().from("push_subscriptions").update({ [key]: next[key], updated_at: new Date().toISOString() }).eq("endpoint", endpoint); setSaving(false);
    if (error) { setPreferences(preferences); alert("通知設定を保存できませんでした：" + error.message); }
  }

  async function sendTest() {
    if (!endpoint) return;
    setSaving(true);
    try {
      const response = await fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "test", portal }) });
      const result = await response.json();
      if (!response.ok || result.sent < 1) throw new Error(result.error || `通知を送信できませんでした（登録${result.attempted ?? 0}台）。${result.reasons?.length ? `\n理由：${result.reasons.join("、")}` : ""}`);
      alert(`登録済み${result.attempted}台のうち${result.sent}台へテスト通知を送信しました。スマホの通知をご確認ください。`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "テスト通知を送信できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  async function reregister() {
    setSaving(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const current = await registration.pushManager.getSubscription();
      if (current) {
        await createClient().from("push_subscriptions").delete().eq("endpoint", current.endpoint);
        await current.unsubscribe();
      }
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) throw new Error("通知設定がまだ完了していません。");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
      const registeredEndpoint = await registerSubscription(subscription, preferences);
      setEndpoint(registeredEndpoint);
      alert("この端末の通知を再登録しました。続けてテスト通知をお試しください。");
    } catch (error) {
      alert(error instanceof Error ? error.message : "通知を再登録できませんでした。");
    } finally {
      setSaving(false);
    }
  }

  const family = portal === "family";
  const visibleOptions = family ? familyOptions : options;
  return <section className={`mt-5 overflow-hidden rounded-xl border ${enabled ? "border-emerald-500/35 bg-emerald-500/[0.07]" : "border-orange-500/35 bg-orange-500/[0.08]"} ${family ? "text-black" : "text-white"}`}>
    {!enabled ? <button type="button" onClick={enable} disabled={saving} className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-bold ${family ? "text-orange-700" : "text-orange-300"}`}><span className="flex items-center gap-2"><Bell size={17} />お知らせ通知をONにする</span><span className="shrink-0 text-xs font-normal opacity-60">{saving ? "設定中…" : "タップして許可"}</span></button> : <>
      <button type="button" onClick={() => setOpen((current) => !current)} className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold ${family ? "text-emerald-700" : "text-emerald-300"}`}><BellRing size={17} /><span>通知設定</span><span className="ml-auto text-xs font-normal opacity-60">通知ON</span><ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} /></button>
      {open && <div className={`divide-y px-4 ${family ? "divide-black/10 border-t border-black/10" : "divide-white/10 border-t border-white/10"}`}>{visibleOptions.map((option) => <div key={option.key} className="flex items-center gap-4 py-3"><div className="min-w-0 flex-1"><strong className={`block text-sm ${family ? "text-black/85" : "text-white/85"}`}>{option.title}</strong><span className={`text-xs ${family ? "text-black/50" : "text-white/40"}`}>{option.detail}</span></div><button type="button" role="switch" aria-label={`${option.title}を${preferences[option.key] ? "オフ" : "オン"}にする`} aria-checked={preferences[option.key]} disabled={saving} onClick={() => toggle(option.key)} className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${preferences[option.key] ? "bg-emerald-500" : family ? "bg-black/15" : "bg-white/15"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${preferences[option.key] ? "left-6" : "left-1"}`} /></button></div>)}<div className="space-y-2 py-3"><button type="button" disabled={saving} onClick={sendTest} className={`w-full rounded-lg border px-4 py-2 text-sm font-bold transition disabled:opacity-50 ${family ? "border-emerald-600/35 text-emerald-700 hover:bg-emerald-500/10" : "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"}`}>{saving ? "処理中…" : "このアカウントへテスト通知"}</button><button type="button" disabled={saving} onClick={reregister} className={`w-full rounded-lg border px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${family ? "border-black/15 text-black/55 hover:bg-black/5" : "border-white/15 text-white/60 hover:bg-white/5"}`}>この端末の通知を再登録</button></div></div>}
    </>}
  </section>;
}
