"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, ArrowRight, Bot, CalendarDays, Check, Compass, Play, Plus, ScanLine, Settings, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export const MYPAGE_TUTORIAL_VERSION = 2;

type TutorialRect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

const steps = [
  { eyebrow: "WELCOME TO SHONAI VAULTEX", title: "マイページを一緒に見てみよう", body: "これから実際の画面を1つずつ照らしながら説明します。いつでも「あとで見る」で閉じられます。", icon: Sparkles, target: null },
  { eyebrow: "STEP 1 / ATHLETE SCAN", title: "身体能力の現在地を確認", body: "CONTROL TESTをまとめて記録すると、身体能力の特徴と変化をATHLETE SCANで振り返れます。初めて測定するときもここから始められます。", icon: ScanLine, target: "athlete-scan" },
  { eyebrow: "STEP 2 / RECORD", title: "練習や大会の記録を追加", body: "ここから練習記録・本番記録・CONTROL TESTを選んで登録します。記録はPB、グラフ、成長レポートへ自動で反映されます。", icon: Plus, target: "record-action" },
  { eyebrow: "STEP 3 / VIDEO & FEEDBACK", title: "動画だけでもコーチに相談できる", body: "記録がない日でも動画を送れます。相談内容を添えると、コーチとのトークでフィードバックを受け取れます。", icon: Play, target: "video-action" },
  { eyebrow: "STEP 4 / PERFORMANCE", title: "記録・意識・動画を振り返る", body: "練習記録、本番記録、コントロールテストはここから見分けられます。良かった日の意識や動画も一緒に確認できます。", icon: Activity, target: "performance" },
  { eyebrow: "STEP 5 / SCHEDULE", title: "次の予定を確認", body: "練習会やクラス別の予定を確認します。出欠回答が必要な予定もここから開けます。", icon: CalendarDays, target: "schedule-action" },
  { eyebrow: "STEP 6 / VAULTEX AI", title: "迷ったらVAULTEX AIへ", body: "使い方や競技の悩みをそのまま話しかけてOKです。状況を一緒に整理し、見るべき記録や次の行動、必要ならコーチ相談へ案内します。", icon: Compass, target: "ai-navigator" },
  { eyebrow: "STEP 7 / SETTINGS", title: "設定・マニュアル・バックアップ", body: "通知設定、使用マニュアル、記録のCSV保存、プロフィール編集は「その他」にまとまっています。チュートリアルはページ上部の「マイページの使い方」から何度でも見直せます。", icon: Settings, target: "settings" },
  { eyebrow: "READY", title: "準備完了。まず1つ触ってみよう", body: "最初から全部覚えなくて大丈夫です。分からないことがあればVAULTEX AIに聞けば、いつでも使い方を案内します。", icon: Bot, target: null },
] as const;

type Props = { autoOpen: boolean; userId: string };

