"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, MessageSquare, Send, SmilePlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export type VideoFeedbackMessage = {
  id: number;
  sender_id: string;
  sender_role: "athlete" | "coach";
  body: string;
  created_at: string;
  read_by_athlete?: boolean;
  video_feedback_message_reactions?: Array<{ user_id: string; reaction: Reaction }>;
};

type Reaction = "👍" | "🔥" | "💡" | "✅";
const reactions: Reaction[] = ["👍", "🔥", "💡", "✅"];

export default function VideoFeedbackConversation({ requestId, messages, role }: { requestId: number; messages: VideoFeedbackMessage[]; role: "athlete" | "coach" }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState(messages);
  const [reactingTo, setReactingTo] = useState<number | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<number | null>(null);
  const [markingRead, setMarkingRead] = useState<number | null>(null);

  useEffect(() => { createClient().auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null)); }, []);
  useEffect(() => { setConversationMessages(messages); }, [messages]);

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

  async function toggleReaction(messageId: number, reaction: Reaction) {
    if (reactingTo) return;
    setReactingTo(messageId);
    setError("");
    const supabase = createClient();
    const userId = currentUserId ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) { setError("ログインが必要です。"); setReactingTo(null); return; }
    const message = conversationMessages.find((item) => item.id === messageId);
    const own = message?.video_feedback_message_reactions?.find((item) => item.user_id === userId);
    const operation = own?.reaction === reaction
      ? supabase.from("video_feedback_message_reactions").delete().eq("message_id", messageId).eq("user_id", userId)
      : supabase.from("video_feedback_message_reactions").upsert({ message_id: messageId, user_id: userId, reaction }, { onConflict: "message_id,user_id" });
    const { error: reactionError } = await operation;
    if (reactionError) setError("リアクションを保存できませんでした。");
    else {
      const marksAthleteRead = role === "athlete" && message?.sender_role === "coach";
      if (marksAthleteRead) await supabase.from("video_feedback_message_reads").upsert({ message_id: messageId, user_id: userId }, { onConflict: "message_id,user_id", ignoreDuplicates: true });
      setConversationMessages((current) => current.map((item) => item.id !== messageId ? item : { ...item, read_by_athlete: item.read_by_athlete || marksAthleteRead, video_feedback_message_reactions: own?.reaction === reaction ? (item.video_feedback_message_reactions ?? []).filter((entry) => entry.user_id !== userId) : [...(item.video_feedback_message_reactions ?? []).filter((entry) => entry.user_id !== userId), { user_id: userId, reaction }] }));
    }
    setReactionPickerFor(null);
    setReactingTo(null);
  }

  async function markRead(messageId: number) {
    if (markingRead) return;
    setMarkingRead(messageId);
    setError("");
    const supabase = createClient();
    const userId = currentUserId ?? (await supabase.auth.getUser()).data.user?.id;
    if (!userId) { setError("ログインが必要です。"); setMarkingRead(null); return; }
    const { error: readError } = await supabase.from("video_feedback_message_reads").upsert({ message_id: messageId, user_id: userId }, { onConflict: "message_id,user_id", ignoreDuplicates: true });
    if (readError) setError("確認状態を保存できませんでした。");
    else setConversationMessages((current) => current.map((item) => item.id === messageId ? { ...item, read_by_athlete: true } : item));
    setMarkingRead(null);
  }

  return <section className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
    <h4 className="flex items-center gap-2 text-sm font-black"><MessageSquare size={16} className="text-sky-400" />やり取り</h4>
    {conversationMessages.length ? <div className="mt-4 space-y-3">{conversationMessages.map((message) => {
      const mine = message.sender_role === role;
      const usedReactions = reactions.filter((reaction) => message.video_feedback_message_reactions?.some((item) => item.reaction === reaction));
      return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className="max-w-[88%]"><div className={`rounded-2xl px-4 py-3 ${message.sender_role === "coach" ? "bg-orange-500/15 text-orange-50" : "bg-sky-500/15 text-sky-50"}`}><p className="text-[11px] font-black opacity-60">{message.sender_role === "coach" ? "コーチ" : "選手"}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className="mt-1 text-[10px] opacity-35">{new Date(message.created_at).toLocaleString("ja-JP")}</p></div><div className={`relative mt-1 flex flex-wrap items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>{usedReactions.map((reaction) => { const entries = message.video_feedback_message_reactions?.filter((item) => item.reaction === reaction) ?? []; const selected = entries.some((item) => item.user_id === currentUserId); return <button key={reaction} type="button" aria-label={`${reaction}のリアクション`} aria-pressed={selected} disabled={reactingTo === message.id} onClick={() => toggleReaction(message.id, reaction)} className={`rounded-full border px-2 py-1 text-xs transition disabled:opacity-50 ${selected ? "border-orange-400/70 bg-orange-500/20" : "border-white/10 bg-white/[0.03] hover:bg-white/10"}`}>{reaction}<span className="ml-1 text-[10px] opacity-60">{entries.length}</span></button>; })}<button type="button" aria-label="リアクションを追加" aria-expanded={reactionPickerFor === message.id} onClick={() => setReactionPickerFor((current) => current === message.id ? null : message.id)} className="grid h-7 w-7 place-items-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white/70"><SmilePlus size={15} /></button>{message.sender_role === "coach" && (message.read_by_athlete ? <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400"><Check size={12} />確認済み</span> : role === "athlete" ? <button type="button" disabled={markingRead === message.id} onClick={() => markRead(message.id)} className="ml-1 rounded-full border border-emerald-500/35 px-2.5 py-1 text-[10px] font-bold text-emerald-300 disabled:opacity-50">{markingRead === message.id ? "保存中" : "確認しました"}</button> : <span className="ml-1 text-[10px] text-white/25">未確認</span>)}{reactionPickerFor === message.id && <div className={`absolute top-8 z-10 flex gap-1 rounded-full border border-white/15 bg-[#1b1b1b] p-1.5 shadow-2xl ${mine ? "right-0" : "left-0"}`}>{reactions.map((reaction) => <button key={reaction} type="button" disabled={reactingTo === message.id} onClick={() => toggleReaction(message.id, reaction)} className="grid h-9 w-9 place-items-center rounded-full text-lg transition hover:bg-white/10 disabled:opacity-50">{reaction}</button>)}</div>}</div></div></div>;
    })}</div> : <p className="mt-3 text-xs text-white/35">まだ返信はありません。</p>}
    <form onSubmit={submit} className="mt-4 border-t border-white/10 pt-4"><textarea required maxLength={1000} rows={3} value={body} onChange={(event) => setBody(event.target.value)} placeholder={role === "coach" ? "回答や追加アドバイスを入力" : "追加の質問や結果を入力"} className="w-full resize-none rounded-lg border border-white/15 bg-[#0b0b0b] px-3 py-3 text-sm text-white" />{error && <p className="mt-2 text-xs text-red-300">{error}</p>}<div className="mt-2 flex items-center justify-between"><span className="text-xs text-white/30">{body.length}/1000</span><button disabled={saving || !body.trim()} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-black disabled:opacity-40 ${role === "coach" ? "bg-orange-500" : "bg-sky-500 text-black"}`}><Send size={14} />{saving ? "送信中" : "返信する"}</button></div></form>
  </section>;
}
