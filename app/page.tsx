"use client";

import { ClipboardCheck, Dumbbell, Mail, MapPin, MessageCircle, Phone, RefreshCw, Target, Trophy, Users } from "lucide-react";
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
  { icon: Trophy, title: "WINNING MINDSET", text: "挑戦を楽しみ、最後までやり抜く力を。競技を通じて、自分の可能性を広げます。" },
  { icon: Users, title: "TEAM & COMMUNITY", text: "仲間と高め合う日々が、自信になる。地域に根ざした、あたたかく強いチームです。" },
  { icon: Dumbbell, title: "ATHLETE DEVELOPMENT", text: "基礎から専門的なトレーニングまで。一人ひとりの成長に合わせた指導を行います。" },
] as const;

const supportFlow = [
  { icon: MessageCircle, number: "01", title: "COUNSELING", text: "目標や競技歴、生活環境、現在の悩みを一人ひとり丁寧に確認します。" },
  { icon: Target, number: "02", title: "PLANNING", text: "コーチが一方的に決めず、選手と一緒に自分に合った練習方針をつくります。" },
  { icon: ClipboardCheck, number: "03", title: "TRAINING", text: "全体練習を基本に、種目や課題、その日の状態に合わせて内容を調整します。" },
  { icon: RefreshCw, number: "04", title: "REVIEW", text: "記録・動画・感覚を振り返り、次の目標と練習方針へつなげます。" },
] as const;

const news = [
  
  {
    date: "2026.08.06",
    tag: "OPEN",
    title: "SHONAI VAULTEX 公式サイトを公開しました",
  },
  {
    date: "2026.08.10",
    tag: "EVENT",
    title: "無料体験会の参加者を募集しています",
  },
  {
    date: "2026.09.01",
    tag: "RECRUIT",
    title: "2026年度 新規クラブメンバー募集開始",
  },
] as const;

export default function HomePage() {
  const [loading, setLoading] = useState(true);

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

      <section id="about" className="border-t border-white/10 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-10">
          <div className="lg:col-span-4"><SectionLabel index="01">ABOUT US</SectionLabel></div>
          <div className="lg:col-span-8">
            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">すべての一歩が、<br /><span className="text-orange-500">未来を変える。</span></h2>
            <div className="mt-9 grid max-w-3xl gap-6 text-sm leading-8 text-white/65 sm:grid-cols-2">
              <p>SHONAI VAULTEXは、山形県庄内地域を拠点とする陸上クラブです。スポーツを通じ、子どもたちが自分らしく挑戦できる場所をつくります。</p>
              <p>一人ひとりと目標や課題を共有し、選手とコーチが一緒に練習方針を考えます。自分で考えて挑戦する経験が、競技と人生を進む力になると信じています。</p>
            </div>
            <div className="mt-12 grid max-w-3xl grid-cols-3 border-y border-white/10 py-6">
  <Stat value="2026" label="FOUNDED" />
  <Stat value="FOUNDING" label="MEMBERS" />
  <Stat value="4" label="PROGRAMS" />
</div>
          </div>
        </div>
      </section>

      <section id="feature" className="bg-[#101216] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="02">OUR FEATURE</SectionLabel>
          <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><h2 className="text-3xl font-black tracking-[-0.045em] sm:text-5xl">強くなる、その先へ。</h2><p className="max-w-sm text-sm leading-7 text-white/60">競技力と人間力。どちらも大切に育てる、VAULTEXの3つの約束。</p></div>
          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">{features.map(({ icon: Icon, title, text }, index) => <article key={title} className="group bg-[#101216] p-7 sm:p-9"><div className="flex items-start justify-between"><Icon aria-hidden="true" size={30} strokeWidth={1.5} className="text-orange-500" /><span className="text-xs font-bold text-white/35">0{index + 1}</span></div><h3 className="mt-16 text-lg font-black tracking-wide">{title}</h3><p className="mt-4 text-sm leading-7 text-white/60">{text}</p><div className="mt-8 h-px w-10 bg-orange-500 transition-all duration-300 group-hover:w-full" /></article>)}</div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d0f12] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="03">PERSONAL SUPPORT</SectionLabel>
          <div className="mt-7 grid gap-8 lg:grid-cols-12 lg:gap-12">
            <h2 className="text-3xl font-black leading-tight tracking-[-0.045em] sm:text-5xl lg:col-span-6">
              答えを渡すのではなく、<br /><span className="text-orange-500">一緒につくる。</span>
            </h2>
            <p className="max-w-xl text-sm leading-8 text-white/60 lg:col-span-5 lg:col-start-8">
              全員に同じメニューを与えるのではなく、目標・種目・競技歴・生活環境を確認しながら、一人ひとりに合った練習方針を選手とコーチで設計します。
            </p>
          </div>
          <div className="mt-14 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {supportFlow.map(({ icon: Icon, number, title, text }) => (
              <article key={title} className="bg-[#0d0f12] p-7 sm:p-8">
                <div className="flex items-center justify-between">
                  <Icon aria-hidden="true" size={28} strokeWidth={1.5} className="text-orange-500" />
                  <span className="text-xs font-bold text-white/30">{number}</span>
                </div>
                <h3 className="mt-10 text-sm font-black tracking-[0.12em]">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/60">{text}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-xs leading-6 text-white/40">※年齢や経験に応じて、コーチが支える割合と選手自身が考える割合を調整します。</p>
        </div>
      </section>

      <section id="program" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="04">PROGRAM</SectionLabel>
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

      <section id="news" className="bg-[#101216] py-24 sm:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionLabel index="04">NEWS</SectionLabel><div className="mt-10 border-t border-white/15">{news.map((item) => <article key={item.date} className="grid gap-3 border-b border-white/15 py-5 sm:grid-cols-12 sm:items-center sm:px-3"><time className="text-xs font-medium text-white/45 sm:col-span-2">{item.date}</time><span className="text-[10px] font-black tracking-[0.14em] text-orange-500 sm:col-span-2">{item.tag}</span><h3 className="text-sm font-bold sm:col-span-8">{item.title}</h3></article>)}</div></div></section>

      <section id="contact" className="relative overflow-hidden bg-orange-500 py-24 text-[#090a0c] sm:py-32"><div className="pointer-events-none absolute -right-8 -top-28 select-none text-[13rem] font-black leading-none tracking-[-0.1em] text-black/10 sm:text-[22rem]">GO</div><div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><p className="flex items-center gap-3 text-xs font-black tracking-[0.22em]"><span className="text-black/50">05</span><span className="h-px w-8 bg-[#090a0c]" />CONTACT</p><div className="mt-8 grid gap-12 lg:grid-cols-12"><div className="lg:col-span-8"><h2 className="text-4xl font-black leading-[0.95] tracking-[-0.065em] sm:text-7xl">YOUR NEXT<br />MOVE STARTS<br />HERE.</h2><p className="mt-7 max-w-md text-sm font-medium leading-7 text-black/70">体験・見学はいつでも歓迎です。まずは気軽に、SHONAI VAULTEXの空気を感じに来てください。</p><CtaLink href="https://forms.gle/9KLAq5PSkBudhbyL9" className="mt-9">お問い合わせ</CtaLink></div><div className="space-y-6 self-end text-sm font-semibold lg:col-span-4"><ContactLine icon={MapPin}>山形県庄内地域（活動場所はお問い合わせください）</ContactLine><ContactLine icon={Mail}>shonaivaultex@gmail.com</ContactLine><ContactLine icon={Phone}>
準備中
</ContactLine></div></div></div></section>
        </main>
  </>
  
);
}
