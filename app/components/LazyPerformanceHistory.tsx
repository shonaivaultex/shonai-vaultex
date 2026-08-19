"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

type CoachFeedback = { id: number; body: string; created_at: string; acknowledged_at?: string | null; coach_name: string };
type FeedbackRequest = { id: number; request_type: string; message: string | null; priority: string; status: string };
type RecordItem = { id: number; value: number | string; date: string; awareness_category?: string | null; awareness_categories?: string[] | null; awareness_note?: string | null; video_path?: string | null; video_url?: string | null; coach_feedback?: CoachFeedback[]; feedback_request?: FeedbackRequest | null };

const PerformanceHistoryModal = dynamic(() => import("@/app/components/PerformanceHistoryModal"), {
  loading: () => <div className="w-full border-t border-white/10 px-6 py-4 text-sm font-bold text-orange-300">履歴を準備中…</div>,
});

export default function LazyPerformanceHistory({ records, unit, focusRecordId }: { records: RecordItem[]; unit: string; focusRecordId?: number | null }) {
  const [loaded, setLoaded] = useState(Boolean(focusRecordId));
  if (loaded) return <PerformanceHistoryModal records={records} unit={unit} focusRecordId={focusRecordId} initialOpen />;

  const videoCount = records.filter((record) => record.video_path).length;
  const unreadCount = records.flatMap((record) => record.coach_feedback ?? []).filter((item) => !item.acknowledged_at).length;
  return (
    <button type="button" onClick={() => setLoaded(true)} className="w-full border-t border-white/10 px-6 py-4 text-left text-sm font-bold text-orange-400 hover:bg-white/[0.025]">
      ▶ 記録を振り返る（{records.length}件・動画{videoCount}件）
      {unreadCount > 0 ? <span className="ml-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] text-white">未確認{unreadCount}</span> : null}
    </button>
  );
}
