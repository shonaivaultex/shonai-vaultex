"use client";

import { ExternalLink, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";

type Props = { src: string; className?: string; autoPlay?: boolean };

export default function CompatibleVideoPlayer({ src, className = "", autoPlay = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  function retry() {
    setFailed(false);
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play().catch(() => undefined);
  }

  return <div className="space-y-3">
    <video ref={videoRef} controls playsInline preload="metadata" autoPlay={autoPlay} src={src} onLoadedMetadata={() => setFailed(false)} onError={() => setFailed(true)} className={className}>
      お使いのブラウザは動画再生に対応していません。
    </video>
    {failed && <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4">
      <p className="text-sm font-bold text-amber-200">このブラウザでは動画形式を再生できません。</p>
      <p className="mt-1 text-xs leading-5 text-white/55">iPhoneのMOV動画などで発生する場合があります。端末の動画プレーヤーなら再生できます。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-black text-white"><ExternalLink size={14} />端末のプレーヤーで開く</a>
        <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs font-bold text-white/70"><RotateCcw size={14} />もう一度読み込む</button>
      </div>
    </div>}
  </div>;
}
