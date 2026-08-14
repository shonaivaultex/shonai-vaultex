"use client";

import { awarenessCategories } from "@/lib/performance-awareness";

export default function AwarenessTagSelector({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  return <div className="mt-3 flex flex-wrap gap-2">{awarenessCategories.map((tag) => {
    const selected = value.includes(tag);
    return <button key={tag} type="button" aria-pressed={selected} onClick={() => onChange(selected ? value.filter((item) => item !== tag) : [...value, tag])} className={`rounded-full border px-3 py-2 text-sm font-bold transition ${selected ? "border-orange-400 bg-orange-500/20 text-orange-200" : "border-white/15 bg-[#101216] text-white/55 hover:border-orange-500/50"}`}>{tag}</button>;
  })}</div>;
}
