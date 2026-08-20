import Image from "next/image";
import { CtaLink } from "./ui/CtaLink";

export default function Hero() {
  return (
    <section className="relative flex min-h-[44rem] items-end overflow-hidden sm:min-h-[52rem]">
      <div className="absolute inset-0 motion-safe:animate-[hero-zoom_14s_ease-out_both]">
        <Image src="/hero.jpg" alt="SHONAI VAULTEX" fill priority quality={78} sizes="100vw" className="object-cover object-center brightness-60"/>
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-[#090a0c]/95 via-[#090a0c]/55 to-[#090a0c]/10" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#090a0c] to-transparent" />

      <p className="absolute right-[8%] top-1/4 hidden -rotate-90 text-[11px] font-bold tracking-[0.35em] text-white/60 md:block">
        ATHLETICS CLUB / SHONAI
      </p>
      <div className="relative mx-auto w-full max-w-7xl -translate-y-10 px-5 pb-20 pt-36 sm:px-8 sm:pb-24 lg:-translate-y-12 lg:px-10">
        <p className="mb-5 flex items-center gap-3 text-xs font-black tracking-[0.2em] text-orange-400">
          <span className="h-px w-9 bg-orange-500" />
          SHONAI VAULTEX / ATHLETICS CLUB
        </p>

        <div className="motion-safe:animate-[hero-enter_.7s_ease-out_both]">
          <p className="text-lg font-black tracking-[-0.03em] text-white sm:text-2xl">庄内から、新たな旋風を。</p>
          <h1 className="mt-5 max-w-5xl text-[clamp(2.8rem,8vw,7rem)] font-black leading-[0.94] tracking-[-0.075em]">
            あなたの<span className="text-orange-500">「なりたい」</span>を、<br className="hidden sm:block" />叶えるために。
          </h1>
        </div>

        <p className="mt-8 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
          目標は、人それぞれ。だから、成長する方法も一つじゃない。
          <br className="hidden sm:block" />
          一人ひとりの目標に合わせて、指導・振り返り・データ・仲間を選びながら成長できる陸上クラブです。
        </p>
        <p className="mt-12 text-xs font-black tracking-[0.35em] text-white/40">
  EST. 2026 ・ SHONAI ・ YAMAGATA ・ JAPAN
</p>

        <div className="mt-10 flex flex-wrap gap-4">
  <CtaLink href="https://forms.gle/gE26L75sc31dJdJk7">
    VAULTEXを体験する
  </CtaLink>

  <CtaLink href="#weapons" variant="outline">
    VAULTEXを知る
  </CtaLink>
</div>
      </div>
      <div className="absolute bottom-10 right-8 hidden items-center gap-3 text-[10px] font-bold tracking-[0.35em] text-white/55 lg:flex">
  <span>SCROLL</span>
  <div className="h-10 w-px bg-white/40" />
</div>
<div className="absolute bottom-10 left-8 hidden lg:block">
  <p className="text-sm font-bold text-white/60">
    01 / 01
  </p>
</div>
    </section>
  );
}
