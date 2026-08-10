"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

type VideoRecord = {
  id: number;
  value: number | string;
  date: string;
  video_url?: string | null;
};

export default function PerformanceVideoList({ records, unit }: { records: VideoRecord[]; unit: string }) {
  const videoRecords = records.filter((record) => record.video_url);
  const [listOpen, setListOpen] = useState(false);
  const [selected, setSelected] = useState<VideoRecord | null>(null);

  useEffect(() => {
    if (!selected && !listOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") selected ? setSelected(null) : setListOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selected, listOpen]);

  return (
    <>
      <button type="button" onClick={() => setListOpen(true)} className="w-full border-t border-white/10 px-6 py-4 text-left text-sm font-bold text-orange-400 hover:bg-white/[0.025]">▶ 動画を見る（{videoRecords.length}件）</button>

      {listOpen && !selected && <div role="dialog" aria-modal="true" aria-label="動画一覧" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8" onClick={() => setListOpen(false)}>
        <div className="w-full max-w-2xl rounded-2xl border border-orange-500/60 bg-[#111]" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4"><h2 className="text-lg font-black text-white">動画を見る</h2><button type="button" onClick={() => setListOpen(false)} aria-label="動画一覧を閉じる" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><X /></button></div>
          {videoRecords.length === 0 ? <p className="px-6 py-8 text-sm text-white/45">動画付きの記録はまだありません。</p> : <div className="grid gap-2 p-6 sm:grid-cols-2">
        {videoRecords.map((record) => (
          <button
            key={record.id}
            type="button"
            onClick={() => setSelected(record)}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3 text-left transition hover:border-orange-500/60 hover:bg-orange-500/[0.08]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-500 text-white"><Play size={15} fill="currentColor" /></span>
            <span className="min-w-0 flex-1">
              <strong className="block text-base text-white">{record.value}{unit}</strong>
              <span className="block text-xs text-white/45">{record.date}</span>
            </span>
          </button>
        ))}
          </div>}
        </div>
      </div>}

      {selected && (
        <div role="dialog" aria-modal="true" aria-label={`${selected.value}${unit}の動画`} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-8" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-4 text-white">
              <div><strong className="text-xl">{selected.value}{unit}</strong><span className="ml-3 text-sm text-white/50">{selected.date}</span></div>
              <button type="button" onClick={() => setSelected(null)} aria-label="動画を閉じる" className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"><X /></button>
            </div>
            <video key={selected.id} autoPlay controls playsInline className="max-h-[80vh] w-full rounded-2xl bg-black object-contain" src={selected.video_url ?? undefined}>
              お使いのブラウザは動画再生に対応していません。
            </video>
          </div>
        </div>
      )}
    </>
  );
}
