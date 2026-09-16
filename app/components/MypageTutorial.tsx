"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, ArrowRight, Bell, Bot, CalendarDays, Check, Compass, Plus, Share, Smartphone, Sparkles, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export const MYPAGE_TUTORIAL_VERSION = 6;

type TutorialRect = { top: number; left: number; right: number; bottom: number; width: number; height: number };

const guideSteps = [
  { eyebrow: "はじめに", title: "まずは「予定・記録・振り返り」", body: "全部の機能を覚える必要はありません。参加する日を決め、練習や大会の記録を残し、あとから振り返る。この3つから始めましょう。", icon: Sparkles, target: null },
  { eyebrow: "予定を作る", title: "1週間分をまとめて入力", body: "「マイカレンダー」→「1週間を作成」を開きます。各日の種類を選び、最後に「入力した予定をまとめて保存」を押します。学校練習などは予定名なしでも登録でき、未選択・予定名なしの日は登録されません。", icon: CalendarDays, target: "schedule-action" },
  { eyebrow: "クラブに参加する", title: "全体予定から選ぶだけでもOK", body: "「1週間を作成」で全体スケジュールを選んで保存すると、出欠も「参加」になります。全体スケジュールの画面から出欠を回答することもできます。選んだだけでは保存されないので、最後の保存を忘れずに。", icon: CalendarDays, target: "all-schedules" },
  { eyebrow: "記録する", title: "練習・本番・CTを選んで記録", body: "練習なら練習記録、大会なら本番記録、身体能力の測定ならCONTROL TESTを選びます。日付・種目・数値を確認して保存しましょう。マイカレンダーでは日付を選んで、その日の記録や日誌を残せます。", icon: Plus, target: "performance" },
  { eyebrow: "振り返る", title: "成長レポートで過去の記録を見る", body: "「成長レポート」で種目ごとの変化を確認できます。「これまでの記録を見る」を押すと、その種目の日付と記録だけを新しい順に表示します。本番・練習・CTは別々なので、比較する区分も確認しましょう。", icon: Activity, target: "performance" },
  { eyebrow: "困ったとき", title: "相談や設定は必要なときに", body: "動きを見てほしいときはコーチへ動画で相談できます。使い方に迷ったらVAULTEX AIへ。「その他」には通知設定やマニュアルがあります。この案内は「マイページの使い方」から何度でも開けます。", icon: Compass, target: "settings" },
  { eyebrow: "最後に・任意", title: "ホーム画面に追加すると便利", body: "スマホのホーム画面に追加すると、次回からアイコンで開けます。今は追加せず、この案内を閉じて使い始めても大丈夫です。", icon: Smartphone, target: null, install: true },
] as const;

const desktopSteps = guideSteps;
const mobileTargets = [null, "mobile-calendar", "mobile-calendar", "mobile-record", "mobile-menu", "mobile-menu", null] as const;
const mobileSteps = guideSteps.map((item, index) => ({ ...item, target: mobileTargets[index] }));

type Props = { autoOpen: boolean; userId: string };

