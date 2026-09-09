"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CtaLink } from "../components/ui/CtaLink";
import { SectionLabel } from "../components/ui/SectionLabel";

const approaches = [
  ["UNDERSTAND", "まず、あなたを知る", "カウンセリングから始め、性格や考え方、競技経験、生活のリズムまで確認します。決められた型へ当てはめず、その人に合う目標と進み方を一緒に考えます。"],
  ["CONNECT", "自然に輪へ入れる", "レクリエーションや共通の練習、準備・計測・動画撮影などを通して、初めてでも関わりやすい空気をつくります。一人で集中したい時間も大切にします。"],
  ["IMPROVE", "感覚と根拠で伸ばす", "コーチ陣の競技・指導経験に、測定データ、動作分析、研究による知見を組み合わせます。曖昧にせず、本人が納得して取り組める指導を行います。"],
  ["PREPARE", "安心して本番へ向かう", "否定的な言葉で動かすのではなく、試合までに必要な準備を一つずつ整えます。不安を小さくし、自分の力を発揮できる状態をつくります。"],
] as const;

const stages = [
  ["JUNIOR", "小学生", "楽しみながら、可能性に出会う。", "いろいろな種目を体験し、好きなことや得意な動きを見つけます。成長を長く記録に残し、自分の変化を知る力も育てます。"],
  ["YOUTH", "中学生・高校生", "環境を理由に、諦めなくていい。", "学校の環境が合わない時も、競技を続けられる選択肢をつくります。根拠のある説明と対話を通して、納得できる成長を支えます。"],
  ["ELITE / MASTERS", "大学生・一般", "生活に合う形で、続けていく。", "時間、場所、一緒に取り組む仲間が見つからないという悩みに向き合います。競技力向上から健康づくりまで、目的に合う関わり方を選べます。"],
] as const;

