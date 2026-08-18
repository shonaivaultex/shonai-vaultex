"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Compass, ExternalLink, History, LoaderCircle, MessageCircleMore, Plus, Send, ShieldCheck, UserRound, X } from "lucide-react";
import { initialCompanionAnswer, navigatorPrinciples, type CompanionAnswer } from "@/lib/ai-navigator/knowledge";

export type Conversation = { id: string; title: string; status: string; last_message_at: string; created_at: string };
export type Message = { id: number | string; role: "user" | "companion"; content: string; response_payload: CompanionAnswer | Record<string, never>; created_at: string };
export type CompanionInitialData = { conversations: Conversation[]; activeId: string | null; messages: Message[] };

export default function AiNavigator({ initialData }: { initialData: CompanionInitialData }) {
  const [conversations, setConversations] = useState<Conversation[]>(initialData.conversations);
  const [activeId, setActiveId] = useState<string | null>(initialData.activeId);
  const [messages, setMessages] = useState<Message[]>(initialData.messages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (conversationId?: string | null) => {
    setLoading(true); setError("");
    const query = conversationId ? `?conversationId=${encodeURIComponent(conversationId)}` : "";
    const response = await fetch(`/api/ai-companion${query}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "会話を読み込めませんでした。");
    else { setConversations(data.conversations); setActiveId(data.activeId); setMessages(data.messages); }
    setLoading(false);
  }, []);

  useEffect(() => { if (!loading) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, loading]);

  async function send(text: string) {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true); setError(""); setInput("");
    const optimistic: Message = { id: `pending-${Date.now()}`, role: "user", content: value, response_payload: {}, created_at: new Date().toISOString() };
    setMessages((current) => [...current, optimistic]);
    const response = await fetch("/api/ai-companion", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: activeId, message: value }) });
    const data = await response.json();
    if (!response.ok) { setMessages((current) => current.filter((item) => item.id !== optimistic.id)); setError(data.error ?? "送信できませんでした。"); }
    else { setActiveId(data.conversationId); setMessages((current) => [...current.filter((item) => item.id !== optimistic.id), ...data.messages]); if (data.isNew) await load(data.conversationId); }
    setSending(false);
  }

  function submit(event: FormEvent) { event.preventDefault(); void send(input); }
  function newConversation() { setActiveId(null); setMessages([]); setHistoryOpen(false); setError(""); }
  async function selectConversation(id: string) { setHistoryOpen(false); await load(id); }

  const visibleMessages: Array<Message | { id: "initial"; role: "companion"; content: string; response_payload: CompanionAnswer; created_at: string }> = messages.length ? messages : [{ id: "initial", role: "companion", content: "", response_payload: initialCompanionAnswer, created_at: "" }];

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-3xl border border-orange-500/40 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.16),transparent_38%),#111] p-5 sm:p-8">
      <div className="flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-400"><Compass size={29}/></span><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">VAULTEX AI NAVIGATOR & COMPANION VER.1</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">話して、整理して、次を選ぶ。</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">競技のこと、記録の振り返り、VAULTEXの使い方などを相談してください。答えを押し付けず、あなたが次の行動を選ぶためのパートナーになります。</p></div></div>
      <div className="mt-6 flex flex-wrap gap-2">{navigatorPrinciples.map((item) => <span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-bold text-white/45">{item}</span>)}</div>
    </section>

    <div className="flex gap-2">
      <button type="button" onClick={newConversation} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-black transition hover:bg-orange-400"><Plus size={16}/>新しい相談</button>
      <button type="button" onClick={() => setHistoryOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#111] px-4 py-3 text-xs font-black text-white/65 transition hover:border-orange-500/40"><History size={16}/>過去の相談 <span className="text-white/35">{conversations.length}</span></button>
    </div>

    <section aria-live="polite" className="rounded-3xl border border-white/10 bg-[#111] p-4 sm:p-6">
      {loading ? <div className="grid min-h-56 place-items-center text-white/35"><LoaderCircle className="animate-spin"/></div> : <div className="space-y-5">{visibleMessages.map((message) => message.role === "user" ? <div key={message.id} className="flex justify-end"><div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-orange-500 px-4 py-3 text-sm font-bold leading-6 text-black">{message.content}</div></div> : <CompanionBubble key={message.id} message={message} onPrompt={send}/>)}</div>}
      {sending ? <div className="mt-5 flex items-center gap-3 text-xs text-white/35"><span className="grid h-8 w-8 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><Compass size={16}/></span><LoaderCircle size={15} className="animate-spin"/>一緒に整理しています…</div> : null}
      <div ref={endRef}/>
      {error ? <p className="mt-4 rounded-xl border border-red-500/25 bg-red-500/[.06] px-4 py-3 text-xs text-red-200">{error}</p> : null}
      <form onSubmit={submit} className="mt-6 border-t border-white/10 pt-5"><label htmlFor="companion-input" className="text-xs font-black tracking-[.12em] text-white/45">VAULTEX AIに話す</label><div className="mt-2 flex gap-2"><textarea id="companion-input" rows={2} maxLength={1000} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(input); } }} placeholder="例：最近、踏切の感覚が合わない" className="min-w-0 flex-1 resize-none rounded-xl border border-white/15 bg-[#090a0c] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-orange-500"/><button disabled={!input.trim() || sending} className="grid w-12 shrink-0 place-items-center rounded-xl bg-orange-500 text-black disabled:opacity-35" aria-label="相談内容を送る"><Send size={18}/></button></div><p className="mt-2 text-right text-[10px] text-white/25">{input.length}/1000</p></form>
    </section>

    <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[.04] p-4"><p className="flex items-center gap-2 text-xs font-black text-emerald-300"><ShieldCheck size={16}/>本人データだけを参照</p><p className="mt-2 text-xs leading-5 text-white/40">あなた自身の記録・意識・動画の有無・SCANを、振り返りの入口として使います。他選手の個人情報は参照しません。</p></div><div className="rounded-2xl border border-sky-500/20 bg-sky-500/[.04] p-4"><p className="flex items-center gap-2 text-xs font-black text-sky-300"><UserRound size={16}/>コーチへつなぐ領域</p><p className="mt-2 text-xs leading-5 text-white/40">フォーム分析、個別技術変更、怪我、大会前の重要判断は断定せず、コーチ相談へつなぎます。</p></div></section>
    <a href="/member-manual.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111] p-4 text-sm font-bold text-white/60 hover:border-orange-500/35"><span className="flex items-center gap-2"><BookOpen size={17} className="text-orange-400"/>従来の使用マニュアルも見る</span><ExternalLink size={15}/></a>

    {historyOpen ? <div className="fixed inset-0 z-[100] bg-black/75 p-4 backdrop-blur-sm" onClick={() => setHistoryOpen(false)}><div className="ml-auto h-full w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#111] p-5" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><p className="text-[10px] font-black tracking-[.18em] text-orange-400">CONSULTATION HISTORY</p><h2 className="mt-1 text-xl font-black">過去の相談</h2></div><button type="button" onClick={() => setHistoryOpen(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white/60"><X/></button></div><div className="mt-6 space-y-2">{conversations.length ? conversations.map((conversation) => <button type="button" key={conversation.id} onClick={() => void selectConversation(conversation.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${conversation.id === activeId ? "border-orange-500/50 bg-orange-500/[.08]" : "border-white/10 hover:border-white/25"}`}><MessageCircleMore size={18} className="shrink-0 text-orange-400"/><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{conversation.title}</strong><span className="mt-1 block text-[10px] text-white/35">{new Date(conversation.last_message_at).toLocaleString("ja-JP")}</span></span><ArrowRight size={15} className="text-white/30"/></button>) : <p className="py-12 text-center text-sm text-white/35">まだ保存された相談はありません</p>}</div></div></div> : null}
  </div>;
}

