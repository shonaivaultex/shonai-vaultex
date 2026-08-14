"use client";

import { useState } from "react";
import { UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type CoachOption = { user_id: string; name: string };

export default function VideoFeedbackAssignee({ requestId, initialCoachId, coaches }: { requestId: number; initialCoachId: string | null; coaches: CoachOption[] }) {
  const router = useRouter();
  const [coachId, setCoachId] = useState(initialCoachId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function change(nextCoachId: string) {
    const previous = coachId;
    setCoachId(nextCoachId);
    setSaving(true);
    setError("");
    const { error: saveError } = await createClient().rpc("set_video_feedback_assignee", { p_request_id: requestId, p_coach_id: nextCoachId || null });
    setSaving(false);
    if (saveError) { setCoachId(previous); setError("担当コーチを変更できませんでした。"); return; }
    router.refresh();
  }

  return <div className="mt-5 rounded-xl border border-orange-500/25 bg-orange-500/[0.06] p-4">
    <label className="flex items-center gap-2 text-xs font-black text-orange-300"><UserRoundCheck size={15} />担当コーチ</label>
    <select value={coachId} disabled={saving} onChange={(event) => void change(event.target.value)} className="mt-2 w-full rounded-lg border border-white/15 bg-[#111] px-3 py-2.5 text-sm text-white disabled:opacity-50">
      <option value="">未担当（クラス担当全員へ通知）</option>
      {coaches.map((coach) => <option key={coach.user_id} value={coach.user_id}>{coach.name}</option>)}
    </select>
    <p className="mt-2 text-[11px] leading-5 text-white/40">担当決定後、選手からの返信通知は選択したコーチだけに届きます。</p>
    {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
  </div>;
}
