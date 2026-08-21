"use client";

import { Dumbbell, Mail, MapPin, Phone, Trophy, Users } from "lucide-react";
import Hero from "./components/Hero";
import LoadingScreen from "./components/LoadingScreen";
import { useEffect, useState } from "react";
import { ProgramCard } from "./components/ProgramCard";
import { programs } from "./components/program-data";
import { ContactLine } from "./components/ui/ContactLine";
import { CtaLink } from "./components/ui/CtaLink";
import { SectionLabel } from "./components/ui/SectionLabel";
import { Stat } from "./components/ui/Stat";
const features = [
  { icon: Trophy, title: "挑戦を継続できる環境", text: "練習だけでなく、試合後の振り返りまで支える仕組みで「自分で成長を言語化」できるようにします。" },
  { icon: Users, title: "仲間と共に伸びる文化", text: "上手くいかない日も、仲間とコーチが一緒に改善。比較ではなく、本人の前回より良くなることを重視します。" },
  { icon: Dumbbell, title: "競技力＋人間力", text: "基礎練習・技術練習・体力作りを、体力・メンタル・生活習慣まで一体で整える設計です。" },
] as const;

const copyByAudience = {
  parent: {
    aboutTitle: "ご家族の安心が、子どもの挑戦を支えます。",
    aboutText1: "練習の見守りや進捗を把握できる情報設計で、家庭からクラブ生活を応援しやすい環境を目指します。",
    aboutText2: "勝敗よりも「毎週の小さな成長」を大切にし、長く継続できる習慣づくりを支援します。",
    featureSub: "競技力と人間力を、同時に育てるVAULTEXの3つの約束。",
    ctaText: "無料体験を今すぐ予約する",
  },
  player: {
    aboutTitle: "自分の成長を、数字と感覚で実感する場所です。",
    aboutText1: "記録、フィードバック、日々の振り返りを1か所で見られるから、次の練習が明確になります。",
    aboutText2: "強くなるだけでなく、仲間やチームで支え合いながら『前より上手くなる』を続けます。",
    featureSub: "競技力とメンタルを、同時に育てるVAULTEXの3つの約束。",
    ctaText: "まずは練習を体験して、今日の自分と比較してみる",
  },
} as const;

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [audience, setAudience] = useState<"parent" | "player">("parent");
  const currentCopy = copyByAudience[audience];

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2200);

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
   <LoadingScreen loading={loading} />

    <main className="overflow-x-hidden bg-[#090a0c] text-white">
      <Hero />
      <section className="border-b border-white/10 bg-[#101216] py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-3 px-5 sm:px-8 lg:px-10">
          <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1">
            <button type="button" onClick={() => setAudience("parent")} className={`rounded-full px-4 py-2 text-xs font-black ${audience === "parent" ? "bg-orange-500 text-black" : "text-white/70"}`}>保護者向け</button>
            <button type="button" onClick={() => setAudience("player")} className={`rounded-full px-4 py-2 text-xs font-black ${audience === "player" ? "bg-orange-500 text-black" : "text-white/70"}`}>選手向け</button>
          </div>
          <CtaLink href="https://forms.gle/9KLAq5PSkBudhbyL9" className="mt-1">{currentCopy.ctaText}</CtaLink>
        </div>
      </section>

      <section id="about" className="border-t border-white/10 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-10">
          <div className="lg:col-span-4"><SectionLabel index="01">ABOUT US</SectionLabel></div>
          <div className="lg:col-span-8">
            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
              {currentCopy.aboutTitle}
            </h2>
            <div className="mt-9 grid max-w-3xl gap-6 text-sm leading-8 text-white/65 sm:grid-cols-2">
              <p>{currentCopy.aboutText1}</p>
              <p>{currentCopy.aboutText2}</p>
            </div>
            <div className="mt-12 grid max-w-3xl grid-cols-3 border-y border-white/10 py-6">
  <Stat value="2026" label="FOUNDED" />
  <Stat value="3つ" label="成長支援の柱" />
  <Stat value="4" label="PROGRAM" />
