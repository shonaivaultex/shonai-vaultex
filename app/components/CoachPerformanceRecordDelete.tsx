"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export default function CoachPerformanceRecordDelete({ recordId }: { recordId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!confirm("コーチが入力したこの記録を削除しますか？\n選手本人が入力した記録は削除されません。")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/coach/performance-records/${recordId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "削除できませんでした。");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "削除できませんでした。");
      setDeleting(false);
    }
  }

  return <button type="button" disabled={deleting} onClick={remove} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50">
    <Trash2 size={14} />{deleting ? "削除中" : "誤入力を削除"}
  </button>;
}
