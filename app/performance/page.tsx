"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, Save, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { eventNamesByKind, type PerformanceKind, unitMap } from "@/lib/performance-events";
import { awarenessCategories, createVideoPath, formatVideoSize, PERFORMANCE_VIDEO_BUCKET, uploadVideoWithProgress, validateVideo } from "@/lib/performance-awareness";

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function PerformanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedKind = searchParams.get("kind");
  const kind: PerformanceKind = requestedKind === "athletics" || requestedKind === "unofficial-athletics" ? requestedKind : "control-test";
  const eventOptions = eventNamesByKind(kind);
  const [category, setCategory] = useState(eventOptions[0]);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(today);
  const [awarenessCategory, setAwarenessCategory] = useState("");
  const [awarenessNote, setAwarenessNote] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [videoInputKey, setVideoInputKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

const unit = unitMap[category] ?? "";

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setErrorMessage("記録には0より大きい数値を入力してください。");
      return;
    }
    if (awarenessNote.length > 200) {
      setErrorMessage("意識メモは200文字以内にしてください。");
      return;
    }
    const videoError = video ? validateVideo(video) : null;
    if (videoError) {
      setErrorMessage(videoError);
      return;
    }

    const supabase = createClient();
    setIsSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setErrorMessage("記録を保存するにはログインが必要です。");
        return;
      }

      let videoPath: string | null = null;
      if (video) {
        setUploadProgress(0);
        videoPath = createVideoPath(user.id, video);
        try {
          await uploadVideoWithProgress(supabase, videoPath, video, setUploadProgress);
        } catch (uploadError) {
          setErrorMessage(`動画をアップロードできませんでした：${uploadError instanceof Error ? uploadError.message : "不明なエラー"}`);
          return;
        }
      }

      const { error } = await supabase.from("performance_records").insert({
        user_id: user.id,
        category,
        value: numericValue,
        date,
        record_kind: kind,
        awareness_category: awarenessCategory || null,
        awareness_note: awarenessNote.trim() || null,
        video_path: videoPath,
      });

      if (error) {
        if (videoPath) await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([videoPath]);
        setErrorMessage(error.message);
        return;
      }

      router.push(kind === "athletics" ? "/mypage/athletics" : kind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href={kind === "athletics" ? "/mypage/athletics" : kind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests"}
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 transition hover:text-orange-400"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          MY PAGE
        </Link>

        <div className="mt-10 border-l-2 border-orange-500 pl-5">
          <p className="text-xs font-black tracking-[0.22em] text-orange-400">TRAINING LOG</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            {kind === "athletics" ? "陸上競技記録を追加" : kind === "unofficial-athletics" ? "非公認陸上競技記録を追加" : "テスト記録を追加"}
          </h1>
          <p className="mt-3 leading-7 text-white/60">
            今日の挑戦を残そう。積み重ねた記録が、次の自信になる。
          </p>
        </div>

        <form
          onSubmit={saveRecord}
          className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="space-y-6">
            <label className="block">
              <span className="text-sm font-bold text-white">種目</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-3 w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition focus:border-orange-500"
              >
                {eventOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-white">記録</span>
              <div className="relative mt-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  required
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="例：16.30"
                  className="w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 pr-16 text-lg font-bold text-white outline-none transition placeholder:text-white/25 focus:border-orange-500"
                />
                <span className="pointer-events-none absolute inset-y-0 right-5 grid place-items-center text-sm font-bold text-white/40">
                  {unit}
                </span>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-white">測定日</span>
              <input
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-3 w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition focus:border-orange-500"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-white">今日一番意識したこと <span className="font-normal text-white/40">（任意）</span></span>
              <select value={awarenessCategory} onChange={(event) => setAwarenessCategory(event.target.value)} className="mt-3 w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition focus:border-orange-500">
                <option value="">選択しない</option>
                {awarenessCategories.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-white">何をどう意識しましたか？ <span className="font-normal text-white/40">（任意）</span></span>
              <textarea value={awarenessNote} onChange={(event) => setAwarenessNote(event.target.value)} maxLength={200} rows={3} placeholder="例：最後までリズムを変えずに走った" className="mt-3 w-full resize-none rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-orange-500" />
              <span className="mt-1 block text-right text-xs text-white/35">{awarenessNote.length}/200</span>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-white">動画を追加 <span className="font-normal text-white/40">（任意・100MBまで）</span></span>
              <input key={videoInputKey} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-m4v" disabled={isSaving} onChange={(event) => { const selected = event.target.files?.[0] ?? null; const validationError = selected ? validateVideo(selected) : null; setUploadProgress(0); if (validationError) { setVideo(null); setErrorMessage(validationError); event.target.value = ""; return; } setErrorMessage(""); setVideo(selected); }} className="mt-3 block w-full rounded-xl border border-dashed border-white/20 bg-[#101216] px-4 py-4 text-sm text-white/65 file:mr-4 file:rounded-lg file:border-0 file:bg-orange-500 file:px-3 file:py-2 file:font-bold file:text-white disabled:opacity-50" />
              {video && <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="flex items-center justify-between gap-3 text-xs"><span className="min-w-0 truncate text-white/65">{video.name}</span><div className="flex shrink-0 items-center gap-3"><strong className="text-orange-300">{formatVideoSize(video.size)} / 100MB</strong><button type="button" disabled={isSaving} onClick={() => { setVideo(null); setUploadProgress(0); setVideoInputKey((value) => value + 1); setErrorMessage(""); }} className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 px-2.5 py-1.5 font-bold text-red-300 disabled:opacity-40"><Trash2 size={13} />動画を削除</button></div></div>{isSaving && <div className="mt-3"><div className="mb-1 flex justify-between text-xs text-white/50"><span>{uploadProgress < 100 ? "動画をアップロード中" : "動画の処理完了"}</span><span>{uploadProgress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-orange-500 transition-[width]" style={{ width: `${uploadProgress}%` }} /></div><p className="mt-2 text-xs text-white/35">完了するまでこの画面を閉じないでください。</p></div>}</div>}
            </label>
          </div>

          {errorMessage && (
            <p role="alert" className="mt-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black tracking-[0.14em] text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? (video && uploadProgress < 100 ? `動画アップロード中 ${uploadProgress}%` : "保存中...") : "記録を保存"}
          </button>

          <p className="mt-5 flex items-center gap-2 text-xs text-white/45">
            <Check size={15} className="text-orange-400" aria-hidden="true" />
            保存後はマイページの記録一覧に反映されます。
          </p>
        </form>
      </div>
    </main>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#090a0c]" />}>
      <PerformanceForm />
    </Suspense>
  );
}