function CompanionBubble({ message, onPrompt }: { message: Message | { id: "initial"; role: "companion"; content: string; response_payload: CompanionAnswer; created_at: string }; onPrompt: (text: string) => Promise<void> }) {
  const answer = message.response_payload as CompanionAnswer;
  const hasAnswer = Boolean(answer?.title && answer?.body);
  return <div className="flex gap-3"><span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><Compass size={17}/></span><div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/10 bg-black/20 p-4">{hasAnswer ? <><p className="font-black">{answer.title}</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/55">{answer.body}</p>{answer.question ? <p className="mt-3 text-sm font-bold leading-6 text-white/75">{answer.question}</p> : null}<div className="mt-4 grid gap-2 sm:grid-cols-2">{answer.actions.map((action) => action.href ? <Link key={`${action.label}-${action.href}`} href={action.href} target={action.href.endsWith(".pdf") ? "_blank" : undefined} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-black transition ${action.tone === "sky" ? "border-sky-400/35 bg-sky-400/[.07] text-sky-200 hover:border-sky-300" : "border-orange-500/30 bg-orange-500/[.06] text-orange-200 hover:border-orange-400"}`}><span>{action.label}</span>{action.href.endsWith(".pdf") ? <ExternalLink size={14}/> : <ArrowRight size={14}/>}</Link> : <button key={`${action.label}-${action.prompt}`} type="button" onClick={() => void onPrompt(action.prompt ?? action.label)} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left text-xs font-black text-white/65 transition hover:border-orange-500/35 hover:text-white"><span>{action.label}</span><ArrowRight size={14}/></button>)}</div>{answer.note ? <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-white/40">{answer.note}</p> : null}</> : <p className="whitespace-pre-line text-sm leading-6 text-white/55">{message.content}</p>}</div></div>;
}
