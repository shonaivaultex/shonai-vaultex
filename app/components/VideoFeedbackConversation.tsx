"use client";

import { FormEvent, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export type VideoFeedbackMessage = {
  id: number;
  sender_id: string;
  sender_role: "athlete" | "coach";
  body: string;
  created_at: string;
};

export default function VideoFeedbackConversation({ requestId, messages, role }: { requestId: number; messages: VideoFeedbackMessage[]; role: "athlete" | "coach" }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("ログインが必要です。"); setSaving(false); return; }
    const { error: saveError } = await supabase.from("video_feedback_messages").insert({ request_id: requestId, sender_id: user.id, sender_role: role, body: body.trim() });
    if (saveError) { setError(saveError.message); setSaving(false); return; }
    await fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "video_feedback", requestId, senderRole: role, isInitial: false }) }).catch(() => undefined);
    setBody("");
    setSaving(false);
    router.refresh();
  }

  return <section className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
    <h4 className="flex items-center gap-2 text-sm font-black"><MessageSquare size={16} className="text-sky-400" />やり取り</h4>
    {messages.length ? <div className="mt-4 space-y-3">{messages.map((message) => {
      const mine = message.sender_role === role;
      return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className={`max-w-[88%] rounded-2xl px-4 py-3 ${message.sender_role === "coach" ? "bg-orange-500/15 text-orange-50" : "bg-sky-500/15 text-sky-50"}`}><p className="text-[11px] font-black opacity-60">{message.sender_role === "coach" ? "コーチ" : "選手"}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className="mt-1 text-[10px] opacity-35">{new Date(message.created_at).toLocaleString("ja-JP")}</p></div></div>;
    })}</div> : <p className="mt-3 text-xs text-white/35">まだ返信はありません。</p>}
    <form onSubmit={submit} className="mt-4 border-t border-white/10 pt-4"><textarea required maxLength={1000} rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder={role === "coach" ? "回答や追加アドバイスを入力" : "追加の質問や結果を入力"} className="w-full resize-none rounded-lg border border-white/15 bg-[#0b0b0b] px-3 py-3 text-sm text-white" />{error && <p className="mt-2 text-xs text-red-300">{error}</p>}<div className="mt-2 flex items-center justify-between"><span className="text-xs text-white/30">{body.length}/1000</span><button disabled={saving || !body.trim()} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black disabled:opacity-40 ${role === "coach" ? "bg-orange-500" : "bg-sky-500 text-black"}`}><Send size={14} />{saving ? "送信中" : "返信する"}</button></div></form>
  </section>;
}
