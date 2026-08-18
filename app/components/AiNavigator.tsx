"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { ArrowRight, BookOpen, Compass, ExternalLink, Send, ShieldCheck, UserRound } from "lucide-react";
import { answerNavigator, initialNavigatorAnswer, navigatorPrinciples, type NavigatorAnswer } from "@/lib/ai-navigator/knowledge";

type Message = { id: number; role: "user" | "navigator"; text?: string; answer?: NavigatorAnswer };

export default function AiNavigator() {
  const [messages, setMessages] = useState<Message[]>([{ id: 1, role: "navigator", answer: initialNavigatorAnswer }]);
  const [input, setInput] = useState("");
  const nextId = useRef(2);

  function ask(text: string) {
    const value = text.trim();
    if (!value) return;
    const userId = nextId.current++; const navigatorId = nextId.current++;
    setMessages((current) => [...current, { id: userId, role: "user", text: value }, { id: navigatorId, role: "navigator", answer: answerNavigator(value) }]);
    setInput("");
    window.setTimeout(() => document.getElementById(`navigator-message-${navigatorId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  function submit(event: FormEvent) { event.preventDefault(); ask(input); }

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-3xl border border-orange-500/40 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.16),transparent_38%),#111] p-5 sm:p-8">
      <div className="flex items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-orange-500/40 bg-orange-500/10 text-orange-400"><Compass size={29}/></span><div><p className="text-[10px] font-black tracking-[.22em] text-orange-400">VAULTEX AI NAVIGATOR VER.1</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">次の行動を、一緒に選ぶ。</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">困った時、振り返りたい時、次の行動を考えたい時に相談してください。技術や才能を断定せず、あなたが自分で判断するための入口を案内します。</p></div></div>
      <div className="mt-6 flex flex-wrap gap-2">{navigatorPrinciples.map((item)=><span key={item} className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-bold text-white/45">{item}</span>)}</div>
    </section>

    <section aria-live="polite" className="rounded-3xl border border-white/10 bg-[#111] p-4 sm:p-6">
      <div className="space-y-5">{messages.map((message) => message.role === "user" ? <div key={message.id} className="flex justify-end"><div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-orange-500 px-4 py-3 text-sm font-bold text-black">{message.text}</div></div> : <div id={`navigator-message-${message.id}`} key={message.id} className="flex gap-3"><span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><Compass size={17}/></span><div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-white/10 bg-black/20 p-4"><p className="font-black">{message.answer?.title}</p><p className="mt-2 text-sm leading-6 text-white/55">{message.answer?.body}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{message.answer?.actions.map((action)=>(action.href?<Link key={`${action.label}-${action.href}`} href={action.href} target={action.href.endsWith(".pdf")?"_blank":undefined} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-black transition ${action.tone==="sky"?"border-sky-400/35 bg-sky-400/[.07] text-sky-200 hover:border-sky-300":"border-orange-500/30 bg-orange-500/[.06] text-orange-200 hover:border-orange-400"}`}><span>{action.label}</span>{action.href.endsWith(".pdf")?<ExternalLink size={14}/>:<ArrowRight size={14}/>}</Link>:<button key={`${action.label}-${action.prompt}`} type="button" onClick={()=>ask(action.prompt??action.label)} className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-left text-xs font-black text-white/65 transition hover:border-orange-500/35 hover:text-white"><span>{action.label}</span><ArrowRight size={14}/></button>))}</div>{message.answer?.note?<p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-white/40">{message.answer.note}</p>:null}</div></div>)}</div>
      <form onSubmit={submit} className="mt-6 border-t border-white/10 pt-5"><label htmlFor="navigator-input" className="text-xs font-black tracking-[.12em] text-white/45">NAVIGATORに相談する</label><div className="mt-2 flex gap-2"><input id="navigator-input" maxLength={300} value={input} onChange={(event)=>setInput(event.target.value)} placeholder="例：最近記録が伸びない" className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#090a0c] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-500"/><button disabled={!input.trim()} className="grid w-12 shrink-0 place-items-center rounded-xl bg-orange-500 text-black disabled:opacity-35" aria-label="相談内容を送る"><Send size={18}/></button></div><p className="mt-2 text-right text-[10px] text-white/25">{input.length}/300</p></form>
    </section>

    <section className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[.04] p-4"><p className="flex items-center gap-2 text-xs font-black text-emerald-300"><ShieldCheck size={16}/>安全な案内範囲</p><p className="mt-2 text-xs leading-5 text-white/40">システムの使い方、記録・意識・動画・SCANの振り返り、次の行動選びを案内します。</p></div><div className="rounded-2xl border border-sky-500/20 bg-sky-500/[.04] p-4"><p className="flex items-center gap-2 text-xs font-black text-sky-300"><UserRound size={16}/>コーチの領域</p><p className="mt-2 text-xs leading-5 text-white/40">フォーム分析、技術修正、大会前の判断、個別メニューはコーチへの相談につなぎます。</p></div></section>
    <a href="/member-manual.pdf" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#111] p-4 text-sm font-bold text-white/60 hover:border-orange-500/35"><span className="flex items-center gap-2"><BookOpen size={17} className="text-orange-400"/>従来の使用マニュアルを見る</span><ExternalLink size={15}/></a>
  </div>;
}
