"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AttendanceStatus = "attending" | "absent" | "undecided";
type Availability = { capacity: number | null; count: number; deadline: string; closed: boolean };

export default function ScheduleAttendance({ scheduleId, scheduleType, onSaved }: { scheduleId: number; scheduleType?: string; onSaved?: (status: AttendanceStatus) => void }) {
  const router = useRouter();
  const busy = useRef(false);
  const [notice, setNotice] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState(scheduleType);
  const [personalSlot, setPersonalSlot] = useState(scheduleType === "personal");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [reload, setReload] = useState(0);
  const registration = !personalSlot && (type === "practice" || type === "measurement");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoaded(false);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("ログインして予定を確認してください。");
        const [{ data, error }, { data: schedule, error: scheduleError }] = await Promise.all([
          supabase.from("schedule_attendance").select("status, comment").eq("schedule_id", scheduleId).eq("user_id", user.id).maybeSingle(),
          supabase.from("schedules").select("is_personal_slot,schedule_type").eq("id", scheduleId).single(),
        ]);
        if (error || scheduleError || !schedule) throw new Error("予定を読み込めませんでした。");
        let info: Availability | null = null;
        if (!schedule.is_personal_slot && ["practice", "measurement"].includes(schedule.schedule_type)) {
          const result = await supabase.rpc("practice_availability", { p_schedule_id: scheduleId });
          if (result.error) throw new Error("受付状況を確認できませんでした。");
          info = result.data as Availability;
        }
        if (active) {
          setStatus(data?.status as AttendanceStatus ?? null);
          setComment(data?.comment ?? "");
          setPersonalSlot(schedule.is_personal_slot);
          setType(schedule.schedule_type);
          setAvailability(info);
          setLoaded(true);
        }
      } catch (error) {
        if (active) setNotice(error instanceof Error ? error.message : "読み込みに失敗しました。");
      }
    };
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; document.removeEventListener("visibilitychange", refresh); };
  }, [scheduleId, reload]);

  async function save(nextStatus: AttendanceStatus) {
    if (busy.current || !loaded) return;
    if (registration && nextStatus === "absent" && !confirm("この練習会の申込みをキャンセルしますか？")) return;
    busy.current = true;
    setNotice(""); setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ログインし直してください。");
      const { error } = await supabase.from("schedule_attendance").upsert({
        schedule_id: scheduleId, user_id: user.id, status: nextStatus,
        comment: comment.trim() || null, updated_at: new Date().toISOString(),
      }, { onConflict: "schedule_id,user_id" });
      if (error) throw new Error(error.message.includes("定員") || error.message.includes("締切") ? error.message : "保存できませんでした。もう一度お試しください。");
      setStatus(nextStatus);
      onSaved?.(nextStatus);
      setNotice(registration ? nextStatus === "attending" ? "申込み済みです。参加が確定しました。" : "申込みをキャンセルしました。" : "回答を保存しました。");
      router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "保存できませんでした。");
    } finally {
      setSaving(false); busy.current = false; setReload((value) => value + 1);
    }
  }
  const full = availability?.capacity != null && availability.count >= availability.capacity;
  const closed = availability?.closed ?? false;
  const labels: Record<AttendanceStatus, string> = type === "competition"
    ? { attending: "参加する", absent: "参加しない", undecided: "あとで決める" }
    : { attending: "参加", absent: "欠席", undecided: "未定" };
  if (personalSlot) return <div className="mt-3 border-t border-white/10 pt-3"><Link href="/mypage/personal" className="inline-flex rounded-lg bg-orange-500 px-4 py-2 text-xs font-black text-black">空き状況を見て予約</Link></div>;
  return <div className="mt-3 border-t border-white/10 pt-3">
    <p className="mb-2 text-sm font-bold">{!loaded ? "確認中…" : registration ? status === "attending" ? "申込み済み・参加確定" : "未申込み" : `あなたの回答：${status ? labels[status] : "未回答"}`}</p>
    {registration ? <>
      <p className="mb-3 text-xs leading-6 text-white/65">事前申込制です。申込みが完了すると自分の予定に表示されます。参加しない場合の回答は不要です。</p>
      {availability && <p className="mb-3 text-xs leading-6 text-white/70">
        {availability.capacity === null ? "定員設定なし" : `申込み ${availability.count} / ${availability.capacity}名`}<br />
        締切：{new Date(availability.deadline).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}（日本時間）
      </p>}
      {status === "attending" ? <button type="button" disabled={saving || !loaded} onClick={() => save("absent")} className="min-h-11 rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-40">申込みをキャンセル</button>
        : <button type="button" disabled={saving || !loaded || full || closed} onClick={() => save("attending")} className="min-h-11 rounded-lg bg-orange-500 px-4 py-2 text-sm font-black text-black disabled:opacity-40">{closed ? "受付終了" : full ? "満員・受付終了" : "参加を申し込む"}</button>}
    </> : <>
      <p className="mb-3 text-xs text-white/60">ボタンを押すと保存されます。あとから変更できます。</p>
      {type === "competition" && <p className="mb-3 text-xs text-white/60">大会への正式な申込みとは別の参加予定です。</p>}
      <div className="flex flex-wrap gap-2">{(["attending", "absent", "undecided"] as const).map((value) => <button key={value} type="button" aria-pressed={status === value} disabled={saving || !loaded} onClick={() => save(value)} className={`min-h-11 rounded-lg border px-4 py-2 text-sm disabled:opacity-40 ${status === value ? "border-emerald-500 text-emerald-300" : "border-white/20 text-white/65"}`}>{labels[value]}</button>)}</div>
    </>}
    <button type="button" onClick={() => setOpen((value) => !value)} className="ml-3 min-h-11 text-xs text-white/65">{open ? "閉じる" : "連絡事項（任意）"}</button>
    <p role="status" className="mt-2 text-xs text-emerald-200">{saving ? "保存中…" : notice}</p>
    {!loaded && !saving && notice && <button type="button" onClick={() => setReload((value) => value + 1)} className="mt-2 text-sm underline">再読み込み</button>}
    {open && <div className="mt-2 flex gap-2"><input aria-label="連絡事項" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={200} placeholder="遅刻・早退など（任意）" className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-xs" /><button type="button" disabled={!status || (registration && status !== "attending") || saving || !loaded} onClick={() => status && save(status)} className="rounded-lg bg-orange-500 px-3 text-xs font-bold text-black disabled:opacity-40">保存</button></div>}
  </div>;
}
