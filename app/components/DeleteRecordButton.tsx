"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";

export default function DeleteRecordButton({
  recordId,
  compact = false,
  videoPath,
}: {
  recordId: number;
  compact?: boolean;
  videoPath?: string | null;
}) {
  const router = useRouter();

  async function deleteRecord() {
    const ok = confirm("この記録を削除しますか？");

    if (!ok) return;

    const supabase = createClient();

    if (videoPath) {
      const { error: storageError } = await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).remove([videoPath]);
      if (storageError) {
        alert("動画を削除できませんでした：" + storageError.message);
        return;
      }
    }

    const { error } = await supabase
      .from("performance_records")
      .delete()
      .eq("id", recordId);

    if (error) {
      alert("削除できませんでした：" + error.message);
      return;
    }

    alert("記録を削除しました");

    router.refresh();
  }

  return (
    
    <button
      onClick={deleteRecord}
      style={{
        height: compact ? 36 : undefined,
        padding: compact ? "0 13px" : "8px 16px",
        borderRadius: 10,
        border: "none",
        background: "#dc2626",
        color: "white",
        cursor: "pointer",
        fontSize: compact ? 14 : undefined,
      }}
    >
      削除
    </button>
  );
}
