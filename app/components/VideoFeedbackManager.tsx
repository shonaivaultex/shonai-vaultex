"use client";

import { FormEvent, useRef, useState } from "react";
import { Send, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";
import { FEEDBACK_ATTACHMENT_BUCKET } from "@/lib/feedback-attachments";
import LazyVideoPlayer from "@/app/components/LazyVideoPlayer";
import VideoFeedbackConversation, { type VideoFeedbackMessage } from "@/app/components/VideoFeedbackConversation";

type Item = {
  id: number;
  video_path: string | null;
  video_url: string | null;
  event_name: string;
  awareness_category: string | null;
  message: string | null;
  priority: string;
  status: string;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  messages: VideoFeedbackMessage[];
};
const awareness = [
  "",
  "リズム",
  "力感",
  "スタート",
  "動作",
  "気持ち",
  "感覚",
  "その他",
];
const maxBytes = 100 * 1024 * 1024;

export default function VideoFeedbackManager({
  initialItems,
  initialEventName = "",
  initialMessage = "",
}: {
  initialItems: Item[];
  initialEventName?: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [eventName, setEventName] = useState(initialEventName);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [urgent, setUrgent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  function choose(next: File | null) {
    setError("");
    if (next && (!next.type.startsWith("video/") || next.size > maxBytes)) {
      setError("100MB以下の動画を選択してください。");
      return;
    }
    setFile(next);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!eventName.trim() || (!file && !message.trim())) return;
    setSaving(true);
    setError("");
    setProgress(10);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("ログインが必要です。");
      setSaving(false);
      return;
    }
    let path: string | null = null;
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase() || "mp4";
      path = `${user.id}/feedback/${crypto.randomUUID()}.${extension}`;
      setProgress(35);
      const { error: uploadError } = await supabase.storage
        .from(PERFORMANCE_VIDEO_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        setProgress(0);
        return;
      }
    }
    setProgress(75);
    const { data: savedRequest, error: saveError } = await supabase
      .from("video_feedback_requests")
      .insert({
        user_id: user.id,
        video_path: path,
        event_name: eventName.trim(),
        awareness_category: category || null,
        message: message.trim() || null,
        priority: urgent ? "urgent" : "normal",
      }).select("id").single();
    if (saveError) {
      if (path) await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([path]);
      setError(saveError.message);
      setSaving(false);
      setProgress(0);
      return;
    }
    setProgress(100);
    if (savedRequest) await fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "video_feedback", requestId: savedRequest.id, senderRole: "athlete", isInitial: true }) }).catch(() => undefined);
    setFile(null);
    setEventName("");
    setCategory("");
    setMessage("");
    setUrgent(false);
    if (inputRef.current) inputRef.current.value = "";
    setSaving(false);
    router.refresh();
  }
  async function cancel(item: Item) {
    if (
      !confirm(
        item.status === "pending"
          ? "依頼を取り消して動画も削除しますか？"
          : "この依頼履歴と動画を削除しますか？",
      )
    )
      return;
    const supabase = createClient();
    const { error } = await supabase
      .from("video_feedback_requests")
      .delete()
      .eq("id", item.id);
    if (error) {
      alert(error.message);
      return;
    }
    if (item.video_path) await supabase.storage
      .from(PERFORMANCE_VIDEO_BUCKET)
      .remove([item.video_path]);
    const attachmentPaths = item.messages.flatMap((message) => message.sender_role === "athlete" && message.attachment_path ? [message.attachment_path] : []);
    if (attachmentPaths.length) await supabase.storage.from(FEEDBACK_ATTACHMENT_BUCKET).remove(attachmentPaths);
    router.refresh();
  }
  return (
    <div className="mt-8 space-y-6">
      <form
        onSubmit={submit}
        className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.04] p-5 sm:p-6"
      >
        <h2 className="font-black">コーチに相談する</h2>
        <p className="mt-2 text-sm leading-6 text-white/50">文章だけでも相談できます。必要なときだけ動画を添付してください。</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">
            種目・動作
            <input
              required
              maxLength={80}
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="例：棒高跳の助走、スタート練習"
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] px-4 py-3 text-white"
            />
          </label>
          <label className="text-sm font-bold">
            意識カテゴリ（任意）
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#111] px-4 py-3 text-white"
            >
              {awareness.map((item) => (
                <option key={item} value={item}>
                  {item || "選択しない"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm font-bold">
          相談内容
          <textarea
            maxLength={500}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="今の状況、感じていること、コーチに確認したいこと"
            className="mt-2 w-full resize-none rounded-xl border border-white/15 bg-[#111] px-4 py-3 text-white"
          />
        </label>
        <div className="mt-4 rounded-xl border border-dashed border-white/20 p-4">
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
            onChange={(e) => choose(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 px-4 py-2 text-sm font-bold text-sky-300"
            >
              <Upload size={16} />
              動画を添付（任意）
            </button>
            {file && (
              <button
                type="button"
                onClick={() => choose(null)}
                className="inline-flex items-center gap-1 text-xs text-white/50"
              >
                <X size={14} />
                取り消す
              </button>
            )}
          </div>
          {file && (
            <>
              <p className="mt-3 truncate text-xs text-white/60">
                {file.name}（{(file.size / 1024 / 1024).toFixed(1)}MB）
              </p>
              {/\.mov$/i.test(file.name) && (
                <p className="mt-2 text-xs leading-5 text-amber-200/80">
                  MOV動画は一部のブラウザで直接再生できない場合があります。可能であればMP4形式がおすすめです。
                </p>
              )}
            </>
          )}
        </div>
        <label className="mt-4 flex items-center gap-2 text-xs text-white/65">
          <input
            type="checkbox"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
          />
          大会前など、早めに見てほしい
        </label>
        {saving && (
          <div className="mt-4">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-sky-400 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-white/45">
              アップロード・送信中 {progress}%
            </p>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        <button
          disabled={saving || !eventName.trim() || (!file && !message.trim())}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-5 py-3 font-black text-black disabled:opacity-40"
        >
          <Send size={17} />
          {saving ? "送信中" : "コーチへ依頼する"}
        </button>
      </form>
      <section>
        <h2 className="text-xl font-black">依頼履歴</h2>
        {initialItems.length ? (
          <div className="mt-4 space-y-4">
            {initialItems.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-white/10 bg-[#111] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span
                      className={`text-xs font-black ${item.status === "answered" ? "text-emerald-300" : "text-sky-300"}`}
                    >
                      {item.status === "answered"
                        ? "回答済み"
                        : item.status === "pending"
                          ? "依頼中"
                          : "取消済み"}
                      {item.priority === "urgent" ? "・大会前" : ""}
                    </span>
                    <h3 className="mt-2 text-lg font-black">
                      {item.event_name}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-white/45">依頼日：{new Date(item.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</p><p className="mt-1 text-[11px] text-white/30">{new Date(item.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <button
                    onClick={() => cancel(item)}
                    aria-label="依頼を削除"
                    className="p-2 text-red-300/70"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                {item.awareness_category && (
                  <span className="mt-3 inline-block rounded-full border border-orange-500/30 px-3 py-1 text-xs text-orange-300">
                    {item.awareness_category}
                  </span>
                )}
                {item.message && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-white/65">
                    {item.message}
                  </p>
                )}
                {item.video_url && (
                  <div className="mt-4">
                    <LazyVideoPlayer src={item.video_url} label="依頼動画を見る" />
                  </div>
                )}
                <VideoFeedbackConversation requestId={item.id} messages={item.messages ?? []} role="athlete" />
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-white/40">
            コーチへの相談履歴はまだありません。
          </p>
        )}
      </section>
    </div>
  );
}
