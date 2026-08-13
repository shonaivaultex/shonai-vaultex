"use client";

import { FormEvent, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function StandaloneVideoFeedbackForm({ requestId, initialBody }: { requestId: number; initialBody?: string }) {
  const router = useRouter(); const [body, setBody] = useState(initialBody ?? ""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(""); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { setError("ログインが必要です。"); setSaving(false); return; } const { error: saveError } = await supabase.from("video_feedback_requests").update({ response: body.trim(), responded_by: user.id, responded_at: new Date().toISOString(), status: "answered" }).eq("id", requestId); setSaving(false); if (saveError) { setError(saveError.message); return; } router.refresh(); }
  return <form onSubmit={submit} className="mt-5 rounded-xl border border-orange-500/25 bg-orange-500/[0.05] p-4"><label className="flex items-center gap-2 text-xs font-black text-orange-300"><MessageSquare size={15} />{initialBody ? "フィードバックを編集" : "依頼に回答する"}</label><textarea required maxLength={1000} rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="良かった点・改善ポイント・次回意識すること" className="mt-3 w-full resize-none rounded-lg border border-white/15 bg-black/30 px-3 py-3 text-sm text-white" />{error && <p className="mt-2 text-xs text-red-300">{error}</p>}<div className="mt-2 flex items-center justify-between"><span className="text-xs text-white/30">{body.length}/1000</span><button disabled={saving || !body.trim()} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-black disabled:opacity-40"><Send size={14} />{saving ? "送信中" : initialBody ? "更新する" : "送信する"}</button></div></form>;
}
