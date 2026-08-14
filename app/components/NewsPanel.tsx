"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Check, ChevronRight, MessageSquare, Pin, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export type NewsItem = {
  id: string;
  kind: "announcement" | "feedback";
  title: string;
  body: string;
  date: string;
  href?: string;
  important?: boolean;
  unread: boolean;
  announcementId?: number;
  videoMessageId?: number;
};

export default function NewsPanel({
  initialItems,
  userId,
}: {
  initialItems: NewsItem[];
  userId: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [showAll, setShowAll] = useState(false);
  const unread = items.filter((item) => item.unread).length;
  const orderedItems = [...items].sort(
    (a, b) =>
      Number(b.unread) - Number(a.unread) ||
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const previewItems = orderedItems.slice(0, 3);
  useEffect(() => {
    if (!showAll) return;
    const close = (event: KeyboardEvent) =>
      event.key === "Escape" && setShowAll(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [showAll]);
  async function markRead(item: NewsItem) {
    if (!item.unread) return;
    const query = item.announcementId
      ? createClient()
          .from("announcement_reads")
          .insert({ announcement_id: item.announcementId, user_id: userId })
      : item.videoMessageId
        ? createClient()
            .from("video_feedback_message_reads")
            .insert({ message_id: item.videoMessageId, user_id: userId })
        : null;
    if (!query) return;
    const { error } = await query;
    if (!error)
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, unread: false } : entry,
        ),
      );
  }
  if (items.length === 0) return null;
  const renderItem = (item: NewsItem) => (
    <article key={item.id} className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.kind === "feedback" ? "bg-emerald-500/15 text-emerald-400" : "bg-orange-500/15 text-orange-400"}`}
        >
          {item.kind === "feedback" ? (
            <MessageSquare size={15} />
          ) : item.important ? (
            <Pin size={15} />
          ) : (
            <Bell size={15} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-sm">{item.title}</strong>
            {item.unread && (
              <span className="h-2 w-2 rounded-full bg-red-400" />
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">
            {item.body}
          </p>
          <span className="mt-1 block text-xs text-white/30">
            {new Date(item.date).toLocaleString("ja-JP")}
          </span>
          <div className="mt-2 flex gap-2">
            {item.href && (
              <Link
                href={item.href}
                onClick={() => void markRead(item)}
                className="inline-flex items-center gap-1 text-xs font-bold text-orange-400"
              >
                確認する
                <ChevronRight size={13} />
              </Link>
            )}
            {(item.announcementId || item.videoMessageId) && item.unread && (
              <button
                type="button"
                onClick={() => void markRead(item)}
                className="inline-flex items-center gap-1 text-xs font-bold text-white/45 hover:text-white"
              >
                <Check size={13} />
                既読にする
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
  return (
    <>
      <section className="mt-10 rounded-2xl border border-white/10 bg-[#111] p-5 text-white sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-black">
            <Bell className="text-orange-400" size={20} />
            NEWS
          </h2>
          {unread > 0 && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-black">
              未確認 {unread}件
            </span>
          )}
        </div>
        <div className="mt-4 divide-y divide-white/10">
          {previewItems.map(renderItem)}
        </div>
        {items.length > 3 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="mt-5 flex w-full items-center justify-center gap-1 border-t border-white/10 pt-4 text-sm font-bold text-orange-400 hover:text-orange-300"
          >
            NEWSをすべて見る（{items.length}件）
            <ChevronRight size={15} />
          </button>
        )}
      </section>
      {showAll && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="NEWS一覧"
          onClick={() => setShowAll(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-orange-500/60 bg-[#111] text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111] px-6 py-4">
              <div>
                <h2 className="text-lg font-black">NEWS</h2>
                <p className="mt-1 text-xs text-white/40">
                  未確認のお知らせを優先して表示
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAll(false)}
                aria-label="NEWS一覧を閉じる"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10"
              >
                <X />
              </button>
            </div>
            <div className="divide-y divide-white/10 px-6 py-4">
              {orderedItems.map(renderItem)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
