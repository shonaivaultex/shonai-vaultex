"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CtaLink } from "../components/ui/CtaLink";
import { SectionLabel } from "../components/ui/SectionLabel";

const values = [
  {
    number: "01",
    title: "CHALLENGE",
    japanese: "挑戦を楽しむ",
    description:
      "失敗を恐れず、一歩目を踏み出す。その積み重ねが、まだ見ぬ自分の可能性をひらく。",
  },
  {
    number: "02",
    title: "COMMUNITY",
    japanese: "仲間と支え合う",
    description:
      "競技の枠を越えて、互いを認め、高め合う。ひとりでは届かない場所へ、仲間と進む。",
  },
  {
    number: "03",
    title: "GROWTH",
    japanese: "人として成長する",
    description:
      "勝敗だけでは測れない強さを育てる。日々の努力を通して、人生を自分で切り拓く力を身につける。",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const revealTransition = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function AboutPage() {
  const reduceMotion = useReducedMotion();
  const reveal = {
    initial: reduceMotion ? false : "hidden",
    whileInView: reduceMotion ? undefined : "visible",
    viewport: { once: true, amount: 0.22 },
    variants: fadeUp,
    transition: revealTransition,
  };

  return (
    <main className="overflow-hidden bg-[#090a0c] text-white">
      <section className="relative flex min-h-screen items-end overflow-hidden">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: "url('/hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/30 to-[#090a0c]" />
        <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-[#090a0c]/90 via-[#090a0c]/35 to-transparent md:w-3/4" />
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-orange-500 via-orange-500 to-transparent" />

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 32 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-7xl px-6 pb-20 pt-40 sm:px-10 md:pb-28 lg:px-12"
        >
          <SectionLabel>ABOUT THE CLUB</SectionLabel>
          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl md:text-8xl lg:text-9xl">
            SHONAI
            <br />
            <span className="text-orange-500">VAULTEX</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg font-bold leading-relaxed text-white/85 sm:text-xl">
            庄内から、全国へ。
            <br />
            挑戦する人を増やす総合陸上クラブ。
          </p>
        </motion.div>

        <div className="absolute bottom-8 right-6 hidden items-center gap-3 text-[10px] font-bold tracking-[0.24em] text-white/60 md:flex lg:right-12">
          SCROLL TO EXPLORE <span className="h-10 w-px bg-white/40" />
        </div>
      </section>

      <section className="border-b border-white/10 py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-20">
            <div className="lg:col-span-4">
              <SectionLabel>OUR STORY</SectionLabel>
            </div>
            <div className="lg:col-span-8">
              <h2 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.045em] sm:text-5xl md:text-6xl">
                すべての一歩が、
                <br />
                <span className="text-orange-500">未来を変える。</span>
              </h2>
              <div className="mt-10 grid max-w-3xl gap-7 text-base leading-8 text-white/65 sm:grid-cols-2">
                <p>
                  SHONAI VAULTEXは、山形県庄内地域を拠点とする総合陸上クラブです。年齢や経験に関わらず、一人ひとりが自分らしく挑戦できる環境をつくります。
                </p>
                <p>
                  私たちが目指すのは、記録や勝敗の先にある成長です。仲間と出会い、自分を信じ、地域から未来へ踏み出す力を育てます。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="bg-[#0d0f12] py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-12">
          <div className="lg:col-span-4">
            <SectionLabel>MISSION</SectionLabel>
          </div>
          <div className="lg:col-span-8">
            <p className="text-4xl font-black leading-[1.1] tracking-[-0.045em] sm:text-5xl md:text-6xl">
              挑戦する人を、
              <br />
              <span className="text-orange-500">増やす。</span>
            </p>
            <p className="mt-9 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              SHONAI VAULTEXは競技力だけを育てるクラブではありません。挑戦する勇気を育て、人として成長し、地域から未来へ羽ばたくアスリートを育成します。
            </p>
          </div>
        </motion.div>
      </section>

      <section className="relative border-y border-white/10 py-24 sm:py-32">
        <div className="pointer-events-none absolute -right-12 top-1/2 -translate-y-1/2 select-none text-[12rem] font-black leading-none tracking-[-0.1em] text-white/[0.025] sm:text-[18rem]">
          V
        </div>
        <motion.div {...reveal} className="relative mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-12">
          <div className="lg:col-span-4">
            <SectionLabel>VISION</SectionLabel>
          </div>
          <div className="lg:col-span-8">
            <p className="text-4xl font-black leading-[1.1] tracking-[-0.045em] sm:text-5xl md:text-6xl">
              庄内から、
              <br />
              <span className="text-orange-500">全国へ。</span>
            </p>
            <p className="mt-9 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              地域から日本で活躍するアスリートを育成し、スポーツが人とまちを前に進める力になることを信じています。庄内に、新しい挑戦の文化を根づかせます。
            </p>
          </div>
        </motion.div>
      </section>

      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <motion.div {...reveal} className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <SectionLabel>OUR VALUES</SectionLabel>
              <h2 className="mt-6 text-4xl font-black tracking-[-0.045em] sm:text-5xl">大切にする、3つのこと。</h2>
            </div>
            <p className="max-w-sm text-sm leading-7 text-white/55">日々の練習から試合の日まで、すべての行動の基準になる私たちの約束です。</p>
          </motion.div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {values.map((value, index) => (
              <motion.article
                key={value.number}
                initial={reduceMotion ? false : "hidden"}
                whileInView={reduceMotion ? undefined : "visible"}
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] as const }}
                className="group relative min-h-80 overflow-hidden border border-white/10 bg-[#0d0f12] p-7 transition-colors duration-300 hover:border-orange-500 sm:p-8"
              >
                <div className="absolute right-5 top-2 text-8xl font-black tracking-[-0.08em] text-white/[0.035] transition-colors group-hover:text-orange-500/10">
                  {value.number}
                </div>
                <p className="relative text-xs font-black tracking-[0.25em] text-orange-500">{value.number}</p>
                <h3 className="relative mt-16 text-2xl font-black tracking-[-0.035em]">{value.title}</h3>
                <p className="relative mt-2 text-lg font-bold">{value.japanese}</p>
                <p className="relative mt-6 max-w-xs text-sm leading-7 text-white/60">{value.description}</p>
                <span className="absolute bottom-0 left-0 h-1 w-0 bg-orange-500 transition-all duration-500 group-hover:w-full" />
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0d0f12] py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto grid max-w-7xl gap-14 px-6 sm:px-10 lg:grid-cols-12 lg:gap-20 lg:px-12">
          <div className="lg:col-span-4">
            <SectionLabel>MESSAGE</SectionLabel>
            <p className="mt-6 text-sm font-bold tracking-[0.14em] text-white/45">代表メッセージ</p>
          </div>
          <div className="lg:col-span-8">
            <blockquote className="text-3xl font-black leading-[1.25] tracking-[-0.04em] sm:text-4xl md:text-5xl">
              「できるかどうか」ではなく、
              <br className="hidden sm:block" />
              <span className="text-orange-500">「やってみたい」</span>から始めよう。
            </blockquote>
            <div className="mt-10 max-w-2xl space-y-5 text-base leading-8 text-white/65">
              <p>スポーツには、人の心を動かし、人生を変える力があります。だからこそ私たちは、誰もが挑戦を楽しみ、自分自身の可能性に出会える場所でありたいと考えています。</p>
              <p>庄内で育つ一人ひとりの挑戦が、やがて地域の未来を明るくする。その瞬間を、みなさんと一緒につくっていきます。</p>
            </div>
            <p className="mt-10 text-sm font-bold tracking-[0.12em] text-white/80">SHONAI VAULTEX　代表</p>
          </div>
        </motion.div>
      </section>

      <section className="relative overflow-hidden bg-orange-500 py-24 text-[#090a0c] sm:py-32">
        <div className="pointer-events-none absolute -right-4 -top-16 select-none text-[10rem] font-black leading-none tracking-[-0.1em] text-black/10 sm:text-[16rem]">JOIN</div>
        <motion.div {...reveal} className="relative mx-auto flex max-w-7xl flex-col justify-between gap-10 px-6 sm:px-10 md:flex-row md:items-end lg:px-12">
          <div>
            <p className="text-xs font-black tracking-[0.28em]">JOIN SHONAI VAULTEX</p>
            <h2 className="mt-5 text-4xl font-black leading-[1.05] tracking-[-0.05em] sm:text-5xl md:text-6xl">
              次の一歩を、
              <br />
              ここから。
            </h2>
          </div>
          <CtaLink href="/#contact" variant="outline">
            体験会・お問い合わせ
          </CtaLink>
        </motion.div>
      </section>
    </main>
  );
}