export default function MypageTutorial({ autoOpen, userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [targetRect, setTargetRect] = useState<TutorialRect | null>(null);
  const current = steps[step];
  const Icon = current.icon;
  const last = step === steps.length - 1;

  useEffect(() => {
    if (!open || !current.target) {
      return;
    }
    const element = document.querySelector<HTMLElement>(`[data-tutorial="${current.target}"]`);
    if (!element) {
      return;
    }
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const update = () => {
      const rect = element.getBoundingClientRect();
      const pad = 8;
      setTargetRect({ top: Math.max(8, rect.top - pad), left: Math.max(8, rect.left - pad), right: Math.min(window.innerWidth - 8, rect.right + pad), bottom: Math.min(window.innerHeight - 8, rect.bottom + pad), width: Math.min(window.innerWidth - 16, rect.width + pad * 2), height: Math.min(window.innerHeight - 16, rect.height + pad * 2) });
    };
    update();
    const timer = window.setTimeout(update, 400);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [current.target, open]);

  async function rememberSeen() {
    setSaving(true);
    const { error } = await createClient().from("players").update({ mypage_tutorial_version: MYPAGE_TUTORIAL_VERSION }).eq("user_id", userId);
    setSaving(false);
    return !error;
  }

  function dismiss() {
    setOpen(false);
    setStep(0);
  }

  async function finish() {
    await rememberSeen();
    dismiss();
  }

  async function goToAi() {
    await rememberSeen();
    setOpen(false);
    router.push("/mypage/ai-navigator");
  }

  function replay() {
    setStep(0);
    setOpen(true);
  }

  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const spotlightRect = current.target ? targetRect : null;
  const cardBelow = spotlightRect ? spotlightRect.bottom + 300 < viewportHeight : false;

  return <>
    <button type="button" onClick={replay} className="mt-4 flex w-full items-center justify-between rounded-xl border border-orange-500/25 bg-orange-500/[0.05] px-4 py-3 text-sm text-white/75 transition hover:border-orange-500/50 hover:text-white">
      <span className="flex items-center gap-2 font-bold"><Sparkles size={17} className="text-orange-400" />マイページの使い方</span><span className="text-xs text-white/35">チュートリアルを見る</span>
    </button>
    {open ? <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-labelledby="mypage-tutorial-title">
      {spotlightRect ? <>
        <div className="fixed inset-x-0 top-0 bg-black/85" style={{ height: spotlightRect.top }} />
        <div className="fixed left-0 bg-black/85" style={{ top: spotlightRect.top, width: spotlightRect.left, height: spotlightRect.height }} />
        <div className="fixed right-0 bg-black/85" style={{ top: spotlightRect.top, left: spotlightRect.right, height: spotlightRect.height }} />
        <div className="fixed inset-x-0 bottom-0 bg-black/85" style={{ top: spotlightRect.bottom }} />
        <div className="pointer-events-none fixed rounded-2xl border-2 border-orange-400 shadow-[0_0_0_4px_rgba(249,115,22,.18),0_0_32px_rgba(249,115,22,.55)]" style={{ top: spotlightRect.top, left: spotlightRect.left, width: spotlightRect.width, height: spotlightRect.height }} />
      </> : <div className="fixed inset-0 bg-black/88 backdrop-blur-sm" />}
      <div className={`fixed left-1/2 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 ${spotlightRect ? (cardBelow ? "top-auto" : "bottom-4") : "top-1/2 -translate-y-1/2"}`} style={spotlightRect && cardBelow ? { top: spotlightRect.bottom + 16 } : undefined}>
        <div className="relative overflow-hidden rounded-3xl border border-orange-500/45 bg-[#101010] text-white shadow-[0_24px_90px_rgba(0,0,0,.75)]">
          <div className="h-1 bg-white/10"><div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
          <button type="button" aria-label="あとで見る" disabled={saving} onClick={dismiss} className="absolute right-4 top-5 rounded-full bg-white/10 p-2 text-white/55 transition hover:text-white disabled:opacity-40"><X size={18} /></button>
          <div className="px-5 pb-5 pt-7 sm:px-7 sm:pb-7">
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500/15 text-orange-400"><Icon size={24} /></span><div className="min-w-0 pr-8"><p className="text-[10px] font-black tracking-[.18em] text-orange-400">{current.eyebrow}</p><h2 id="mypage-tutorial-title" className="mt-1 text-xl font-black leading-tight sm:text-2xl">{current.title}</h2></div></div>
            <p className="mt-4 text-sm leading-6 text-white/65">{current.body}</p>
            <div className="mt-4 flex items-center justify-center gap-1.5" aria-label={`${step + 1}/${steps.length}`}>{steps.map((item, index) => <span key={item.eyebrow} className={`h-1.5 rounded-full transition-all ${index === step ? "w-6 bg-orange-500" : "w-1.5 bg-white/20"}`} />)}</div>
            <div className="mt-5 flex items-center gap-3">
              {step > 0 ? <button type="button" aria-label="前へ" onClick={() => setStep((value) => value - 1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 text-white/65 hover:text-white"><ArrowLeft size={18} /></button> : null}
              {!last ? <button type="button" onClick={() => setStep((value) => value + 1)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 font-black text-black transition hover:bg-orange-400">次へ <span className="text-xs opacity-60">{step + 1}/{steps.length}</span><ArrowRight size={18} /></button> : <button type="button" disabled={saving} onClick={() => void finish()} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 font-black text-black transition hover:bg-orange-400 disabled:opacity-50"><Check size={18} />マイページを始める</button>}
            </div>
            {last ? <button type="button" disabled={saving} onClick={() => void goToAi()} className="mt-2 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-orange-300 transition hover:text-orange-200"><Bot size={16} />VAULTEX AIに相談してみる</button> : <button type="button" disabled={saving} onClick={dismiss} className="mt-2 w-full py-2 text-xs font-bold text-white/35 transition hover:text-white/65">あとで見る</button>}
          </div>
        </div>
      </div>
    </div> : null}
  </>;
}
