"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowLeft, Check, LoaderCircle, Save } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { eventNamesByKind, type PerformanceKind, unitMap } from "@/lib/performance-events";

function today() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
}

function PerformanceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const kind: PerformanceKind = searchParams.get("kind") === "athletics" ? "athletics" : "control-test";
  const eventOptions = eventNamesByKind(kind);
  const [category, setCategory] = useState(eventOptions[0]);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(today);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

const unit = unitMap[category] ?? "";

  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setErrorMessage("記録には0より大きい数値を入力してください。");
      return;
    }

    const supabase = createClient();
    setIsSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setErrorMessage("記録を保存するにはログインが必要です。");
        return;
      }

      const { error } = await supabase.from("performance_records").insert({
        user_id: user.id,
        category,
        value: numericValue,
        date,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      router.push(kind === "athletics" ? "/mypage/athletics" : "/mypage/control-tests");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href={kind === "athletics" ? "/mypage/athletics" : "/mypage/control-tests"}
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 transition hover:text-orange-400"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          MY PAGE
        </Link>

        <div className="mt-10 border-l-2 border-orange-500 pl-5">
          <p className="text-xs font-black tracking-[0.22em] text-orange-400">TRAINING LOG</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
            {kind === "athletics" ? "陸上競技記録を追加" : "テスト記録を追加"}
          </h1>
          <p className="mt-3 leading-7 text-white/60">
            今日の挑戦を残そう。積み重ねた記録が、次の自信になる。
          </p>
        </div>

        <form
          onSubmit={saveRecord}
          className="mt-10 rounded-2xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 sm:p-8"
        >
          <div className="space-y-6">
            <label className="block">
              <span className="text-sm font-bold text-white">種目</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-3 w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition focus:border-orange-500"
              >
                {eventOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-white">記録</span>
              <div className="relative mt-3">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  required
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder="例：16.30"
                  className="w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 pr-16 text-lg font-bold text-white outline-none transition placeholder:text-white/25 focus:border-orange-500"
                />
                <span className="pointer-events-none absolute inset-y-0 right-5 grid place-items-center text-sm font-bold text-white/40">
                  {unit}
                </span>
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-white">測定日</span>
              <input
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-3 w-full rounded-xl border border-white/15 bg-[#101216] px-4 py-4 text-white outline-none transition focus:border-orange-500"
              />
            </label>
          </div>

          {errorMessage && (
            <p role="alert" className="mt-6 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-4 text-sm font-black tracking-[0.14em] text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <LoaderCircle className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? "SAVING..." : "記録を保存"}
          </button>

          <p className="mt-5 flex items-center gap-2 text-xs text-white/45">
            <Check size={15} className="text-orange-400" aria-hidden="true" />
            保存後はマイページの記録一覧に反映されます。
          </p>
        </form>
      </div>
    </main>
  );
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#090a0c]" />}>
      <PerformanceForm />
    </Suspense>
  );
}
