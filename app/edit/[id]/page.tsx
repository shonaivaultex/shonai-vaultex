"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { performanceEvents, type PerformanceKind } from "@/lib/performance-events";
import { awarenessCategories, createVideoPath, formatVideoSize, PERFORMANCE_VIDEO_BUCKET, uploadVideoWithProgress, validateVideo } from "@/lib/performance-awareness";

export default function EditPerformancePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [recordKind, setRecordKind] = useState<PerformanceKind>("control-test");
  const [awarenessCategory, setAwarenessCategory] = useState("");
  const [awarenessNote, setAwarenessNote] = useState("");
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState<File | null>(null);
  const [videoInputKey, setVideoInputKey] = useState(0);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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
        .select("category, value, date, record_kind, awareness_category, awareness_note, video_path")
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
      setRecordKind(data.record_kind ?? (performanceEvents.find((event) => event.name === data.category)?.kind ?? "control-test"));
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
      setUploadProgress(0);
      nextVideoPath = createVideoPath(user.id, newVideo);
      try {
        await uploadVideoWithProgress(supabase, nextVideoPath, newVideo, setUploadProgress);
      } catch (uploadError) {
        setSaving(false);
        alert("動画をアップロードできませんでした：" + (uploadError instanceof Error ? uploadError.message : "不明なエラー"));
        return;
      }
    }
    const { error } = await supabase
      .from("performance_records")
      .update({
        category,
        value,
        date,
        record_kind: recordKind,
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

    router.push(recordKind === "athletics" ? "/mypage/athletics" : recordKind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests");
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
            <input key={videoInputKey} id="video" type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" disabled={saving} onChange={(event) => { const selected = event.target.files?.[0] ?? null; const validationError = selected ? validateVideo(selected) : null; setUploadProgress(0); if (validationError) { alert(validationError); setNewVideo(null); event.target.value = ""; return; } setNewVideo(selected); if (selected) setRemoveVideo(false); }} className="block w-full rounded-xl border border-dashed border-zinc-700 bg-[#111] px-4 py-3 text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-[#ff7a00] file:px-3 file:py-2 file:font-bold file:text-black disabled:opacity-50" />
            {newVideo && <div className="mt-3 rounded-xl border border-zinc-700 bg-black/20 p-3"><div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-zinc-400">{newVideo.name}</span><div className="flex shrink-0 items-center gap-3"><strong className="text-orange-400">{formatVideoSize(newVideo.size)} / 100MB</strong><button type="button" disabled={saving} onClick={() => { setNewVideo(null); setUploadProgress(0); setVideoInputKey((value) => value + 1); }} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 font-bold text-red-300 disabled:opacity-40"><Trash2 size={13} />動画を削除</button></div></div>{saving && <div className="mt-3"><div className="mb-1 flex justify-between text-xs text-zinc-400"><span>{uploadProgress < 100 ? "動画をアップロード中" : "動画の処理完了"}</span><span>{uploadProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#ff7a00] transition-[width]" style={{ width: `${uploadProgress}%` }} /></div><p className="mt-2 text-xs text-zinc-500">完了するまでこの画面を閉じないでください。</p></div>}</div>}
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
            {saving ? (newVideo && uploadProgress < 100 ? `動画アップロード中 ${uploadProgress}%` : "保存中...") : "保存する"}
          </button>
        </form>
      </div>
    </main>
  );
}
