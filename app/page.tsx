"use client";

import { Dumbbell, Mail, MapPin, Phone, Trophy, Users } from "lucide-react";
import Hero from "./components/Hero";
import LoadingScreen from "./components/LoadingScreen";
import { useEffect, useState } from "react";
import { ProgramCard } from "./components/ProgramCard";
import { programs } from "./components/program-data";
import { ContactLine } from "./components/ui/ContactLine";
import { CtaLink } from "./components/ui/CtaLink";
import { SectionLabel } from "./components/ui/SectionLabel";
import { Stat } from "./components/ui/Stat";
const features = [
  { icon: Trophy, title: "まずは、あなたを知ることから", text: "初めにカウンセリングを行い、好きなこと、挑戦したいこと、性格や傾向を理解するところから始めます。不安や生活のスケジュールも聞きながら、その人に合ったプランを一緒に考えます。" },
  { icon: Users, title: "仲間と一緒に成長する", text: "人数や練習内容に合わせて、ウォーミングアップにレクリエーションを取り入れます。準備や片付け、計測、動画撮影もできることを分担。自分のペースを大切にしながら、お互いを応援できる関係を育てます。" },
  { icon: Dumbbell, title: "根拠を知り、納得して取り組む", text: "私自身の競技経験に加え、測定データ、動作分析、論文などの研究知見から競技力の向上を支えます。練習の根拠と、まだ確かではないことも分けて伝え、選手が納得して取り組める指導を大切にします。" },
] as const;

type HomeNewsItem = {
  id?: number | string;
  date: string;
  tag: string;
  title: string;
  body?: string;
};


