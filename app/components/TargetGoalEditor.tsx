"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Props = {
  category: string;
  initialTarget: number | null;
  unit: string;
  userId: string;
};

export default function TargetGoalEditor({ category, initialTarget, unit, userId }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(initialTarget === null);
  const [value, setValue] = useState(initialTarget?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveGoal() {
    const targetValue = Number(value);
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      setError("0より大きい数値を入力してください");
      return;
    }

    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: saveError } = await supabase.from("performance_goals").upsert(
      { user_id: userId, category, target_value: targetValue, updated_at: new Date().toISOString() },
      { onConflict: "user_id,category" },
    );

    if (saveError) {
      setError("目標を保存できませんでした");
      setSaving(false);
      return;
    }

    setEditing(false);
    setSaving(false);
    router.refresh();
  }

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-left text-white transition hover:text-orange-300" aria-label={`${category}の目標を編集`}>
        <strong className="text-2xl leading-none">{initialTarget}</strong>
        <span className="text-sm text-white/60">{unit}</span>
        <Pencil size={14} className="ml-1 text-orange-400" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center rounded-lg border border-orange-500/60 bg-black/30 px-3 focus-within:border-orange-400">
          <input
            type="number"
            min="0"
            step="any"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void saveGoal();
              if (event.key === "Escape" && initialTarget !== null) setEditing(false);
            }}
            autoFocus
            className="min-w-0 flex-1 bg-transparent py-2 text-lg font-bold outline-none"
            aria-label={`${category}の目標記録`}
          />
          <span className="text-xs text-white/45">{unit}</span>
        </div>
        <button type="button" onClick={() => void saveGoal()} disabled={saving} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-500 text-black transition hover:bg-orange-400 disabled:opacity-50" aria-label="目標を保存">
          <Check size={17} aria-hidden="true" />
        </button>
        {initialTarget !== null && (
          <button type="button" onClick={() => { setValue(initialTarget.toString()); setError(""); setEditing(false); }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/15 text-white/60 transition hover:text-white" aria-label="キャンセル">
            <X size={17} aria-hidden="true" />
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}

