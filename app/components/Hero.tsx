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
          ATHLETICS CLUB
        </p>

        <div className="motion-safe:animate-[hero-enter_.7s_ease-out_both]">
          <h1 className="max-w-5xl text-[clamp(3.8rem,10vw,9rem)] font-black leading-[0.82] tracking-[-0.07em]">RUN.<br/><span className="text-orange-500">JUMP.</span><br/>THROW.</h1>
          <p className="mt-6 text-sm font-bold uppercase tracking-[0.28em] text-orange-400 sm:text-base">FROM SHONAI, TO THE NEXT STAGE.</p>
        </div>

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
  <CtaLink href="https://forms.gle/gE26L75sc31dJdJk7">
    無料体験に申し込む
  </CtaLink>

  <CtaLink href="/program" variant="outline">
    PROGRAMを見る
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
