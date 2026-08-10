"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { performanceEvents } from "@/lib/performance-events";
import { awarenessCategories, createVideoPath, PERFORMANCE_VIDEO_BUCKET, validateVideo } from "@/lib/performance-awareness";

export default function EditPerformancePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [awarenessCategory, setAwarenessCategory] = useState("");
  const [awarenessNote, setAwarenessNote] = useState("");
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const events = performanceEvents.map((event) => event.name);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("performance_records")
        .select("category, value, date, awareness_category, awareness_note, video_path")
        .eq("id", id)
        .single();

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setCategory(data.category ?? "");
      setValue(String(data.value ?? ""));
      setDate(data.date ?? "");
      setAwarenessCategory(data.awareness_category ?? "");
      setAwarenessNote(data.awareness_note ?? "");
      setVideoPath(data.video_path ?? null);
      setLoading(false);
    };

    void fetchRecord();
  }, [id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) return;

    if (awarenessNote.length > 200) {
      alert("意識メモは200文字以内にしてください。");
      return;
    }
    const videoError = newVideo ? validateVideo(newVideo) : null;
    if (videoError) {
      alert(videoError);
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      alert("ログインが必要です。");
      return;
    }

    let nextVideoPath = removeVideo ? null : videoPath;
    if (newVideo) {
      nextVideoPath = createVideoPath(user.id, newVideo);
      const { error: uploadError } = await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).upload(nextVideoPath, newVideo, { contentType: newVideo.type });
      if (uploadError) {
        setSaving(false);
        alert("動画をアップロードできませんでした：" + uploadError.message);
        return;
      }
    }
    const { error } = await supabase
      .from("performance_records")
      .update({
        category,
        value,
        date,
        awareness_category: awarenessCategory || null,
        awareness_note: awarenessNote.trim() || null,
        video_path: nextVideoPath,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      if (newVideo && nextVideoPath) await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([nextVideoPath]);
      alert(error.message);
      return;
    }

    if (videoPath && videoPath !== nextVideoPath) {
      await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([videoPath]);
    }

    router.push("/mypage");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111] px-4 text-white">
        <p className="text-sm font-medium tracking-widest text-[#ff7a00]">
          LOADING...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111] px-4 pt-40 pb-20 text-white sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 text-sm font-bold text-zinc-400 transition hover:text-[#ff7a00]"
        >
          ← 戻る
        </button>

        <div className="border-l-4 border-[#ff7a00] pl-4">
          <p className="text-xs font-bold tracking-[0.2em] text-[#ff7a00]">
            PERFORMANCE RECORD
          </p>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">記録を編集</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8"
        >
          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-bold text-zinc-200"
            >
              種目
            </label>
            <select
  id="category"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  required
  className="w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/30"
>
  {events.map((eventName) => (
    <option
      key={eventName}
      value={eventName}
      className="bg-[#111]"
    >
      {eventName}
    </option>
  ))}
</select>
          </div>

          <div>
            <label htmlFor="awareness" className="mb-2 block text-sm font-bold text-zinc-200">今日一番意識したこと（任意）</label>
            <select id="awareness" value={awarenessCategory} onChange={(event) => setAwarenessCategory(event.target.value)} className="w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none focus:border-[#ff7a00]">
              <option value="">選択しない</option>
              {awarenessCategories.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="awareness-note" className="mb-2 block text-sm font-bold text-zinc-200">何をどう意識しましたか？（任意）</label>
            <textarea id="awareness-note" value={awarenessNote} onChange={(event) => setAwarenessNote(event.target.value)} maxLength={200} rows={3} placeholder="例：最後までリズムを変えずに走った" className="w-full resize-none rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-[#ff7a00]" />
            <span className="mt-1 block text-right text-xs text-zinc-500">{awarenessNote.length}/200</span>
          </div>

          <div>
            <label htmlFor="video" className="mb-2 block text-sm font-bold text-zinc-200">動画（任意・100MBまで）</label>
            {videoPath && !removeVideo && !newVideo && <button type="button" onClick={() => setRemoveVideo(true)} className="mb-3 text-sm font-bold text-red-400 hover:text-red-300">現在の動画を削除</button>}
            {removeVideo && !newVideo && <p className="mb-3 text-sm text-zinc-400">保存すると現在の動画を削除します。</p>}
            <input id="video" type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" onChange={(event) => { setNewVideo(event.target.files?.[0] ?? null); if (event.target.files?.[0]) setRemoveVideo(false); }} className="block w-full rounded-xl border border-dashed border-zinc-700 bg-[#111] px-4 py-3 text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-[#ff7a00] file:px-3 file:py-2 file:font-bold file:text-black" />
          </div>

          <div>
            <label
              htmlFor="value"
              className="mb-2 block text-sm font-bold text-zinc-200"
            >
              記録
            </label>
            <input
              id="value"
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="例：100kg"
              required
              className="w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/30"
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-bold text-zinc-200"
            >
              測定日
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none transition [color-scheme:dark] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/30"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#ff7a00] px-4 py-4 text-sm font-black tracking-widest text-black transition hover:bg-[#ff921f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </form>
      </div>
    </main>
  );
}
