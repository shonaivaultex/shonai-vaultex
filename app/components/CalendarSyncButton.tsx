"use client";

import { useState } from "react";
import { CalendarPlus, ExternalLink, RefreshCw, X } from "lucide-react";

type Subscription = { feedUrl: string; webcalUrl: string; googleUrl: string };

export default function CalendarSyncButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState("");

  async function prepare(rotate = false) {
    setOpen(true); setLoading(true); setError("");
    const response = await fetch("/api/calendar/feed-token", { method: rotate ? "POST" : "GET", cache: "no-store" });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) { setError(body.error || "同期を準備できませんでした。"); return; }
    setSubscription(body);
  }

  return <>
    <button type="button" onClick={() => void prepare()} className="inline-flex items-center gap-2 rounded-xl border border-sky-400/35 bg-sky-400/[.07] px-4 py-3 text-sm font-black text-sky-300"><CalendarPlus size={17}/>スマホと自動同期</button>
    {open && <div className="fixed inset-0 z-[160] overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"><div className="mx-auto my-16 max-w-lg rounded-[28px] border border-sky-400/35 bg-[#111] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black tracking-[.2em] text-sky-300">CALENDAR SYNC</p><h2 className="mt-1 text-2xl font-black">スマホへ自動反映</h2></div><button type="button" onClick={() => setOpen(false)} className="rounded-full bg-white/10 p-2"><X/></button></div><p className="mt-4 text-sm leading-7 text-white/55">最初に一度だけ登録すると、その後VAULTEXで追加・変更・削除した予定がスマホのカレンダーへ自動で同期されます。</p>{loading ? <p className="mt-6 text-sm font-bold text-sky-300">同期用カレンダーを準備中…</p> : error ? <p className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : subscription ? <div className="mt-6 space-y-3"><a href={subscription.webcalUrl} className="flex items-center justify-between rounded-xl bg-white px-4 py-4 text-sm font-black text-black"><span>iPhone・Appleカレンダーに登録</span><ExternalLink size={16}/></a><a href={subscription.googleUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl bg-sky-500 px-4 py-4 text-sm font-black text-black"><span>Googleカレンダーに登録</span><ExternalLink size={16}/></a><p className="text-[11px] leading-6 text-white/40">登録後の更新間隔はスマホ側のカレンダー設定により異なります。専用URLは他人に共有しないでください。</p><button type="button" onClick={() => { if (confirm("現在の同期URLを無効にして再発行しますか？ すでに登録した端末では再登録が必要です。")) void prepare(true); }} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/35"><RefreshCw size={12}/>同期URLを再発行</button></div> : null}</div></div>}
  </>;
}
