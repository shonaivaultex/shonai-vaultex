"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CtaLink } from "./ui/CtaLink";;

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const slides = [
  {
    image: "/hero.jpg",
    title: (
      <>
        RUN.
        <br />
        <span className="text-orange-500">JUMP.</span>
        <br />
        THROW.
      </>
    ),
    subtitle: "FROM SHONAI, TO THE NEXT STAGE.",
  },

  {
    image: "/hero2.jpg",
    title: (
      <>
        START.
        <br />
        <span className="text-orange-500">DREAM.</span>
        <br />
        GROW.
      </>
    ),
    subtitle: "EVERY CHAMPION STARTS SOMEWHERE.",
  },

  {
  image: "/elite.jpg",
  title: (
    <>
      BEYOND.
      <br />
      <span className="text-orange-500">LIMITS.</span>
      <br />
      PERFORM.
    </>
  ),
  subtitle: "PUSH YOUR PERFORMANCE.",
},
  {
    image: "/masters.jpg",
    title: (
      <>
        NEVER.
        <br />
        <span className="text-orange-500">STOP.</span>
      </>
    ),
    subtitle: "CHALLENGE HAS NO AGE.",
  },
];

const [currentSlide, setCurrentSlide] = useState(0);

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, 6000);

  return () => clearInterval(timer);
}, []);

  return (
    <section className="relative flex min-h-[44rem] items-end overflow-hidden sm:min-h-[52rem]">
     <AnimatePresence mode="wait">
  <motion.div
  key={slides[currentSlide].image}
  initial={{ opacity: 0, scale: 1.08 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0 }}
  transition={{
  opacity: { duration: 0.8 },
  scale: { duration: 6, ease: "linear" },
}}
  className="absolute inset-0"
>
    <Image
  src={slides[currentSlide].image}
  alt="SHONAI VAULTEX"
  fill
  priority
  sizes="100vw"
  className="object-cover object-center brightness-75"
/>
  </motion.div>
</AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0c]/95 via-[#090a0c]/55 to-[#090a0c]/10" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#090a0c] to-transparent" />

      <p className="absolute right-[8%] top-1/4 hidden -rotate-90 text-[11px] font-bold tracking-[0.35em] text-white/60 md:block">
        ATHLETICS CLUB / SHONAI
      </p>
<div className="mb-8">
  
</div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 32 }}
        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-7xl -translate-y-10 px-5 pb-20 pt-36 sm:px-8 sm:pb-24 lg:-translate-y-12 lg:px-10"
      >
        <p className="mb-5 flex items-center gap-3 text-xs font-black tracking-[0.2em] text-orange-400">
          <span className="h-px w-9 bg-orange-500" />
          ATHLETICS CLUB
        </p>

       <AnimatePresence mode="wait">
  <motion.div
    key={currentSlide}
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -30 }}
    transition={{ duration: 0.6 }}
  >
    <h1 className="max-w-5xl text-[clamp(3.8rem,10vw,9rem)] font-black leading-[0.82] tracking-[-0.07em]">
      {slides[currentSlide].title}
    </h1>

    <p className="mt-6 text-sm font-bold tracking-[0.28em] text-orange-400 uppercase sm:text-base">
      {slides[currentSlide].subtitle}
    </p>
  </motion.div>
</AnimatePresence>

        <p className="mt-8 max-w-lg text-lg leading-8 text-white/80">
          楽しむことから始まり、
          <strong className="text-orange-500">本気で強くなる。</strong>
          <br />
          SHONAI VAULTEXは、庄内から全国へ挑戦する総合陸上クラブです。
        </p>
        <p className="mt-12 text-xs font-black tracking-[0.35em] text-white/40">
  EST. 2026 ・ SHONAI ・ YAMAGATA ・ JAPAN
</p>

        <div className="mt-10 flex flex-wrap gap-4">
  <CtaLink href="/#contact">
    無料体験に申し込む
  </CtaLink>

  <CtaLink href="/program" variant="outline">
    PROGRAMを見る
  </CtaLink>
</div>
      </motion.div>
      <div className="absolute bottom-10 right-8 hidden items-center gap-3 text-[10px] font-bold tracking-[0.35em] text-white/55 lg:flex">
  <span>SCROLL</span>
  <div className="h-10 w-px bg-white/40" />
</div>
<div className="absolute bottom-10 left-8 hidden lg:block">
  <p className="text-sm font-bold text-white/60">
    {String(currentSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
  </p>
</div>
    </section>
  );
}