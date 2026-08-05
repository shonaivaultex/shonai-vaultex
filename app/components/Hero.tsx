"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { CtaLink } from "./ui/CtaLink";

export default function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-[44rem] items-end overflow-hidden sm:min-h-[52rem]">
      <Image
        src="/hero.jpg"
        alt="陸上競技に取り組むアスリート"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0c]/95 via-[#090a0c]/55 to-[#090a0c]/10" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#090a0c] to-transparent" />

      <p className="absolute right-[8%] top-1/4 hidden -rotate-90 text-[11px] font-bold tracking-[0.35em] text-white/60 md:block">
        ATHLETICS CLUB / SHONAI
      </p>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 32 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-7xl px-5 pb-20 pt-36 sm:px-8 sm:pb-24 lg:px-10"
      >
        <p className="mb-5 flex items-center gap-3 text-xs font-black tracking-[0.2em] text-orange-400">
          <span className="h-px w-9 bg-orange-500" />
          ATHLETICS CLUB
        </p>

        <h1 className="max-w-5xl text-[clamp(3.8rem,10vw,9rem)] font-black leading-[0.82] tracking-[-0.07em]">
          RUN.
          <br />
          <span className="text-orange-500">JUMP.</span>
          <br />
          THROW.
        </h1>

        <p className="mt-8 max-w-lg text-lg leading-8 text-white/80">
          楽しむことから始まり、
          <strong className="text-orange-500">本気で強くなる。</strong>
          <br />
          SHONAI VAULTEXは、庄内から全国へ挑戦する総合陸上クラブです。
        </p>

        <CtaLink href="/#contact" variant="outline" className="mt-9">
          体験会に申し込む
        </CtaLink>
      </motion.div>
    </section>
  );
}