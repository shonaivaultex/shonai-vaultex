"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function CoachFeedbackActions({ feedbackId, initialBody }: { feedbackId: number; initialBody: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    const nextBody = body.trim();
    if (!nextBody) return;
    setSaving(true);
    const { error } = await createClient().from("coach_feedback").update({ body: nextBody }).eq("id", feedbackId);
    setSaving(false);
    if (error) { alert("編集できませんでした：" + error.message); return; }
    setEditing(false); router.refresh();
  }

  async function remove() {
    if (!confirm("このフィードバックを削除しますか？")) return;
    setSaving(true);
    const { error } = await createClient().from("coach_feedback").delete().eq("id", feedbackId);
    setSaving(false);
    if (error) { alert("削除できませんでした：" + error.message); return; }
    router.refresh();
  }

  if (editing) return <form onSubmit={save} className="mt-3">
    <textarea value={body} onChange={(event) => setBody(event.target.value)} required maxLength={1000} rows={3} className="w-full resize-none rounded-lg border border-emerald-500/30 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-emerald-400" />
    <div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => { setBody(initialBody); setEditing(false); }} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60"><X size={13} />キャンセル</button><button disabled={saving || !body.trim()} className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black disabled:opacity-50"><Check size={13} />{saving ? "保存中" : "保存"}</button></div>
  </form>;

  return <div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs text-white/60 hover:text-white"><Pencil size={13} />編集</button><button type="button" disabled={saving} onClick={remove} className="inline-flex items-center gap-1 rounded-lg border border-red-500/25 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"><Trash2 size={13} />削除</button></div>;
}
