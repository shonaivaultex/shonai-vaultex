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

const sessions = [
  { label: "SMALL GROUP SESSION", title: "3〜5名程度の少人数予約制", text: "本人の目的・感覚・考えを確認しながら進める、VAULTEXの中心となる指導です。" },
  { label: "VAULTEX CLASS", title: "仲間と学ぶ全体教室", text: "複数人で一つのテーマを学び、試し、陸上を楽しみます。月2回程度を想定しています。" },
  { label: "PERSONAL SESSION", title: "必要に応じた1対1指導", text: "個別の技術確認や相談など、目標に応じて活用する構想です。" },
  { label: "CONTROL TEST / SCAN", title: "現在地と成長を確認", text: "定期的に身体能力を測定し、同じ条件で変化を振り返ります。" },
] as const;

const supportTools = [
  ["COACHING", "本人の考えや感覚を聞き、成長方法を一緒に考える"],
  ["PERFORMANCE LOG", "記録・意識・感覚・動画を残し、良かった自分を忘れない"],
  ["ATHLETE SCAN", "CONTROL TESTから現在の身体能力プロフィールを知る"],
  ["VAULTEX AI", "振り返りを整理し、次に見るものや行動を一緒に考える"],
  ["COACH FEEDBACK", "一人で整理できない時に、記録や動画と一緒に相談する"],
  ["MY CALENDAR", "次の目標と日々の予定をつなげ、自分の成長を管理する"],
] as const;

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

      <section id="philosophy" className="bg-[#0d0f12] py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <SectionLabel>COACHING PHILOSOPHY</SectionLabel>
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-black/20 p-7 sm:p-10">
              <p className="text-xs font-black tracking-[0.22em] text-orange-500">ATHLETE FIRST</p>
              <h2 className="mt-8 text-4xl font-black tracking-[-0.05em] sm:text-5xl">答えを、<br />押し付けない。</h2>
              <p className="mt-6 text-sm leading-8 text-white/60">VAULTEXが大切にするのは「あなたはどうしたい？」という問いです。本人の感覚・考え・目標を理解し、今できている良い部分を残しながら、成長方法を一緒に考えます。</p>
            </article>
            <article className="rounded-3xl border border-orange-500/30 bg-orange-500/[.05] p-7 sm:p-10">
              <p className="text-xs font-black tracking-[0.22em] text-orange-500">FEELING & DATA</p>
              <h2 className="mt-8 text-4xl font-black tracking-[-0.05em] sm:text-5xl">感覚 <span className="text-orange-500">×</span><br />データ。</h2>
              <p className="mt-6 text-sm leading-8 text-white/60">競技で最後に頼るのは自分自身の感覚です。そこへ記録・動画・測定データという客観的な情報を結びつけ、自分自身を理解し、自分で選択する力を育てます。</p>
            </article>
          </div>
        </motion.div>
      </section>

      <section id="training" className="border-y border-white/10 py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <SectionLabel>HOW TO TRAIN</SectionLabel>
              <h2 className="mt-7 text-4xl font-black tracking-[-0.055em] sm:text-6xl">クラスに合わせる前に、<br /><span className="text-orange-500">目標から選ぶ。</span></h2>
            </div>
            <p className="max-w-md text-sm leading-8 text-white/60 lg:col-span-4 lg:col-start-9">全員に同じ練習を当てはめるのではなく、目標や今の状態に合う関わり方を選びます。</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {sessions.map((item) => <article key={item.label} className="rounded-2xl border border-white/10 bg-[#101216] p-6 sm:p-7"><p className="text-[10px] font-black tracking-[.2em] text-orange-400">{item.label}</p><h3 className="mt-3 text-xl font-black">{item.title}</h3><p className="mt-4 text-sm leading-7 text-white/55">{item.text}</p></article>)}
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 p-6 sm:p-8">
            <p className="text-[10px] font-black tracking-[.2em] text-white/35">ATHLETE CATEGORY</p>
            <h3 className="mt-2 text-xl font-black">年代カテゴリーは、所属先ではなく安全な運用のため。</h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-white/55">JUNIOR / YOUTH / ELITE / MASTERSは、CONTROL TESTの測定条件・安全管理・ランキング等に使用します。上位クラスへ昇格する制度ではありません。</p>
            <CtaLink href="/program" variant="outline" className="mt-6">年代カテゴリーを見る</CtaLink>
          </div>
          <div className="mt-5 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-transparent p-6 sm:p-8"><p className="text-[10px] font-black tracking-[.2em] text-orange-400">FOR JUNIOR</p><h3 className="mt-2 text-2xl font-black">楽しいことを、最優先に。</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">楽しさの中で、仲間を尊重すること、ルールを守ること、片付けや道具を大切にすることも学びます。楽しさと節度の両立を大切にします。</p></div>
        </motion.div>
      </section>

      <section className="bg-[#0d0f12] py-24 sm:py-32">
        <motion.div {...reveal} className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
          <SectionLabel>SUPPORT TOOLS</SectionLabel>
          <div className="mt-7 grid gap-8 lg:grid-cols-12"><h2 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl lg:col-span-7">目標に必要な武器を、<br /><span className="text-orange-500">自分で選ぶ。</span></h2><p className="max-w-md text-sm leading-8 text-white/60 lg:col-span-4 lg:col-start-9">機能を使うことが目的ではありません。必要な時に必要なものだけを使える設計です。</p></div>
          <div className="mt-12 grid gap-3 md:grid-cols-2">{supportTools.map(([label, text], index) => <div key={label} className="flex gap-5 rounded-2xl border border-white/10 bg-black/20 p-5 sm:p-6"><span className="text-xs font-black text-orange-500">0{index + 1}</span><div><p className="text-xs font-black tracking-[.16em] text-orange-400">{label}</p><p className="mt-2 text-sm leading-7 text-white/60">{text}</p></div></div>)}</div>
          <p className="mt-8 border-l-2 border-orange-500 pl-5 text-lg font-black">全部使う必要はありません。今の自分に必要なものから始められます。</p>
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
          <CtaLink href="https://forms.gle/orQ5SPpgJ6Zm5D5Q8" variant="outline">
            体験会
          </CtaLink>
          <CtaLink href="https://forms.gle/9KLAq5PSkBudhbyL9" variant="outline">
            お問い合わせ
          </CtaLink>
        </motion.div>
      </section>
    </main>
  );
}
