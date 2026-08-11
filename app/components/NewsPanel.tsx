"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Check, ChevronRight, MessageSquare, Pin } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export type NewsItem = { id: string; kind: "announcement" | "feedback"; title: string; body: string; date: string; href?: string; important?: boolean; unread: boolean; announcementId?: number };

export default function NewsPanel({ initialItems, userId }: { initialItems: NewsItem[]; userId: string }) {
  const [items, setItems] = useState(initialItems);
  const unread = items.filter((item) => item.unread).length;
  async function markRead(item: NewsItem) {
    if (!item.announcementId || !item.unread) return;
    const { error } = await createClient().from("announcement_reads").insert({ announcement_id: item.announcementId, user_id: userId });
    if (!error) setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, unread: false } : entry));
  }
  if (items.length === 0) return null;
  return <section className="mt-10 rounded-2xl border border-white/10 bg-[#111] p-5 text-white sm:p-6">
    <div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-black"><Bell className="text-orange-400" size={20} />NEWS</h2>{unread > 0 && <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-black">未確認 {unread}件</span>}</div>
    <div className="mt-4 divide-y divide-white/10">{items.map((item) => <article key={item.id} className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3"><span className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.kind === "feedback" ? "bg-emerald-500/15 text-emerald-400" : "bg-orange-500/15 text-orange-400"}`}>{item.kind === "feedback" ? <MessageSquare size={15} /> : item.important ? <Pin size={15} /> : <Bell size={15} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{item.title}</strong>{item.unread && <span className="h-2 w-2 rounded-full bg-red-400" />}</div><p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">{item.body}</p><span className="mt-1 block text-xs text-white/30">{new Date(item.date).toLocaleString("ja-JP")}</span><div className="mt-2 flex gap-2">{item.href && <Link href={item.href} className="inline-flex items-center gap-1 text-xs font-bold text-orange-400">確認する<ChevronRight size={13} /></Link>}{item.kind === "announcement" && item.unread && <button type="button" onClick={() => markRead(item)} className="inline-flex items-center gap-1 text-xs font-bold text-white/45 hover:text-white"><Check size={13} />既読にする</button>}</div></div></div>
    </article>)}</div>
  </section>;
}
