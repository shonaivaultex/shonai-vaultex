"use client";

import { Play } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";

export default function LazyPerformanceVideo({ videoPath, initialUrl = null }: { videoPath: string; initialUrl?: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function prepareVideo(open: boolean) {
    if (!open || url || loading) return;
    setLoading(true);
    setError(false);
    const { data, error: storageError } = await createClient().storage.from(PERFORMANCE_VIDEO_BUCKET).createSignedUrl(videoPath, 3600);
    setLoading(false);
    if (storageError || !data?.signedUrl) { setError(true); return; }
    setUrl(data.signedUrl);
  }

  return <details className="mt-3" onToggle={(event) => void prepareVideo(event.currentTarget.open)}>
    <summary className="cursor-pointer text-xs font-black text-orange-300"><Play size={13} className="mr-1 inline" />動画を見る</summary>
    {loading ? <div className="mt-3 h-24 animate-pulse rounded-xl bg-white/[.05]" /> : null}
    {error ? <button type="button" onClick={() => void prepareVideo(true)} className="mt-3 text-xs font-bold text-red-300">動画を読み込めませんでした。もう一度試す</button> : null}
    {url ? <video controls playsInline preload="none" src={url} className="mt-3 max-h-[50vh] w-full rounded-xl bg-black object-contain" /> : null}
  </details>;
}
