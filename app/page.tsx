"use client";

import { Dumbbell, Mail, MapPin, Phone, Trophy, Users } from "lucide-react";
import Hero from "./components/Hero";
import { useEffect, useState } from "react";
import { ContactLine } from "./components/ui/ContactLine";
import { CtaLink } from "./components/ui/CtaLink";
import { SectionLabel } from "./components/ui/SectionLabel";
const features = [
  { icon: Trophy, title: "まずは、あなたを知ることから", text: "初めにカウンセリングを行い、好きなこと、挑戦したいこと、性格や傾向を理解するところから始めます。不安や生活のスケジュールも聞きながら、その人に合ったプランを一緒に考えます。" },
  { icon: Users, title: "仲間と一緒に成長する", text: "人数や練習内容に合わせて、ウォーミングアップにレクリエーションを取り入れます。準備や片付け、計測、動画撮影もできることを分担。自分のペースを大切にしながら、お互いを応援できる関係を育てます。" },
  { icon: Dumbbell, title: "根拠を知り、納得して取り組む", text: "コーチ陣の競技・指導経験に加え、測定データ、動作分析、論文などの研究知見から競技力の向上を支えます。練習の根拠と、まだ確かではないことも分けて伝え、選手が納得して取り組める指導を大切にします。" },
] as const;

type HomeNewsItem = {
  id?: number | string;
  date: string;
  tag: string;
  title: string;
  body?: string;
};