export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<HomeNewsItem[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2200);

    fetch("/api/public-news")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Array<{ id: number; title: string; body?: string | null; priority?: string | null; created_at: string }>) => {
        setNews(rows.map((row) => ({ id: row.id, date: new Date(row.created_at).toLocaleDateString("ja-JP"), tag: row.priority === "important" ? "IMPORTANT" : "NEWS", title: row.title, body: row.body ?? "" })));
      })
      .catch(() => setNews([]));

    return () => clearTimeout(timer);
  }, []);
  return (
    <>
   <LoadingScreen loading={loading} />

    <main className="overflow-x-hidden bg-[#090a0c] text-white">
      <Hero />


      <section id="about" className="border-t border-white/10 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:px-10">
          <div className="lg:col-span-4"><SectionLabel index="01">ABOUT US</SectionLabel></div>
          <div className="lg:col-span-8">
            <h2 className="max-w-3xl text-3xl font-black leading-tight tracking-[-0.045em] sm:text-5xl">
              YOUR PLACE.
            </h2>
            <p className="mt-6 max-w-3xl text-base font-bold leading-8 text-white/85">環境が合わないことで、やりたいことを諦めてほしくない。</p>
            <div className="mt-9 grid max-w-3xl gap-6 text-sm leading-8 text-white/65 sm:grid-cols-2">
              <p>陸上が好きで始めたのに、思っていた環境と違った。新しいクラブに入りたいけれど、すでにできあがった輪になじめるか不安。そんな人が、自分らしく挑戦を続けられる場所をつくりたいと考えています。</p>
              <p>競技で上を目指すことも、仲間と体を動かすことも。ここでの体験や出会いが、人生を豊かにするきっかけになったら。それが、VAULTEXに込めた思いです。</p>
            </div>
            <div className="mt-12 grid max-w-3xl grid-cols-3 border-y border-white/10 py-6">
  <Stat value="2026" label="FOUNDED" />
  <Stat value="3つ" label="成長支援の柱" />
  <Stat value="4" label="PROGRAM" />
</div>
          </div>
        </div>
      </section>

      <section id="feature" className="bg-[#101216] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="02">OUR APPROACH</SectionLabel>
          <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><h2 className="text-3xl font-black tracking-[-0.045em] sm:text-5xl">OUR APPROACH.</h2><p className="max-w-sm text-sm leading-7 text-white/60">一人ひとりを理解し、挑戦を支える。VAULTEXが大切にしていること。</p></div>
          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">{features.map(({ icon: Icon, title, text }, index) => <article key={title} className="group bg-[#101216] p-7 sm:p-9"><div className="flex items-start justify-between"><Icon aria-hidden="true" size={30} strokeWidth={1.5} className="text-orange-500" /><span className="text-xs font-bold text-white/35">0{index + 1}</span></div><h3 className="mt-16 text-lg font-black tracking-wide">{title}</h3><p className="mt-4 text-sm leading-7 text-white/60">{text}</p><div className="mt-8 h-px w-10 bg-orange-500 transition-all duration-300 group-hover:w-full" /></article>)}</div>
          <div className="mt-10 max-w-3xl"><h3 className="text-xl font-black">READY TO COMPETE.</h3><p className="mt-4 text-sm leading-8 text-white/65">選手を否定する言葉ではなく、どうすれば次につながるかを一緒に考えます。試合に向けて十分に準備を重ね、不安を少しずつ減らしていく。自信を持ってスタートラインに立てるように、技術だけでなく気持ちの面にも向き合います。</p><CtaLink href="/coach" variant="outline" className="mt-5">コーチについて知る</CtaLink></div>
          <div className="mt-8 flex flex-wrap gap-4">
            <CtaLink href="/program">プログラムを詳しく見る</CtaLink>
            <CtaLink href="/mypage" variant="outline">マイページを開く</CtaLink>
          </div>
            <div className="mt-12 rounded-2xl border border-white/10 bg-[#0c0d10] p-6 sm:p-10">
            <SectionLabel index="02-2">HOW TO START</SectionLabel>
            <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-3xl">LET’S TALK.</h3>
            <div className="mt-7 grid gap-4 text-sm leading-7 text-white/70 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-xs font-black tracking-[0.12em] text-orange-400">STEP 1</span>
                <p className="mt-3 font-bold text-white">公式LINEで相談</p>
                <p className="mt-2">入会前のご相談も受け付けています。挑戦したいことや、今の環境で困っていることを聞かせてください。</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-xs font-black tracking-[0.12em] text-orange-400">STEP 2</span>
                <p className="mt-3 font-bold text-white">カウンセリングで一緒に考える</p>
                <p className="mt-2">目標が決まっていなくても大丈夫。生活や気持ちに合った始め方を、一緒に考えます。</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-xs font-black tracking-[0.12em] text-orange-400">STEP 3</span>
                <p className="mt-3 font-bold text-white">自分のペースで始める</p>
                <p className="mt-2">さまざまな体験を通して、やりたい競技や得意なことを見つけ、成長を記録していきます。</p>
              </div>
            </div>
            <CtaLink href="https://line.me/R/ti/p/@082fhyco" className="mt-8 inline-flex">公式LINEで相談する</CtaLink>
          </div>
        </div>
      </section>

      <section id="program" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="03">PROGRAM</SectionLabel>
          <div className="mt-7 grid gap-10 lg:grid-cols-12"><h2 className="text-3xl font-black tracking-[-0.045em] sm:text-5xl lg:col-span-5">FIND YOUR WAY.</h2><p className="max-w-md self-end text-sm leading-7 text-white/60 lg:col-span-5 lg:col-start-8">大会を目指す方も、フィットネスとして体を動かしたい方も。年齢や経験、生活に合わせた関わり方を、一緒に考えます。</p></div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <article><h3 className="text-lg font-black text-orange-400">KIDS</h3><p className="mt-2 text-sm font-bold text-white/85">小学生｜体験と成長を、未来に残す。</p><p className="mt-3 text-sm leading-7 text-white/65">いろいろな競技や動きを体験し、好きなことや得意なことを見つける。「自分も小学生の頃から成長の記録を残しておきたかった」という私自身の思いから、長い時間をかけた変化も大切にします。</p></article>
            <article><h3 className="text-lg font-black text-orange-400">TEENS</h3><p className="mt-2 text-sm font-bold text-white/85">中学生・高校生｜納得して、挑戦する。</p><p className="mt-3 text-sm leading-7 text-white/65">学校や所属先によって、練習環境や専門的な指導を受けられる機会は異なります。今いる場所だけで挑戦の可能性が決まらないように、根拠のある説明と指導で「続けたい」「もっと伸びたい」を支えます。</p></article>
            <article><h3 className="text-lg font-black text-orange-400">ADULTS</h3><p className="mt-2 text-sm font-bold text-white/85">一般｜今の暮らしの中で、続ける。</p><p className="mt-3 text-sm leading-7 text-white/65">時間がない、場所や仲間がいない。そんな悩みも聞かせてください。カウンセリングで生活に合ったスケジュールや競技との向き合い方を考えます。試合には出ず、フィットネスとしての利用も相談できます。</p></article>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
  {programs.map((program) => (
    <ProgramCard
      key={program.slug}
      program={program}
      
    />
  ))}
</div>

<div className="mt-12 flex justify-center">
  <CtaLink href="/program" variant="outline">
    VIEW ALL PROGRAMS
  </CtaLink>
</div>
        </div>
      </section>

      <section id="news" className="bg-[#101216] py-24 sm:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionLabel index="04">NEWS</SectionLabel><h2 className="mt-7 text-3xl font-black tracking-[-0.04em] sm:text-5xl">LATEST NEWS.</h2><div className="mt-10 border-t border-white/15">{news.length ? news.map((item) => <article key={item.id ?? item.date} className="grid gap-3 border-b border-white/15 py-6 sm:grid-cols-12 sm:items-center sm:px-3"><time className="text-xs font-medium text-white/45 sm:col-span-2">{item.date}</time><span className="text-[10px] font-black tracking-[0.14em] text-orange-500 sm:col-span-2">{item.tag}</span><div className="sm:col-span-8"><h3 className="text-sm font-bold">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">{item.body}</p></div></article>) : <p className="py-8 text-sm text-white/45">現在、一般向けのお知らせはありません。</p>}</div></div></section>

      <section id="contact" className="relative overflow-hidden bg-orange-500 py-24 text-[#090a0c] sm:py-32">
        <div className="pointer-events-none absolute -right-8 -top-28 select-none text-[13rem] font-black leading-none tracking-[-0.1em] text-black/10 sm:text-[22rem]">GO</div>
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="flex items-center gap-3 text-xs font-black tracking-[0.22em]">
            <span className="text-black/50">05</span>
            <span className="h-px w-8 bg-[#090a0c]" />
            APP
          </p>
          <div className="mt-8 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h2 className="text-4xl font-black leading-[0.95] tracking-[-0.065em] sm:text-7xl">KEEP YOUR<br />PROGRESS.</h2>
              <p className="mt-7 max-w-md text-sm font-medium leading-7 text-black/70">
                記録や動画、日々の振り返りをアプリに残していく。自分が積み重ねてきたことや、前回からの変化が見えるように。選手自身の振り返りと、ご家族の見守りを支えます。
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <CtaLink href="https://line.me/R/ti/p/@082fhyco" variant="outline">公式LINEで相談する</CtaLink>
                <CtaLink href="/mypage">マイページを開く</CtaLink>
                <CtaLink href="/family" variant="outline">保護者の方はこちら</CtaLink>
                <CtaLink href="/schedule" variant="outline">スケジュールを見る</CtaLink>
              </div>
            </div>
            <div className="space-y-6 self-end text-sm font-semibold lg:col-span-4">
              <ContactLine icon={MapPin}>山形県庄内地域（活動場所はアプリ案内）</ContactLine>
              <ContactLine icon={Mail}>shonaivaultex@gmail.com</ContactLine>
              <ContactLine icon={Phone}>入会前のご相談は公式LINEから</ContactLine>
            </div>
          </div>
        </div>
      </section>
    </main>
  </>
  );
}
