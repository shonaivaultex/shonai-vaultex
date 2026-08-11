"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";
import DeleteRecordButton from "@/app/components/DeleteRecordButton";
import { createClient } from "@/lib/supabase-browser";
import FeedbackRequestButton from "@/app/components/FeedbackRequestButton";

type CoachFeedback = { id: number; body: string; created_at: string; acknowledged_at?: string | null; coach_name: string };
type FeedbackRequest = { id: number; request_type: string; message: string | null; priority: string; status: string };
type RecordItem = { id: number; value: number | string; date: string; awareness_category?: string | null; awareness_note?: string | null; video_path?: string | null; video_url?: string | null; coach_feedback?: CoachFeedback[]; feedback_request?: FeedbackRequest | null };

export default function PerformanceHistoryModal({ records, unit, focusRecordId }: { records: RecordItem[]; unit: string; focusRecordId?: number | null }) {
  const [open, setOpen] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<number | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<number[]>([]);
  const videoCount = records.filter((record) => record.video_url).length;
  const unreadCount = records.flatMap((record) => record.coach_feedback ?? []).filter((item) => !item.acknowledged_at && !acknowledgedIds.includes(item.id)).length;
  useEffect(() => {
    if (focusRecordId && records.some((record) => record.id === focusRecordId)) setOpen(true);
  }, [focusRecordId, records]);
  useEffect(() => {
    if (!open || !focusRecordId) return;
    const timer = window.setTimeout(() => document.getElementById(`feedback-record-${focusRecordId}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    return () => window.clearTimeout(timer);
  }, [open, focusRecordId]);
  async function acknowledge(feedbackId: number) {
    setAcknowledgingId(feedbackId);
    const { error } = await createClient().rpc("acknowledge_coach_feedback", { p_feedback_id: feedbackId });
    setAcknowledgingId(null);
    if (error) { alert("確認状態を保存できませんでした：" + error.message); return; }
    setAcknowledgedIds((current) => [...current, feedbackId]);
  }
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [open]);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="w-full border-t border-white/10 px-6 py-4 text-left text-sm font-bold text-orange-400 hover:bg-white/[0.025]">▶ 記録を振り返る（{records.length}件・動画{videoCount}件）{unreadCount > 0 && <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">未確認{unreadCount}</span>}</button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" onClick={() => { setOpen(false); setPlayingId(null); }}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-orange-500/60 bg-[#111]" onClick={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#111] px-6 py-4"><h2 className="text-lg font-black text-white">記録履歴</h2><button type="button" onClick={() => { setOpen(false); setPlayingId(null); }} aria-label="履歴を閉じる" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"><X /></button></div>
        <div className="px-6 pb-3">{records.map((record) => <div id={`feedback-record-${record.id}`} key={record.id} className={`border-b border-white/10 py-5 last:border-0 ${focusRecordId === record.id ? "scroll-mt-20 rounded-xl bg-orange-500/[0.06] px-3" : ""}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0"><strong className="text-xl text-white">{record.value}<span className="ml-1 text-sm">{unit}</span></strong><p className="mt-1 text-xs text-white/50">{record.date}</p>{record.awareness_category && <span className="mt-2 inline-flex rounded-full border border-orange-500/35 bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-300">{record.awareness_category}</span>}{record.awareness_note && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/70">{record.awareness_note}</p>}</div>
            <div className="flex shrink-0 gap-2"><Link href={`/edit/${record.id}`} className="inline-flex h-9 items-center rounded-lg border border-white/20 px-3 text-sm text-white">編集</Link><DeleteRecordButton recordId={record.id} videoPath={record.video_path} compact /></div>
          </div>
          {record.video_url && <button type="button" onClick={() => setPlayingId(playingId === record.id ? null : record.id)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-black text-white transition hover:bg-orange-400"><Play size={15} fill="currentColor" />{playingId === record.id ? "動画を閉じる" : "動画を見る"}</button>}
          {playingId === record.id && record.video_url && <div className="mt-4 rounded-xl border border-orange-500/30 bg-black p-2"><video key={record.id} autoPlay controls playsInline className="max-h-[58vh] w-full rounded-lg object-contain" src={record.video_url}>お使いのブラウザは動画再生に対応していません。</video></div>}
          <FeedbackRequestButton recordId={record.id} initialRequest={record.feedback_request} />
          {(record.coach_feedback ?? []).map((feedback) => {
            const acknowledged = Boolean(feedback.acknowledged_at) || acknowledgedIds.includes(feedback.id);
            return <div key={feedback.id} className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-black text-emerald-300">{feedback.coach_name}からのフィードバック</span>{!acknowledged && <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-300">未確認</span>}</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/80">{feedback.body}</p>
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-white/35">{new Date(feedback.created_at).toLocaleString("ja-JP")}</span>{acknowledged ? <span className="text-xs font-bold text-emerald-400">確認済み</span> : <button type="button" disabled={acknowledgingId === feedback.id} onClick={() => acknowledge(feedback.id)} className="rounded-lg border border-emerald-500/40 px-3 py-2 text-xs font-bold text-emerald-300 disabled:opacity-50">{acknowledgingId === feedback.id ? "保存中" : "確認しました"}</button>}</div>
            </div>;
          })}
        </div>)}</div>
      </div>
    </div>}
  </>;
}
