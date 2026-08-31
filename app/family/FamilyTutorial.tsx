"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ChartNoAxesCombined, Check, Home, Settings, Share, Smartphone, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "vaultex-family-tutorial-v1";

const steps = [
  { eyebrow: "はじめに", title: "VAULTEX FAMILYへようこそ", body: "お子さまの成長や予定、クラブからのお知らせを家族で確認できる保護者専用ページです。", points: ["見るのはこの5つだけ", "成長・予定・お知らせをひとまとめ"], icon: Sparkles },
  { eyebrow: "APP", title: "ホーム画面に追加しよう", body: "スマホのホーム画面から、VAULTEX FAMILYをアプリのように直接開けます。", icon: Smartphone, install: true },
  { eyebrow: "ホーム", title: "まずは今の様子を確認", body: "最近の成長、次回予定、コーチからのメッセージをホームでまとめて確認できます。", points: ["迷ったら最初にホームへ", "複数のお子さまは上部で切り替え"], icon: Home },
  { eyebrow: "成長・予定", title: "変化を見て、出欠を回答", body: "「成長」では前回からの変化を確認できます。「予定」では練習や大会を確認し、代表保護者は出欠を回答できます。", points: ["成績の順位ではなく変化を見る", "出欠回答は代表保護者のみ"], icon: ChartNoAxesCombined },
  { eyebrow: "お知らせ・設定", title: "連絡と家族管理はここから", body: "会場変更や持ち物は「お知らせ」、家族の追加や詳しい利用方法は「設定」から確認できます。", points: ["大切な連絡はお知らせへ", "家族には必要な情報だけを安全に表示"], icon: Settings },
] as const;

type InstallState = "ios" | "android" | "desktop" | "installed";

export default function FamilyTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [installState, setInstallState] = useState<InstallState>("desktop");
  const current = steps[step];
  const Icon = current.icon;
  const last = step === steps.length - 1;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpen(window.localStorage.getItem(STORAGE_KEY) !== "seen");
      const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      if (standalone) setInstallState("installed");
      else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setInstallState("ios");
      else if (/android/i.test(navigator.userAgent)) setInstallState("android");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function close(remember = false) {
    if (remember) window.localStorage.setItem(STORAGE_KEY, "seen");
    setOpen(false);
    setStep(0);
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 transition hover:border-orange-400">
      <Sparkles size={15} />FAMILYの使い方
    </button>
    {open ? <div className="fixed inset-0 z-[120] grid place-items-center bg-black/75 px-3 py-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="family-tutorial-title">
      <section className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[1.75rem] border border-orange-400/35 bg-[#111215] text-white shadow-2xl">
        <div className="h-1 bg-white/10"><div className="h-full bg-orange-500 transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
        <button type="button" aria-label="あとで見る" onClick={() => close()} className="absolute right-4 top-5 rounded-full bg-white/10 p-2 text-white/55 hover:text-white"><X size={18} /></button>
        <div className="min-h-0 overflow-y-auto px-5 pb-5 pt-7 sm:px-8 sm:pt-8">
          <p className="mb-5 text-xs font-black tracking-[.08em] text-white/45">STEP {step + 1} / {steps.length}</p>
          <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500 text-black"><Icon size={24} /></span><div className="min-w-0 pr-8"><p className="text-[11px] font-black tracking-[.16em] text-orange-400">{current.eyebrow}</p><h2 id="family-tutorial-title" className="mt-1 text-xl font-black leading-tight sm:text-2xl">{current.title}</h2></div></div>
          <p className="mt-5 text-[15px] font-medium leading-7 text-white/85">{current.body}</p>
          {"points" in current && current.points ? <ul className="mt-5 space-y-3 rounded-2xl bg-white/[.06] p-4">{current.points.map((point) => <li key={point} className="flex gap-3 text-sm font-bold leading-6 text-white/80"><Check size={18} className="mt-0.5 shrink-0 text-orange-400" />{point}</li>)}</ul> : null}
          {"install" in current && current.install ? <div className="mt-5 rounded-2xl border border-orange-500/25 bg-orange-500/[.07] p-4">
            {installState === "installed" ? <p className="flex items-center gap-2 text-sm font-bold text-emerald-300"><Check size={18}/>ホーム画面への追加は完了しています</p> : <><p className="flex items-center gap-2 text-sm font-black"><Share size={17} className="text-orange-400"/>{installState === "ios" ? "iPhone / iPad" : installState === "android" ? "Android" : "スマホでの追加方法"}</p><ol className="mt-3 space-y-2 text-xs leading-5 text-white/65">{installState === "ios" ? <><li>1. Safariの共有ボタンを押す</li><li>2.「ホーム画面に追加」を選ぶ</li><li>3. 右上の「追加」を押す</li></> : installState === "android" ? <><li>1. Chromeのメニューを押す</li><li>2.「アプリをインストール」を選ぶ</li><li>3. 確認画面で追加する</li></> : <li>スマホでFAMILYを開くと、端末に合わせた手順を表示します。</li>}</ol></>}
          </div> : null}
          <div className="mt-6 flex justify-center gap-2" aria-label={`${step + 1}/${steps.length}`}>{steps.map((item, index) => <span key={item.eyebrow} className={`h-2 rounded-full transition-all ${index === step ? "w-8 bg-orange-500" : "w-2 bg-white/20"}`} />)}</div>
        </div>
        <div className="border-t border-white/10 bg-[#111215] px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-8"><div className="flex gap-3">{step > 0 ? <button type="button" aria-label="前へ" onClick={() => setStep((value) => value - 1)} className="grid h-12 w-12 place-items-center rounded-xl border border-white/20 text-white/80"><ArrowLeft size={19}/></button> : null}{last ? <button type="button" onClick={() => close(true)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 font-black text-black"><Check size={19}/>FAMILYを始める</button> : <button type="button" onClick={() => setStep((value) => value + 1)} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 font-black text-black">次へ<ArrowRight size={19}/></button>}</div><button type="button" onClick={() => close()} className="mt-2 w-full py-2 text-xs font-bold text-white/50">あとで見る</button></div>
      </section>
    </div> : null}
  </>;
}
