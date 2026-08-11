"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Send } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function CoachFeedbackForm({ recordId }: { recordId: number }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("ログインが必要です。"); setSaving(false); return; }
    const { error: saveError } = await supabase.from("coach_feedback").insert({ record_id: recordId, coach_id: user.id, body: body.trim() });
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    setBody(""); router.refresh();
  }
  return <form onSubmit={submit} className="mt-4 rounded-xl border border-orange-500/25 bg-orange-500/[0.05] p-4">
    <label className="flex items-center gap-2 text-xs font-black tracking-[0.1em] text-orange-300"><MessageSquare size={15} />フィードバック</label>
    <textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={1000} rows={3} placeholder="良かった点・改善ポイント・次回意識すること" className="mt-3 w-full resize-none rounded-lg border border-white/15 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500" />
    {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    <div className="mt-2 flex items-center justify-between"><span className="text-xs text-white/30">{body.length}/1000</span><button disabled={saving || !body.trim()} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-black text-white disabled:opacity-40"><Send size={14} />{saving ? "送信中" : "送信"}</button></div>
  </form>;
}
