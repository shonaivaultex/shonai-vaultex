"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { Program } from "../../components/program-data";
import { CtaLink } from "../../components/ui/CtaLink";
import { SectionLabel } from "../../components/ui/SectionLabel";
const fadeUp = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0 } };
const revealTransition = { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const };
export function ProgramDetailPage({ program }: { program: Program }) {
  const reduceMotion = useReducedMotion();
  const reveal = { initial: reduceMotion ? false : "hidden", whileInView: reduceMotion ? undefined : "visible", viewport: { once: true, amount: 0.2 }, variants: fadeUp, transition: revealTransition };
  return <main className="overflow-hidden bg-[#090a0c] text-white">
    <section className="relative flex min-h-[85svh] items-end overflow-hidden border-b border-white/10">
      <div className="absolute inset-0 scale-105 bg-[url('/hero.jpg')] bg-cover bg-center opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#090a0c]/55 to-[#090a0c]" />
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#090a0c]/90 via-[#090a0c]/35 to-transparent md:w-3/4" />
      <div className="absolute bottom-0 h-1 w-full bg-gradient-to-r from-orange-500 via-orange-500 to-transparent" />
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 32 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-40 sm:px-10 md:pb-28 lg:px-12">
        <Link href="/program" className="inline-flex text-xs font-black tracking-[0.22em] text-white/60 transition-colors hover:text-orange-500">← ALL PROGRAMS</Link>
        <p className="mt-12 text-sm font-black tracking-[0.3em] text-orange-500">{program.number} / {program.englishTitle}</p>
        <h1 className="mt-4 text-6xl font-black leading-[0.88] tracking-[-0.065em] sm:text-8xl md:text-9xl">{program.name}</h1>
        <p className="mt-8 max-w-xl whitespace-pre-line text-lg font-bold leading-relaxed text-white/85 sm:text-xl">{program.lead}</p>
      </motion.div>
    </section>
    <section className="border-b border-white/10 py-24 sm:py-32"><motion.div {...reveal} className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-20 lg:px-10"><div className="lg:col-span-4"><SectionLabel>ABOUT THIS PROGRAM</SectionLabel></div><div className="lg:col-span-8"><p className="text-sm font-black tracking-[0.16em] text-orange-500">{program.audience}</p><h2 className="mt-5 whitespace-pre-line text-4xl font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl md:text-6xl">{program.heroTitle}</h2><p className="mt-9 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">{program.description}</p></div></motion.div></section>

<section className="bg-[#0d0f12] py-24 sm:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><motion.div {...reveal}><SectionLabel>WHAT WE BUILD</SectionLabel><h2 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">このクラスで育てること。</h2></motion.div><div className="mt-14 grid gap-4 md:grid-cols-3">{program.highlights.map((item, index) => <motion.article key={item.title} initial={reduceMotion ? false : "hidden"} whileInView={reduceMotion ? undefined : "visible"} viewport={{ once: true, amount: 0.18 }} variants={fadeUp} transition={{ ...revealTransition, delay: index * 0.1 }} className="group relative min-h-72 overflow-hidden border border-white/10 p-7 transition-colors hover:border-orange-500 sm:p-8"><p className="text-xs font-black tracking-[0.22em] text-orange-500">0{index + 1}</p><h3 className="mt-16 text-2xl font-black tracking-[-0.035em]">{item.title}</h3><p className="mt-6 text-sm leading-7 text-white/60">{item.description}</p><span className="absolute bottom-0 left-0 h-1 w-0 bg-orange-500 transition-all duration-500 group-hover:w-full" /></motion.article>)}</div></div></section>

<section className="border-y border-white/10 py-24 sm:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><motion.div {...reveal} className="grid gap-8 lg:grid-cols-12"><div className="lg:col-span-4"><SectionLabel>TRAINING FLOW</SectionLabel><h2 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">1日の流れ。</h2></div><p className="max-w-md self-end text-sm leading-7 text-white/55 lg:col-span-5">練習内容は時期・会場・個人のコンディションに応じて調整します。ひとつひとつの時間に、挑戦につながる意味を持たせます。</p></motion.div><div className="mt-14 divide-y divide-white/10 border-y border-white/10">{program.flow.map((item) => <div key={item.time} className="grid gap-3 py-7 sm:grid-cols-[5rem_1fr_1.5fr] sm:gap-6"><p className="text-sm font-black text-orange-500">{item.time}</p><h3 className="text-xl font-black tracking-[-0.03em]">{item.title}</h3><p className="text-sm leading-7 text-white/60">{item.description}</p></div>)}</div></div></section>

<section className="py-24 sm:py-32"><motion.div {...reveal} className="mx-auto grid max-w-7xl gap-14 px-5 sm:px-8 lg:grid-cols-12 lg:gap-20 lg:px-10"><div className="lg:col-span-4"><SectionLabel>FAQ</SectionLabel><h2 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">よくある質問。</h2></div><div className="divide-y divide-white/10 border-y border-white/10 lg:col-span-8">{program.faq.map((item, index) => <details key={item.question} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-bold"><span><span className="mr-3 text-sm text-orange-500">0{index + 1}</span>{item.question}</span><span className="text-2xl font-normal text-orange-500 transition-transform group-open:rotate-45">+</span></summary><p className="max-w-2xl pt-5 text-sm leading-7 text-white/60">{item.answer}</p></details>)}</div></motion.div></section>

<section className="relative overflow-hidden bg-orange-500 py-24 text-[#090a0c] sm:py-32"><div className="pointer-events-none absolute -right-4 -top-16 select-none text-[10rem] font-black leading-none tracking-[-0.1em] text-black/10 sm:text-[16rem]">JOIN</div><motion.div {...reveal} className="relative mx-auto flex max-w-7xl flex-col justify-between gap-10 px-5 sm:px-8 md:flex-row md:items-end lg:px-10"><div><p className="text-xs font-black tracking-[0.28em]">JOIN {program.name}</p><h2 className="mt-5 text-4xl font-black leading-[1.05] tracking-[-0.05em] sm:text-5xl md:text-6xl">次の一歩を、<br />ここから。</h2></div><CtaLink href="/#contact" variant="outline">体験会・お問い合わせ</CtaLink></motion.div></section>
  </main>;
}