export default function AboutPage() {
  const reduceMotion = useReducedMotion();
  const reveal = {
    initial: reduceMotion ? false : "hidden",
    whileInView: reduceMotion ? undefined : "visible",
    viewport: { once: true, amount: 0.18 },
    variants: { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } },
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <main className="overflow-hidden bg-[#090a0c] text-white">
      <section className="relative flex min-h-[90svh] items-end overflow-hidden">
        <div className="absolute inset-0 scale-105 bg-cover bg-center" style={{ backgroundImage: "url('/hero.jpg')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-[#090a0c]" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#090a0c]/95 via-[#090a0c]/55 to-transparent md:w-4/5" />
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-orange-500 via-orange-500 to-transparent" />
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 32 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-40 sm:px-10 md:pb-28 lg:px-12">
          <SectionLabel>ABOUT SHONAI VAULTEX</SectionLabel>
          <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.94] tracking-[-0.06em] sm:text-7xl md:text-8xl">A PLACE TO<br /><span className="text-orange-500">KEEP GOING.</span></h1>
          <p className="mt-8 max-w-2xl text-xl font-black leading-relaxed sm:text-2xl">やりたい競技を、<br className="sm:hidden" />諦めなくていい場所へ。</p>
        </motion.div>
      </section>

      <section className="border-b border-white/10 py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-12">
          <div className="lg:col-span-4"><SectionLabel>WHY WE EXIST</SectionLabel></div>
          <div className="lg:col-span-8">
            <h2 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-[-0.05em] sm:text-5xl md:text-6xl">合わない環境で、<br /><span className="text-orange-500">好きな競技まで嫌いにしない。</span></h2>
            <div className="mt-10 max-w-3xl space-y-6 text-base leading-8 text-white/65 sm:text-lg">
              <p>学校やクラブへ入ってみたら、思っていた環境と違った。すでにできている輪へ入りづらい。指導に納得できない。でも、競技は続けたい。</p>
              <p>SHONAI VAULTEXは、そんな人が自分のペースで挑戦を続けられる総合陸上クラブです。誰もが自分らしくいられ、さまざまな体験を通して、やりたいことや自分の可能性に出会える環境をつくります。</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="bg-[#0d0f12] py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <SectionLabel>HOW WE COACH</SectionLabel>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <h2 className="text-4xl font-black leading-[1.08] tracking-[-0.05em] sm:text-5xl md:text-6xl lg:col-span-8">一人ひとりを知ることから、<br /><span className="text-orange-500">すべてが始まる。</span></h2>
            <p className="max-w-md text-sm leading-7 text-white/55 lg:col-span-4">全員に同じ答えを当てはめません。本人の感覚と対話を起点に、必要な方法を組み合わせます。</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2">
            {approaches.map(([label, title, text], index) => <article key={label} className="rounded-3xl border border-white/10 bg-black/20 p-7 sm:p-9"><div className="flex justify-between"><p className="text-xs font-black tracking-[.22em] text-orange-500">{label}</p><span className="text-xs font-black text-white/25">0{index + 1}</span></div><h3 className="mt-8 text-2xl font-black sm:text-3xl">{title}</h3><p className="mt-5 text-sm leading-7 text-white/60">{text}</p></article>)}
          </div>
        </motion.div>
      </section>

      <section className="border-y border-white/10 py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <SectionLabel>FOR EVERY STAGE</SectionLabel>
          <h2 className="mt-7 text-4xl font-black tracking-[-0.05em] sm:text-5xl md:text-6xl">年齢ではなく、<br /><span className="text-orange-500">今の目的から考える。</span></h2>
          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {stages.map(([label, title, headline, text]) => <article key={label} className="flex min-h-[22rem] flex-col border border-white/10 bg-[#0d0f12] p-7 sm:p-8"><p className="text-xs font-black tracking-[.22em] text-orange-500">{label}</p><h3 className="mt-4 text-xl font-black">{title}</h3><p className="mt-auto pt-12 text-2xl font-black leading-snug">{headline}</p><p className="mt-5 text-sm leading-7 text-white/55">{text}</p></article>)}
          </div>
          <CtaLink href="/program" variant="outline" className="mt-8">年代別の案内を見る</CtaLink>
        </motion.div>
      </section>

      <section className="bg-[#0d0f12] py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-12">
          <div className="lg:col-span-4"><SectionLabel>OUR PROMISE</SectionLabel></div>
          <div className="lg:col-span-8"><h2 className="text-4xl font-black leading-[1.08] tracking-[-0.05em] sm:text-5xl md:text-6xl">否定しない。<br />曖昧にしない。<br /><span className="text-orange-500">一人にしない。</span></h2><p className="mt-9 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">コーチが一方的に正解を押し付けるのではなく、本人の言葉を聞き、根拠を伝え、納得できる道を一緒に選びます。仲間と協力する時間と、自分自身に向き合う時間の両方を大切にします。</p></div>
        </motion.div>
      </section>

      <section className="border-t border-white/10 py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-12">
          <div className="lg:col-span-4"><SectionLabel>MESSAGE</SectionLabel><p className="mt-6 text-sm font-bold tracking-[.14em] text-white/45">代表コーチの思い</p></div>
          <div className="lg:col-span-8">
            <blockquote className="text-3xl font-black leading-[1.25] tracking-[-0.04em] sm:text-4xl md:text-5xl">「できるかどうか」ではなく、<br /><span className="text-orange-500">「やってみたい」</span>から始めよう。</blockquote>
            <div className="mt-10 max-w-2xl space-y-5 text-base leading-8 text-white/65"><p>私自身、小学生の頃から自分の記録や成長を残せていたら、もっと自分を知ることができたと思っています。そして、競技を続けたくても、身近な環境が合わないことで諦めてしまう人も見てきました。</p><p>だからVAULTEXを、誰もが自分に合う関わり方を見つけ、安心して挑戦を続けられる場所にしたい。競技を通して得た経験が、人生を少し豊かにする。そんな時間を、コーチ陣と仲間と一緒につくっていきます。</p></div>
            <p className="mt-10 text-sm font-bold tracking-[.12em] text-white/80">SHONAI VAULTEX　代表</p>
          </div>
        </motion.div>
      </section>

      <section className="relative overflow-hidden bg-orange-500 py-24 text-[#090a0c] sm:py-32">
        <div className="pointer-events-none absolute -right-4 -top-16 text-[10rem] font-black leading-none text-black/10 sm:text-[16rem]">START</div>
        <motion.div {...reveal} className="relative mx-auto grid max-w-7xl gap-10 px-6 sm:px-10 md:grid-cols-[1fr_auto] md:items-end lg:px-12">
          <div><p className="text-xs font-black tracking-[.28em]">YOUR FIRST STEP</p><h2 className="mt-5 text-4xl font-black sm:text-5xl md:text-6xl">まずは、話すことから。</h2><p className="mt-5 max-w-xl text-sm font-bold leading-7 text-black/65">入会を決めていなくても大丈夫です。やりたいことや今困っていることを、そのままお聞かせください。</p></div>
          <div className="flex flex-col gap-3 sm:flex-row"><CtaLink href="https://line.me/R/ti/p/@082fhyco" variant="outline">公式LINEで相談する</CtaLink><CtaLink href="/schedule" variant="outline">スケジュールを見る</CtaLink></div>
        </motion.div>
      </section>
    </main>
  );
}
