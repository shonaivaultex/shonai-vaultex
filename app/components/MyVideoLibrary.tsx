"use client";

import { useState } from "react";
import { Play, Share2 } from "lucide-react";
import CompatibleVideoPlayer from "@/app/components/CompatibleVideoPlayer";

export type MyVideoItem = {
  id: string;
  date: string;
  category: string;
  label: string;
  kind: string;
  url: string;
  path: string;
};

export default function MyVideoLibrary({ items }: { items: MyVideoItem[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const [savingId, setSavingId] = useState("");
  const groups = Object.entries(
    items.reduce<Record<string, MyVideoItem[]>>((result, item) => {
      (result[item.date] ??= []).push(item);
      return result;
    }, {}),
  ).sort(([a], [b]) => b.localeCompare(a));
  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  async function save(item: MyVideoItem) {
    setSavingId(item.id);
    try {
      const response = await fetch(item.url);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const extension = item.path.split(".").pop() || "mp4";
      const file = new File(
        [blob],
        `${item.date}_${item.category}_${item.label}.${extension}`,
        { type: blob.type || "video/mp4" },
      );
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${item.category} ${item.label}`,
        });
        return;
      }
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = file.name;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      window.open(item.url, "_blank", "noopener,noreferrer");
    } finally {
      setSavingId("");
    }
  }
  if (!groups.length)
    return (
      <div className="mt-8 rounded-3xl border border-white/10 bg-[#111] p-10 text-center">
        <p className="text-sm font-bold text-white/45">
          保存された動画はまだありません。
        </p>
        <p className="mt-2 text-xs text-white/30">
          練習・大会記録に動画が追加されると、日付ごとにここへ並びます。
        </p>
      </div>
    );
  return (
    <div className="mt-8 space-y-8">
      {groups.map(([date, videos]) => (
        <section key={date}>
          <div className="flex items-end justify-between border-b border-white/10 pb-3">
            <div>
              <p className="text-[10px] font-black tracking-[.16em] text-sky-300">
                VIDEO DAY
              </p>
              <h2 className="mt-1 text-xl font-black">
                {new Date(`${date}T00:00:00+09:00`).toLocaleDateString(
                  "ja-JP",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                    timeZone: "Asia/Tokyo",
                  },
                )}
              </h2>
            </div>
            <span className="text-xs font-black text-white/35">
              {videos.length}本
            </span>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {videos.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#111]"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="flex w-full items-center gap-3 p-4 text-left"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-300">
                    <Play size={19} fill="currentColor" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate">{item.category}</strong>
                    <span className="mt-1 block text-xs text-white/40">
                      {item.label}・{item.kind}
                    </span>
                  </span>
                  <span className="text-xs font-black text-sky-300">
                    {openIds.has(item.id) ? "閉じる" : "再生"}
                  </span>
                </button>
                {openIds.has(item.id) ? (
                  <div className="border-t border-white/10 p-3">
                    <CompatibleVideoPlayer
                      src={item.url}
                      className="max-h-[58vh] w-full rounded-xl bg-black object-contain"
                    />
                  </div>
                ) : null}
                <div className="flex gap-2 border-t border-white/10 p-3">
                  <button
                    type="button"
                    disabled={savingId === item.id}
                    onClick={() => save(item)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-black disabled:opacity-50"
                  >
                    <Share2 size={15} />
                    {savingId === item.id ? "準備中…" : "写真フォルダへ保存"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