</div>
          </div>
        </div>
      </section>

      <section id="feature" className="bg-[#101216] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="02">OUR FEATURE</SectionLabel>
          <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><h2 className="text-3xl font-black tracking-[-0.045em] sm:text-5xl">強くなる、その先へ。</h2><p className="max-w-sm text-sm leading-7 text-white/60">{currentCopy.featureSub}</p></div>
          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">{features.map(({ icon: Icon, title, text }, index) => <article key={title} className="group bg-[#101216] p-7 sm:p-9"><div className="flex items-start justify-between"><Icon aria-hidden="true" size={30} strokeWidth={1.5} className="text-orange-500" /><span className="text-xs font-bold text-white/35">0{index + 1}</span></div><h3 className="mt-16 text-lg font-black tracking-wide">{title}</h3><p className="mt-4 text-sm leading-7 text-white/60">{text}</p><div className="mt-8 h-px w-10 bg-orange-500 transition-all duration-300 group-hover:w-full" /></article>)}</div>
          <div className="mt-8 flex flex-wrap gap-4">
            <CtaLink href="/program">プログラムを詳しく見る</CtaLink>
            <CtaLink href="/mypage-sample" variant="outline">マイページのサンプルを見る</CtaLink>
          </div>
          <div className="mt-12 rounded-2xl border border-white/10 bg-[#0c0d10] p-6 sm:p-10">
            <SectionLabel index="02-2">HOW TO START</SectionLabel>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-3xl">まずは3ステップ。迷わない入会導線</h3>
            <div className="mt-7 grid gap-4 text-sm leading-7 text-white/70 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-xs font-black tracking-[0.12em] text-orange-400">STEP 1</span>
                <p className="mt-3 font-bold text-white">無料体験を予約</p>
                <p className="mt-2">まずは体験会の日程だけ選んでください。</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-xs font-black tracking-[0.12em] text-orange-400">STEP 2</span>
                <p className="mt-3 font-bold text-white">実際に体験</p>
                <p className="mt-2">練習の進行、雰囲気、コーチングを現場で見られます。</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-xs font-black tracking-[0.12em] text-orange-400">STEP 3</span>
                <p className="mt-3 font-bold text-white">記録を残して継続</p>
                <p className="mt-2">マイページで成長の跡を確認しながらトレーニングを続けます。</p>
              </div>
            </div>
            <CtaLink href="https://forms.gle/9KLAq5PSkBudhbyL9" className="mt-8 inline-flex">無料体験を予約する</CtaLink>
          </div>
        </div>
      </section>

      <section id="program" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="03">PROGRAM</SectionLabel>
          <div className="mt-7 grid gap-10 lg:grid-cols-12"><h2 className="text-3xl font-black tracking-[-0.045em] sm:text-5xl lg:col-span-5">自分のペースで、<br />頂点を目指す。</h2><p className="max-w-md self-end text-sm leading-7 text-white/60 lg:col-span-5 lg:col-start-8">年齢と経験に合わせたプログラムで、運動の楽しさから本格的な競技力まで、一歩ずつサポートします。</p></div>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
  {programs.map((program) => (
    <ProgramCard
      key={program.slug}
      program={program}
      
    />
  ))}
</div>

<div className="mt-12 flex justify-center">
  <CtaLink href="/program" variant="outline">
    VIEW ALL PROGRAMS
  </CtaLink>
</div>
        </div>
      </section>

      <section id="contact" className="relative overflow-hidden bg-orange-500 py-24 text-[#090a0c] sm:py-32"><div className="pointer-events-none absolute -right-8 -top-28 select-none text-[13rem] font-black leading-none tracking-[-0.1em] text-black/10 sm:text-[22rem]">GO</div><div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><p className="flex items-center gap-3 text-xs font-black tracking-[0.22em]"><span className="text-black/50">04</span><span className="h-px w-8 bg-[#090a0c]" />CONTACT</p><div className="mt-8 grid gap-12 lg:grid-cols-12"><div className="lg:col-span-8"><h2 className="text-4xl font-black leading-[0.95] tracking-[-0.065em] sm:text-7xl">YOUR NEXT<br />MOVE STARTS<br />HERE.</h2><p className="mt-7 max-w-md text-sm font-medium leading-7 text-black/70">体験・見学はいつでも歓迎です。まずは気軽に、SHONAI VAULTEXの空気を感じに来てください。</p><CtaLink href="https://forms.gle/9KLAq5PSkBudhbyL9" className="mt-9">お問い合わせ</CtaLink></div><div className="space-y-6 self-end text-sm font-semibold lg:col-span-4"><ContactLine icon={MapPin}>山形県庄内地域（活動場所はお問い合わせください）</ContactLine><ContactLine icon={Mail}>shonaivaultex@gmail.com</ContactLine><ContactLine icon={Phone}>
準備中
</ContactLine></div></div></div></section>
        </main>
  </>
  
);
}
