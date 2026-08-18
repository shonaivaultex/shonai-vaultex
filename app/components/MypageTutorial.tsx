"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Bot, Check, MessageSquareText, Play, Plus, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const TUTORIAL_VERSION = 1;

const steps = [
  {
    eyebrow: "WELCOME TO SHONAI VAULTEX",
    title: "自分の成長を、ひとつの場所に",
    body: "記録・感覚・動画・コーチの言葉を残して、良かった時の自分をいつでも振り返れます。",
    icon: Sparkles,
  },
  {
    eyebrow: "STEP 1 / RECORD",
    title: "まずは記録を追加",
    body: "練習記録・本番記録・CONTROL TESTから選べます。入力した記録はPBやグラフ、成長レポートへ反映されます。",
    icon: Plus,
  },
  {
    eyebrow: "STEP 2 / REFLECTION",
    title: "意識と動画を一緒に残す",
    body: "何を意識したか、どんな感覚だったかを動画と一緒に保存すると、数字だけでは分からない変化も見つけやすくなります。",
    icon: Play,
  },
  {
    eyebrow: "STEP 3 / COACH",
    title: "迷った時はコーチに相談",
    body: "記録や動画を付けてフィードバックを依頼できます。返信後はトーク形式で追加の質問もできます。",
    icon: MessageSquareText,
  },
  {
    eyebrow: "READY",
    title: "分からないことはVAULTEX AIへ",
    body: "使い方や競技の振り返りで迷ったら、VAULTEX AIにそのまま話しかければOK。一緒に状況を整理して、次に見る場所や行動をご案内します。",
    icon: Bot,
  },
] as const;

type Props = {
  autoOpen: boolean;
  userId: string;
};

export default function MypageTutorial({ autoOpen, userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  async function rememberSeen() {
    setSaving(true);
    await createClient()
      .from("players")
      .update({ mypage_tutorial_version: TUTORIAL_VERSION })
      .eq("user_id", userId);
    setSaving(false);
  }

  async function close() {
    await rememberSeen();
    setOpen(false);
    setStep(0);
  }

  async function goTo(href: string) {
    await rememberSeen();
    setOpen(false);
    router.push(href);
  }

  function replay() {
    setStep(0);
    setOpen(true);
  }

  const current = steps[step];
  const Icon = current.icon;
  const last = step === steps.length - 1;

  return (
    <>
      <button type="button" onClick={replay} className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/75 transition hover:border-orange-500/40 hover:text-white">
        <span className="flex items-center gap-2 font-bold"><Sparkles size={17} className="text-orange-400" />はじめての使い方</span>
        <span className="text-xs text-white/35">もう一度見る</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="mypage-tutorial-title">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-orange-500/45 bg-[#101010] text-white shadow-[0_24px_90px_rgba(0,0,0,.65)]">
            <div className="h-1 bg-white/10"><div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
            <button type="button" aria-label="あとで見る" disabled={saving} onClick={() => void close()} className="absolute right-4 top-5 rounded-full bg-white/10 p-2 text-white/55 transition hover:text-white disabled:opacity-40"><X size={18} /></button>

            <div className="px-6 pb-7 pt-10 sm:px-9 sm:pb-9">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-orange-500/15 text-orange-400"><Icon size={30} /></span>
              <p className="mt-7 text-[11px] font-black tracking-[.2em] text-orange-400">{current.eyebrow}</p>
              <h2 id="mypage-tutorial-title" className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{current.title}</h2>
              <p className="mt-4 min-h-24 text-sm leading-7 text-white/60 sm:text-base">{current.body}</p>

              <div className="mt-6 flex items-center justify-center gap-2" aria-label={`${step + 1}/${steps.length}`}>
                {steps.map((item, index) => <span key={item.eyebrow} className={`h-1.5 rounded-full transition-all ${index === step ? "w-7 bg-orange-500" : "w-1.5 bg-white/20"}`} />)}
              </div>

              <div className="mt-7 flex items-center gap-3">
                {step > 0 ? <button type="button" onClick={() => setStep((value) => value - 1)} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-white/15 text-white/65 hover:text-white"><ArrowLeft size={18} /></button> : null}
                {!last ? <button type="button" onClick={() => setStep((value) => value + 1)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 font-black text-black transition hover:bg-orange-400">次へ<ArrowRight size={18} /></button> : <button type="button" disabled={saving} onClick={() => void goTo("/mypage/ai-navigator")} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 font-black text-black transition hover:bg-orange-400 disabled:opacity-50"><Bot size={18} />AIに相談してみる</button>}
              </div>

              {last ? <button type="button" disabled={saving} onClick={() => void close()} className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-white/50 transition hover:text-white"><Check size={16} />マイページを使い始める</button> : <button type="button" disabled={saving} onClick={() => void close()} className="mt-3 w-full py-2 text-xs font-bold text-white/35 transition hover:text-white/65">あとで見る</button>}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
