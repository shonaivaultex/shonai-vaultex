"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function DeleteRecordButton({
  recordId,
  compact = false,
}: {
  recordId: number;
  compact?: boolean;
}) {
  const router = useRouter();

  async function deleteRecord() {
    const ok = confirm("この記録を削除しますか？");

    if (!ok) return;

    const supabase = createClient();

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
