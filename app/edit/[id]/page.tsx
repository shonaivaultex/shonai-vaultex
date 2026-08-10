"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { performanceEvents } from "@/lib/performance-events";

export default function EditPerformancePage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : params.id?.[0];

  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const events = performanceEvents.map((event) => event.name);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("performance_records")
        .select("category, value, date")
        .eq("id", id)
        .single();

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }

      setCategory(data.category ?? "");
      setValue(String(data.value ?? ""));
      setDate(data.date ?? "");
      setLoading(false);
    };

    void fetchRecord();
  }, [id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) return;

    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("performance_records")
      .update({
        category,
        value,
        date,
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/mypage");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111] px-4 text-white">
        <p className="text-sm font-medium tracking-widest text-[#ff7a00]">
          LOADING...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#111] px-4 pt-40 pb-20 text-white sm:px-6">
      <div className="mx-auto w-full max-w-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 text-sm font-bold text-zinc-400 transition hover:text-[#ff7a00]"
        >
          ← 戻る
        </button>

        <div className="border-l-4 border-[#ff7a00] pl-4">
          <p className="text-xs font-bold tracking-[0.2em] text-[#ff7a00]">
            PERFORMANCE RECORD
          </p>
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">記録を編集</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8"
        >
          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-bold text-zinc-200"
            >
              種目
            </label>
            <select
  id="category"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
  required
  className="w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/30"
>
  {events.map((eventName) => (
    <option
      key={eventName}
      value={eventName}
      className="bg-[#111]"
    >
      {eventName}
    </option>
  ))}
</select>
          </div>

          <div>
            <label
              htmlFor="value"
              className="mb-2 block text-sm font-bold text-zinc-200"
            >
              記録
            </label>
            <input
              id="value"
              type="text"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="例：100kg"
              required
              className="w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/30"
            />
          </div>

          <div>
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-bold text-zinc-200"
            >
              測定日
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-xl border border-zinc-700 bg-[#111] px-4 py-3 text-white outline-none transition [color-scheme:dark] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/30"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-[#ff7a00] px-4 py-4 text-sm font-black tracking-widest text-black transition hover:bg-[#ff921f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "保存中..." : "保存する"}
          </button>
        </form>
      </div>
    </main>
  );
}