export default function HomePage() {
  const [news, setNews] = useState<HomeNewsItem[]>([]);

  useEffect(() => {
    fetch("/api/public-news")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: Array<{ id: number; title: string; body?: string | null; priority?: string | null; created_at: string }>) => {
        setNews(rows.map((row) => ({ id: row.id, date: new Date(row.created_at).toLocaleDateString("ja-JP"), tag: row.priority === "important" ? "IMPORTANT" : "NEWS", title: row.title, body: row.body ?? "" })));
      })
      .catch(() => setNews([]));

  }, []);
  return (
    <>
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
          </div>
        </div>
      </section>

      <section id="feature" className="bg-[#101216] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="02">OUR APPROACH</SectionLabel>
          <div className="mt-7 flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><h2 className="text-3xl font-black tracking-[-0.045em] sm:text-5xl">OUR APPROACH.</h2><p className="max-w-sm text-sm leading-7 text-white/60">一人ひとりを理解し、挑戦を支える。VAULTEXが大切にしていること。</p></div>
          <div className="mt-10 grid gap-5 border-y border-orange-500/35 bg-[linear-gradient(90deg,rgba(249,115,22,.1),transparent)] px-5 py-7 sm:grid-cols-[minmax(0,.65fr)_minmax(0,1.35fr)] sm:items-center sm:px-7">
            <div>
              <p className="text-[10px] font-black tracking-[.2em] text-orange-400">PERFORMANCE APPROACH</p>
              <h3 className="mt-2 text-2xl font-black tracking-[-.035em] sm:text-3xl">ENJOY. MOVE. GROW.</h3>
            </div>
            <p className="max-w-2xl text-sm font-bold leading-7 text-white/75">VAULTEXでは、走る・跳ぶ・投げるなど、さまざまな種目や動きを楽しみながら、身体能力を高め、一人ひとりの自己ベスト更新を目指します。</p>
          </div>
          <div className="mt-14 grid gap-px bg-white/10 md:grid-cols-3">{features.map(({ icon: Icon, title, text }, index) => <article key={title} className="group bg-[#101216] p-7 sm:p-9"><div className="flex items-start justify-between"><Icon aria-hidden="true" size={30} strokeWidth={1.5} className="text-orange-500" /><span className="text-xs font-bold text-white/35">0{index + 1}</span></div><h3 className="mt-16 text-lg font-black tracking-wide">{title}</h3><p className="mt-4 text-sm leading-7 text-white/60">{text}</p><div className="mt-8 h-px w-10 bg-orange-500 transition-all duration-300 group-hover:w-full" /></article>)}</div>
          <div className="mt-10 max-w-3xl"><h3 className="text-xl font-black">READY TO COMPETE.</h3><p className="mt-4 text-sm leading-8 text-white/65">選手を否定する言葉ではなく、どうすれば次につながるかを一緒に考えます。試合に向けて十分に準備を重ね、不安を少しずつ減らしていく。自信を持ってスタートラインに立てるように、技術だけでなく気持ちの面にも向き合います。</p><CtaLink href="/coach" variant="outline" className="mt-5">コーチについて知る</CtaLink></div>
          <div className="mt-8 flex flex-wrap gap-4">
            <CtaLink href="#program">これからの活動を見る</CtaLink>
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
          <SectionLabel index="03">2027 SEASON</SectionLabel>
          <h2 className="mt-7 text-3xl font-black tracking-[-0.045em] sm:text-5xl">ENJOY ATHLETICS. TOGETHER.</h2>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/75">2027年度は、事前申込制の陸上練習会を開催予定です。中学生以上を対象に、初心者から自己ベストを目指す競技者まで。好きな種目に挑戦できる、居心地のいい場所を一緒につくっていきます。</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["土日中心・不定期開催", "仕事や大会の日程に合わせて開催します。毎週の開催ではありません。日時・場所は開催ごとにお知らせします。"],
              ["事前申込みで参加", "開催ごとに定員・申込締切・受付方法をご案内します。参加前に各回の案内をご確認ください。"],
              ["活動とアプリを一緒に育てる", "予定の確認や参加申込みを中心に、VAULTEXの使いやすさも確かめる一年に。記録や動画は希望に応じて活用し、参加者の声を改善につなげます。"],
            ].map(([title, body]) => (
              <article key={title} className="rounded-2xl border border-white/15 bg-[#111317] p-6">
                <h3 className="text-lg font-black text-orange-400">{title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/70">{body}</p>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-white/60">小学生向けの定期コースは、今回の募集対象には含みません。今後の開催については、体制が整い次第ご案内します。</p>
          <div className="mt-8 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.05] p-6 sm:p-8">
            <p className="text-xs font-black tracking-[0.18em] text-emerald-300">GROW WITH US</p>
            <h3 className="mt-3 text-xl font-black">継続して陸上を楽しみたい方へ</h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70">一人ひとりに目が届く、居心地のいい環境を大切にするため、受入人数に上限を設ける予定です。継続して参加したい方も、まずは体験したい方も、自分に合う関わり方を見つけていただけるよう準備しています。</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 p-5"><h4 className="font-bold">継続参加の登録枠</h4><p className="mt-2 text-sm leading-6 text-white/65">この場所で継続して練習したい方に向けた枠を設ける予定です。</p></div>
              <div className="rounded-xl border border-white/10 p-5"><h4 className="font-bold">初めての方の体験枠</h4><p className="mt-2 text-sm leading-6 text-white/65">実際に参加して、練習内容やクラブの雰囲気を確かめられる枠を残します。</p></div>
            </div>
            <p className="mt-5 text-sm font-bold text-emerald-200">募集人数・優先受付のルールは調整中です。決まり次第、このページでご案内します。</p>
            <p className="mt-2 text-sm leading-6 text-white/65">継続参加の希望は、2028年度の入会を約束するものではありません。</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href="/schedule">開催予定を確認する</CtaLink>
            <CtaLink href="https://line.me/R/ti/p/@082fhyco" variant="outline">活動について相談する</CtaLink>
          </div>
        </div>
      </section>

      <section id="price" className="border-y border-white/10 bg-[#0d0f12] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SectionLabel index="04">PRICE</SectionLabel>
          <h2 className="mt-7 text-3xl font-black tracking-[-0.045em] sm:text-5xl">OUR NEXT STEPS.</h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70">まずは活動の土台をつくる一年に。その先の正式運営に向けた方針も、あらかじめお伝えします。</p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[
              { year: "2027", title: "試行期間", period: "2027年4月〜2028年3月", fee: "月会費無料", rows: [["開催", "土日中心・不定期（毎週開催ではありません）"], ["参加", "事前申込制・各回定員あり"], ["費用", "施設利用料・保険料などの必要な実費は別途案内"]] },
              { year: "2028", title: "正式運営予定", period: "2028年4月〜", fee: "月額5,000円予定", rows: [["開催", "定期開催・平日セッションの拡充を予定"], ["参加", "内容をご確認いただき、改めて正式会員として登録"], ["費用", "会費・開催日・サービス内容は正式決定後に案内"]] },
            ].map((season) => <article key={season.year} className="rounded-3xl border border-orange-500/25 bg-[#111317] p-6 sm:p-8">
              <p className="text-xs font-black tracking-[0.18em] text-orange-400">{season.year} SEASON</p>
              <h3 className="mt-3 text-xl font-black">{season.title}</h3>
              <p className="mt-2 text-sm text-white/60">{season.period}</p>
              <p className="mt-6 text-2xl font-black sm:text-3xl">{season.fee}</p>
              <dl className="mt-6 divide-y divide-white/10 border-t border-white/10">{season.rows.map(([label, body]) => <div key={label} className="grid grid-cols-[3rem_1fr] gap-3 py-4 text-sm leading-6"><dt className="font-bold text-white/80">{label}</dt><dd className="text-white/65">{body}</dd></div>)}</dl>
            </article>)}
          </div>
          <p className="mt-5 rounded-xl border border-white/15 px-5 py-4 text-sm leading-7 text-white/80">有料会員へ自動移行することはありません。2028年度の運営内容は活動状況・体制を踏まえて決定し、正式入会の前に改めてご確認いただきます。</p>
          <div className="mt-8 grid items-stretch gap-8 lg:grid-cols-12">
            <div className="rounded-3xl border border-white/10 bg-[#111317] p-6 sm:p-8 lg:col-span-7">
              <p className="text-xs font-black tracking-[0.18em] text-orange-400">HOW TO JOIN</p>
              <h3 className="mt-2 text-xl font-black">参加までの流れ</h3>
              <div className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
                <div className="bg-[#111317] p-5">
                  <p className="text-xs font-black tracking-[0.14em] text-white/40">SESSION</p>
                  <h4 className="mt-1 font-bold">開催案内を確認</h4>
                  <p className="mt-2 text-sm leading-6 text-white/55">スケジュールで日時・場所・練習内容を確認。定員や締切、必要な費用は各回の案内でお知らせします。</p>
                </div>
                <div className="bg-[#111317] p-5">
                  <p className="text-xs font-black tracking-[0.14em] text-white/40">COUNSELING</p>
                  <h4 className="mt-1 font-bold">事前に参加を申し込む</h4>
                  <p className="mt-2 text-sm leading-6 text-white/55">各回で案内する方法からお申し込みください。初めての方や、参加方法が分からない方は公式LINEでご相談いただけます。</p>
                </div>
                <div className="bg-[#111317] p-5">
                  <p className="text-xs font-black tracking-[0.14em] text-white/40">RECORD &amp; REVIEW</p>
                  <h4 className="mt-1 font-bold">仲間と練習する</h4>
                  <p className="mt-2 text-sm leading-6 text-white/55">いろいろな種目を楽しみながら、自分の課題にも取り組む。計測や準備も協力し合い、お互いの挑戦を応援します。</p>
                </div>
                <div className="bg-[#111317] p-5">
                  <p className="text-xs font-black tracking-[0.14em] text-white/40">APP &amp; SUPPORT</p>
                  <h4 className="mt-1 font-bold">使ってみた感想を伝える</h4>
                  <p className="mt-2 text-sm leading-6 text-white/55">予定確認・参加申込みの分かりやすさを、実際の活動を通じて改善します。記録や動画などの利用は任意です。</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-6 text-white/60">2027年度の登録枠・体験枠の受付方法は準備中です。募集開始時に改めてご案内します。</p>
            </div>
            <div className="flex flex-col rounded-3xl border border-white/10 bg-[#111317] p-6 sm:p-8 lg:col-span-5">
              <p className="text-xs font-black tracking-[0.18em] text-orange-400">PERSONAL SESSION</p>
              <h3 className="mt-2 text-xl font-black">パーソナル料金</h3>
              <div className="mt-5 divide-y divide-white/10 border-y border-white/10 text-sm">
                <div className="flex items-center justify-between gap-4 py-3"><span className="text-white/60">クラブ会員・60分</span><strong>4,000円</strong></div>
                <div className="flex items-center justify-between gap-4 py-3"><span className="text-white/60">パーソナルのみ・60分</span><strong>6,000円</strong></div>
                <div className="flex items-start justify-between gap-4 py-3"><span className="text-white/60">継続プラン</span><strong className="text-right leading-6">月2回 11,000円<br/>月4回 20,000円</strong></div>
                <div className="flex items-center justify-between gap-4 py-3"><span className="text-white/60">初回体験</span><strong>3,000円</strong></div>
              </div>
              <p className="mt-4 text-xs leading-6 text-white/40">通常料金には個別指導と簡単なフィードバックを含みます。詳しい動画分析や個別メニュー作成は、内容を確認してご案内します。競技場利用料・出張費が必要な場合は別途お知らせします。</p>
              <CtaLink href="https://line.me/R/ti/p/@082fhyco" variant="outline" className="mt-5">料金・体験を相談する</CtaLink>
            </div>
          </div>
        </div>
      </section>

      <section id="news" className="bg-[#101216] py-24 sm:py-32"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionLabel index="05">NEWS</SectionLabel><h2 className="mt-7 text-3xl font-black tracking-[-0.04em] sm:text-5xl">LATEST NEWS.</h2><div className="mt-10 border-t border-white/15">{news.length ? news.map((item) => <article key={item.id ?? item.date} className="grid gap-3 border-b border-white/15 py-6 sm:grid-cols-12 sm:items-center sm:px-3"><time className="text-xs font-medium text-white/45 sm:col-span-2">{item.date}</time><span className="text-[10px] font-black tracking-[0.14em] text-orange-500 sm:col-span-2">{item.tag}</span><div className="sm:col-span-8"><h3 className="text-sm font-bold">{item.title}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-white/55">{item.body}</p></div></article>) : <p className="py-8 text-sm text-white/45">現在、一般向けのお知らせはありません。</p>}</div></div></section>

      <section id="contact" className="relative overflow-hidden bg-orange-500 py-24 text-[#090a0c] sm:py-32">
        <div className="pointer-events-none absolute -right-8 -top-28 select-none text-[13rem] font-black leading-none tracking-[-0.1em] text-black/10 sm:text-[22rem]">GO</div>
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <p className="flex items-center gap-3 text-xs font-black tracking-[0.22em]">
            <span className="text-black/50">06</span>
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
