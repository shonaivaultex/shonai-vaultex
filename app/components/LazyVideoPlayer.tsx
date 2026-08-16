"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import CompatibleVideoPlayer from "@/app/components/CompatibleVideoPlayer";

export default function LazyVideoPlayer({
  src,
  label = "動画を再生する",
  className = "max-h-[60vh] w-full rounded-xl bg-black object-contain",
}: {
  src: string;
  label?: string;
  className?: string;
}) {
  const [opened, setOpened] = useState(false);

  if (!opened) {
    return <button type="button" onClick={() => setOpened(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-500/25 bg-orange-500/[0.06] px-4 py-4 text-sm font-black text-orange-400 transition hover:bg-orange-500/10">
      <Play size={17} />{label}
    </button>;
  }

  return <CompatibleVideoPlayer src={src} className={className} />;
}
