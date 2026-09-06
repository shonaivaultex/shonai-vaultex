"use client";

import { useEffect, useState } from "react";
import { Link2, MessageCircle } from "lucide-react";

type Preferences = { notify_important: boolean; notify_schedule: boolean; notify_feedback: boolean; notify_training_log_reminder: boolean; notify_attendance_reminder: boolean };
type Props = { portal?: "athlete" | "family"; initial: (Preferences & { display_name: string | null }) | null; configured: boolean };

const athleteOptions: Array<[keyof Preferences, string]> = [["notify_important", "重要なお知らせ"], ["notify_schedule", "予定の変更・中止"], ["notify_feedback", "コーチのフィードバック"], ["notify_training_log_reminder", "21時の練習・本番記録"]];
const familyOptions: Array<[keyof Preferences, string]> = [["notify_important", "重要なお知らせ"], ["notify_schedule", "予定の変更・中止"], ["notify_attendance_reminder", "出欠の回答忘れ"]];

export default function LineConnectionSettings({ portal = "athlete", initial, configured }: Props) {
  const [connection, setConnection] = useState(initial);
  const [saving, setSaving] = useState(false);
  const family = portal === "family";
  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("line");
    if (result === "connected") window.history.replaceState({}, "", window.location.pathname + window.location.hash);
  }, []);
  if (!configured) return <div className="mt-4 rounded-xl border border-black/10 p-4 text-sm opacity-60">LINE連携は管理者設定の完了後に利用できます。</div>;
  if (!connection) return <a href={`/api/line/connect?portal=${portal}&next=${encodeURIComponent(family ? "/family/settings" : "/mypage/menu")}`} className={`mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#06c755] px-5 py-4 text-sm font-black text-white transition hover:bg-[#05b64d]`}><MessageCircle size={19}/>公式LINEとこのアカウントを連携</a>;
  const options = family ? familyOptions : athleteOptions;
  async function toggle(key: keyof Preferences) {
    const next = { ...connection!, [key]: !connection![key] }; setConnection(next); setSaving(true);
    const response = await fetch("/api/line/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: next[key] }) });
    setSaving(false); if (!response.ok) { setConnection(connection); alert("LINE通知設定を保存できませんでした。"); }
  }
  async function disconnect() {
    if (!confirm("このアカウントとLINEの連携を解除しますか？")) return;
    setSaving(true); const response = await fetch("/api/line/settings", { method: "DELETE" }); setSaving(false);
    if (response.ok) setConnection(null); else alert("LINE連携を解除できませんでした。");
  }
  return <div className="mt-4 overflow-hidden rounded-xl border border-[#06c755]/35 bg-[#06c755]/[.06]">
    <div className="flex items-center gap-3 px-4 py-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#06c755] text-white"><Link2 size={19}/></span><span className="min-w-0 flex-1"><strong className="block text-sm">LINE連携済み</strong><span className="block truncate text-xs opacity-50">{connection.display_name || "連携中のLINEアカウント"}</span></span></div>
    <div className="border-t border-current/10 px-4">{options.map(([key, label]) => <div key={key} className="flex items-center gap-3 border-b border-current/10 py-3 last:border-0"><span className="flex-1 text-sm font-bold">{label}</span><button type="button" role="switch" aria-checked={connection[key]} disabled={saving} onClick={() => toggle(key)} className={`relative h-7 w-12 rounded-full transition ${connection[key] ? "bg-[#06c755]" : "bg-current/15"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${connection[key] ? "left-6" : "left-1"}`}/></button></div>)}</div>
    <button type="button" disabled={saving} onClick={disconnect} className="w-full border-t border-current/10 px-4 py-3 text-xs font-bold opacity-50">LINE連携を解除</button>
  </div>;
}
