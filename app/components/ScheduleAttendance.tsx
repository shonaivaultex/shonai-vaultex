"use client";

import { useEffect, useState } from "react";
import { Check, HelpCircle, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

type AttendanceStatus = "attending" | "absent" | "undecided";
const options: Array<{ value: AttendanceStatus; label: string; icon: typeof Check; active: string }> = [
  { value: "attending", label: "参加", icon: Check, active: "border-emerald-500 bg-emerald-500/15 text-emerald-300" },
  { value: "absent", label: "欠席", icon: X, active: "border-red-500 bg-red-500/15 text-red-300" },
  { value: "undecided", label: "未定", icon: HelpCircle, active: "border-amber-500 bg-amber-500/15 text-amber-300" },
];

export default function ScheduleAttendance({ scheduleId, scheduleType }: { scheduleId: number; scheduleType?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<AttendanceStatus | null>(null); const [comment, setComment] = useState(""); const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("schedule_attendance").select("status, comment").eq("schedule_id", scheduleId).eq("user_id", user.id).maybeSingle();
      if (active && data) { setStatus(data.status as AttendanceStatus); setComment(data.comment ?? ""); }
    })();
    return () => { active = false; };
  }, [scheduleId]);
  async function save(nextStatus: AttendanceStatus) {
    setSaving(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { setSaving(false); return; }
    const { error } = await supabase.from("schedule_attendance").upsert({ schedule_id: scheduleId, user_id: user.id, status: nextStatus, comment: comment.trim() || null, updated_at: new Date().toISOString() }, { onConflict: "schedule_id,user_id" }); setSaving(false); if (error) { alert(error.message); return; } setStatus(nextStatus); router.refresh();
  }
  const isCompetition = scheduleType === "competition";
  const labels: Record<AttendanceStatus, string> = isCompetition
    ? { attending: "参加する", absent: "参加しない", undecided: "あとで決める" }
    : { attending: "参加", absent: "欠席", undecided: "未定" };
  return <div className="mt-3 border-t border-white/[0.07] pt-3">{isCompetition ? <p className="mb-2 text-[11px] leading-relaxed text-white/45">試合は最初からマイカレンダーに表示されます。「参加しない」を選ぶと外れます。</p> : null}<div className="flex flex-wrap gap-2">{options.map((option) => { const Icon = option.icon; return <button key={option.value} type="button" disabled={saving} onClick={() => save(option.value)} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold disabled:opacity-40 ${status === option.value ? option.active : "border-white/10 text-white/45"}`}><Icon size={13} />{labels[option.value]}</button>; })}<button type="button" onClick={() => setOpen((current) => !current)} className="ml-auto px-2 text-xs text-white/40">{open ? "閉じる" : comment ? "コメント編集" : "コメント"}</button></div>{open && <div className="mt-2 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={200} placeholder="遅刻・早退など（任意）" className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white" /><button type="button" disabled={!status || saving} onClick={() => status && save(status)} className="rounded-lg bg-orange-500 px-3 text-xs font-bold disabled:opacity-40">保存</button></div>}</div>;
}
