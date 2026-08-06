"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ProgramCard } from "../components/ProgramCard";
import { programs } from "../components/program-data";
import { SectionLabel } from "../components/ui/SectionLabel";
import Image from "next/image";

export default function ProgramIndexPage() {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen overflow-hidden bg-[#090a0c] text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-5 pb-20 pt-36 sm:px-8 md:pb-28 lg:px-10">
        <Image
  src="/program-hero.jpg"
  alt="Program Hero"
  fill
  priority
  className="object-cover"
/>

<div className="absolute inset-0 bg-[#090a0c]/65" />

<div className="absolute inset-0 bg-gradient-to-r from-[#090a0c]/95 via-[#090a0c]/70 to-[#090a0c]/40" />

<div className="absolute bottom-0 left-0 h-48 w-full bg-gradient-to-t from-[#090a0c] to-transparent" />
        <div className="pointer-events-none absolute -right-8 top-20 select-none text-[10rem] font-black leading-none tracking-[-0.1em] text-white/[0.025] sm:text-[18rem]">V</div>
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 30 }} animate={reduceMotion ? undefined : { opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="relative mx-auto max-w-7xl">
          <SectionLabel>PROGRAM</SectionLabel>
          <h1 className="mt-7 text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl md:text-8xl lg:text-9xl">FIND YOUR<br /><span className="text-orange-500">NEXT STAGE.</span></h1>
          <p className="mt-8 max-w-xl text-lg font-bold leading-relaxed text-white/75 sm:text-xl">年齢や経験に合わせて、自分らしい挑戦を見つけよう。</p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <p className="mb-6 text-xs font-black tracking-[0.28em] text-white/45">{programs.length.toString().padStart(2, "0")} PROGRAMS</p>
        <div className="border-y border-white/10">
          {programs.map((program, index) => (
            <motion.div key={program.slug} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: index * 0.08 }}>
              <ProgramCard program={program} compact />
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
