"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { scheduleStage } from "@/lib/schedule-stage";

export default function ScheduleStageAction({ start, end, allDay = false, rest = false, active = true, recorded = false, href, onOpen }: {
  start: string; end?: string | null; allDay?: boolean; rest?: boolean; active?: boolean; recorded?: boolean; href?: string; onOpen?: () => void;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, 15000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); document.removeEventListener("visibilitychange", update); };
  }, []);
  const stage = now === null ? null : scheduleStage(start, end, allDay, now);
  const badge = rest ? "休養日" : recorded ? "記録あり" : !active ? "参加予定なし" : stage === "after" ? "終了後" : stage === "during" ? "開催中" : stage === "before" ? "開始前" : "予定";
  const label = rest || !active || !stage ? "予定を確認" : recorded ? "この日の記録・動画を確認" : stage === "after" ? "振り返り・記録を残す" : stage === "during" ? "内容を確認・記録を追加" : "時間・場所・内容を確認";
  return <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[.04] p-3">
    <p className="text-xs font-bold text-emerald-300">{badge}</p>
    {href ? <Link href={href} className="mt-2 block py-2 text-sm font-bold">{label} →</Link> : <button type="button" onClick={onOpen} className="mt-2 w-full py-2 text-left text-sm font-bold">{label} →</button>}
  </div>;
}