export default function MypageTutorial({ autoOpen, userId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [targetRect, setTargetRect] = useState<TutorialRect | null>(null);
  const [mobile, setMobile] = useState(false);
  const [installState, setInstallState] = useState<"ios" | "android" | "desktop" | "installed">("desktop");
  const [viewportHeight, setViewportHeight] = useState(800);
  const steps = mobile ? mobileSteps : desktopSteps;
  const current = steps[Math.min(step, steps.length - 1)];
  const Icon = current.icon;
  const last = step === steps.length - 1;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setMobile(media.matches);
      setViewportHeight(window.innerHeight);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
      if (standalone) {
        setInstallState("installed");
        return;
      }
      const userAgent = navigator.userAgent.toLowerCase();
      setInstallState(/iphone|ipad|ipod/.test(userAgent) ? "ios" : /android/.test(userAgent) ? "android" : "desktop");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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

  const spotlightRect = current.target ? targetRect : null;
  const cardBelow = spotlightRect ? spotlightRect.bottom + 300 < viewportHeight : false;
  const cardAbove = spotlightRect ? spotlightRect.top > viewportHeight * 0.62 : false;

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
      <div className={`fixed left-1/2 w-[calc(100%-1rem)] max-w-lg -translate-x-1/2 sm:w-[calc(100%-2rem)] ${spotlightRect ? (cardAbove ? "top-2 sm:top-4" : cardBelow ? "top-auto" : "bottom-2 sm:bottom-4") : "top-1/2 -translate-y-1/2"}`} style={spotlightRect && cardBelow && !cardAbove ? { top: Math.max(8, Math.min(spotlightRect.bottom + 16, viewportHeight - 360)) } : undefined}>
        <div className="relative flex max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-3xl border border-orange-500/45 bg-[#101010] text-white shadow-[0_24px_90px_rgba(0,0,0,.75)] sm:max-h-[calc(100dvh-2rem)]">
          <div className="h-1 bg-white/10"><div className="h-full bg-orange-500 transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
          <button type="button" aria-label="あとで見る" disabled={saving} onClick={dismiss} className="absolute right-4 top-5 rounded-full bg-white/10 p-2 text-white/55 transition hover:text-white disabled:opacity-40"><X size={18} /></button>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pt-7 sm:px-7">
            <div className="flex items-start gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-orange-500/15 text-orange-400"><Icon size={24} /></span><div className="min-w-0 pr-8"><p className="text-[10px] font-black tracking-[.18em] text-orange-400">{current.eyebrow}</p><h2 id="mypage-tutorial-title" className="mt-1 text-xl font-black leading-tight sm:text-2xl">{current.title}</h2></div></div>
            <p className="mt-4 text-base leading-7 text-white/85">{current.body}</p>
            {"install" in current && current.install ? <div className="mt-4 rounded-2xl border border-orange-500/25 bg-orange-500/[0.07] p-4">
              {installState === "installed" ? <div className="flex items-center gap-3 text-sm font-bold text-emerald-300"><Check size={19} />ホーム画面への追加は完了しています</div> : <>
                <p className="flex items-center gap-2 text-sm font-black text-white"><Share size={17} className="text-orange-400" />{installState === "ios" ? "iPhone / iPadでの追加方法" : installState === "android" ? "Androidでの追加方法" : "スマホでこのページを開いて追加"}</p>
                <ol className="mt-3 space-y-2 text-xs leading-5 text-white/65">
                  {installState === "ios" ? <><li><b className="text-white">1.</b> Safariの共有ボタンを押す</li><li><b className="text-white">2.</b> 「ホーム画面に追加」を選ぶ</li><li><b className="text-white">3.</b> 右上の「追加」を押す</li></> : installState === "android" ? <><li><b className="text-white">1.</b> Chrome右上のメニューを押す</li><li><b className="text-white">2.</b> 「アプリをインストール」または「ホーム画面に追加」を選ぶ</li><li><b className="text-white">3.</b> 確認画面で追加する</li></> : <li>この案内はスマホで開くと、iPhone／Androidに合わせた手順に切り替わります。</li>}
                </ol>
              </>}
              <p className="mt-3 flex items-start gap-2 border-t border-white/10 pt-3 text-[11px] leading-5 text-white/45"><Bell size={15} className="mt-0.5 shrink-0 text-orange-400" />追加後、マイページの「通知設定」から通知をONにしてください。ホーム画面へ追加するだけでは通知はまだ有効になりません。</p>
            </div> : null}
            <div className="mb-4 mt-4 flex items-center justify-center gap-1.5" aria-label={`${step + 1}/${steps.length}`}>{steps.map((item, index) => <span key={item.eyebrow} className={`h-1.5 rounded-full transition-all ${index === step ? "w-6 bg-orange-500" : "w-1.5 bg-white/20"}`} />)}</div>
          </div>
          <div className="shrink-0 border-t border-white/10 bg-[#101010] px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:pb-5">
            <div className="flex items-center gap-3">
              {step > 0 ? <button type="button" aria-label="前へ" onClick={() => setStep((value) => value - 1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/15 text-white/65 hover:text-white"><ArrowLeft size={18} /></button> : null}
              {!last ? <button type="button" onClick={() => setStep((value) => value + 1)} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 font-black text-black transition hover:bg-orange-400">次へ <span className="text-xs opacity-60">{step + 1}/{steps.length}</span><ArrowRight size={18} /></button> : <button type="button" disabled={saving} onClick={() => void finish()} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 font-black text-black transition hover:bg-orange-400 disabled:opacity-50"><Check size={18} />使い方を閉じる</button>}
            </div>
            {last ? <button type="button" disabled={saving} onClick={() => void goToAi()} className="mt-2 flex w-full items-center justify-center gap-2 py-2 text-sm font-bold text-orange-300 transition hover:text-orange-200"><Bot size={16} />VAULTEX AIに相談してみる</button> : <button type="button" disabled={saving} onClick={dismiss} className="mt-2 w-full py-2 text-xs font-bold text-white/35 transition hover:text-white/65">あとで見る</button>}
          </div>
        </div>
      </div>
    </div> : null}
  </>;
}
