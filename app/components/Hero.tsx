"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { CtaLink } from "./ui/CtaLink";

// hero3/hero4 are intentionally excluded here because their source resolution is
// too small for a full-width desktop hero and makes the slideshow look blurred.
const heroImages = ["/hero.jpg", "/hero2.jpg"] as const;

export default function Hero() {
  const reduceMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setCurrentSlide((current) => (current + 1) % heroImages.length), 6000);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <section className="relative flex min-h-[46rem] items-end overflow-hidden sm:min-h-[54rem] lg:min-h-screen">
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={heroImages[currentSlide]}
          initial={reduceMotion ? false : { opacity: 0, scale: 1.035 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ opacity: { duration: 1 }, scale: { duration: 6, ease: "linear" } }}
          className="absolute inset-0"
        >
          <Image src={heroImages[currentSlide]} alt="SHONAI VAULTEXの活動風景" fill priority={currentSlide === 0} quality={90} sizes="100vw" className="object-cover object-[58%_center] brightness-[.58] sm:object-center"/>
          <motion.div initial={reduceMotion ? false : { x: "-45%", opacity: 0 }} animate={reduceMotion ? undefined : { x: "125%", opacity: [0, 0.14, 0] }} transition={{ duration: 6, ease: "linear" }} className="absolute inset-y-0 left-0 w-[40%] bg-orange-500 blur-[140px]"/>
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-[#07090c]/95 via-[#07090c]/62 to-[#07090c]/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#090a0c] via-[#090a0c]/45 to-transparent" />
      <div className="absolute inset-y-0 left-[5.5%] hidden w-px bg-white/15 lg:block" />
      <div className="absolute right-[5.5%] top-0 hidden h-[42%] w-px bg-orange-500/70 lg:block" />
      <p aria-hidden="true" className="pointer-events-none absolute -bottom-[.13em] right-[-.035em] hidden select-none text-[clamp(9rem,17vw,18rem)] font-black leading-none tracking-[-0.09em] text-white/[.045] xl:block">VAULTEX</p>

      <div className="relative mx-auto w-full max-w-[92rem] px-5 pb-16 pt-36 sm:px-8 sm:pb-20 lg:px-[8%] lg:pb-24">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-16">
          <div className="motion-safe:animate-[hero-enter_.7s_ease-out_both]">
            <p className="flex items-center gap-3 text-[10px] font-black tracking-[0.28em] text-orange-400 sm:text-xs">
              <span className="h-px w-10 bg-orange-500" />
              ATHLETICS CLUB / SHONAI, YAMAGATA
            </p>
            <h1 className="mt-7 max-w-6xl text-[clamp(3.25rem,8.2vw,8rem)] font-black leading-[0.84] tracking-[-0.085em]">
              <span className="block text-white">BECOME</span>
              <span className="block text-orange-500">WHO YOU WANT.</span>
            </h1>
            <p className="mt-7 text-xl font-black tracking-[-0.04em] text-white sm:text-3xl">あなたの「なりたい」を、叶える。</p>
          </div>

          <aside className="border-l border-white/20 pl-5 lg:mb-1 lg:pl-7">
            <p className="text-[10px] font-black tracking-[0.25em] text-orange-400">OUR APPROACH</p>
            <p className="mt-4 text-sm font-bold leading-7 text-white/85">目標は、人それぞれ。<br />成長する方法も、一つじゃない。</p>
            <p className="mt-4 text-xs leading-6 text-white/55">指導・振り返り・データ・仲間。今の自分に必要なものを選びながら進む陸上クラブです。</p>
          </aside>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3 sm:mt-12">
          <CtaLink href="/mypage" className="bg-orange-500 text-black hover:bg-white">マイページを開く</CtaLink>
          <CtaLink href="#weapons" variant="outline" className="border-white/35 text-white">VAULTEXを知る</CtaLink>
          <p className="ml-auto hidden text-[10px] font-black tracking-[0.3em] text-white/40 md:block">EST. 2026 / SHONAI / JAPAN</p>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-white/15 pt-5 lg:mt-14">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-white/70">{String(currentSlide + 1).padStart(2, "0")}</span>
            <div className="flex gap-1.5">{heroImages.map((image, index) => <span key={image} className={`h-px transition-all duration-500 ${index === currentSlide ? "w-12 bg-orange-500" : "w-5 bg-white/25"}`} />)}</div>
            <span className="text-[10px] font-bold text-white/35">{String(heroImages.length).padStart(2, "0")}</span>
          </div>
          <p className="text-[9px] font-black tracking-[0.32em] text-white/45">SCROLL TO DISCOVER</p>
        </div>
      </div>
    </section>
  );
}
