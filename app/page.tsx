import { ArrowDown, Bot, BrainCircuit, CheckCircle2, ClipboardCheck, Eye, Flag, Gauge, Mail, MapPin, MessageCircle, Phone, Play, RefreshCw, Sparkles, Target, Users } from "lucide-react";
import Hero from "./components/Hero";
import { ContactLine } from "./components/ui/ContactLine";
import { CtaLink } from "./components/ui/CtaLink";
import { SectionLabel } from "./components/ui/SectionLabel";

const aspirations = ["自己ベストを更新したい", "自分の身体をもっと知りたい", "技術について相談したい", "大会で力を発揮したい", "楽しく陸上を続けたい", "新しいことに挑戦したい"] as const;
const weapons = [
  { icon: Users, label: "COACHING", title: "一人ひとりと向き合う", text: "少人数SESSIONを中心に、本人の考えや感覚を聞きながら、コーチと一緒に成長方法を考えます。" },
  { icon: Sparkles, label: "VAULTEX CLASS", title: "仲間と学ぶ・楽しむ", text: "一つのテーマを仲間と学び、試し、陸上そのものを楽しむ全体型の教室です。月2回程度を想定しています。" },
  { icon: ClipboardCheck, label: "PERFORMANCE LOG", title: "良かった自分を忘れない", text: "記録だけでなく、意識・感覚・動画を残し、調子が良かった時の自分をあとから振り返れます。" },
  { icon: Gauge, label: "ATHLETE SCAN", title: "今の自分を知る", text: "CONTROL TESTから現在の身体能力プロフィールを可視化。才能を決める診断ではなく、今回見えた身体特性です。" },
  { icon: Bot, label: "VAULTEX AI", title: "一人で悩まない", text: "記録や振り返りを一緒に整理し、次に見るもの・試すこと・相談先を考える競技相談パートナーです。" },
  { icon: MessageCircle, label: "COACH FEEDBACK", title: "分からなくなったら相談する", text: "自分だけでは整理できない時は、記録や動画と一緒にコーチへ相談し、直接やり取りできます。" },
] as const;
const growthCycle = [
  { icon: Flag, label: "GOAL", text: "なりたい自分を決める" }, { icon: Play, label: "TRY", text: "練習・挑戦する" },
  { icon: ClipboardCheck, label: "RECORD", text: "記録・感覚・動画を残す" }, { icon: Eye, label: "REFLECT", text: "振り返る" },
  { icon: MessageCircle, label: "TALK", text: "AIやコーチと考える" }, { icon: RefreshCw, label: "GROW", text: "成長し、次の目標へ" },
] as const;
const sessions = [
  { label: "SMALL GROUP SESSION", title: "3〜5名程度の少人数予約制", text: "本人の目的・感覚・考えを確認しながら進める、VAULTEXの中心となる指導です。" },
  { label: "VAULTEX CLASS", title: "仲間と学ぶ全体教室", text: "複数人で一つのテーマを学び、試し、陸上を楽しみます。月2回程度を想定しています。" },
  { label: "PERSONAL SESSION", title: "必要に応じた1対1指導", text: "個別の技術確認や相談など、目標に応じて活用する構想です。" },
  { label: "CONTROL TEST / SCAN", title: "現在地と成長を確認", text: "定期的に身体能力を測定し、同じ条件で変化を振り返ります。" },
] as const;
const news = [
  { date: "2026.08.06", tag: "OPEN", title: "SHONAI VAULTEX 公式サイトを公開しました" },
  { date: "2026.08.10", tag: "EVENT", title: "無料体験会の参加者を募集しています" },
  { date: "2026.09.01", tag: "RECRUIT", title: "2026年度 新規クラブメンバー募集開始" },
] as const;

export default function HomePage() {
  return <main className="overflow-x-hidden bg-[#090a0c] text-white">
    <Hero />
    <section id="about" className="border-t border-white/10 py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <SectionLabel index="01">YOUR GOAL</SectionLabel><div className="mt-8 grid gap-10 lg:grid-cols-12"><div className="lg:col-span-5"><h2 className="text-4xl font-black leading-tight tracking-[-0.055em] sm:text-6xl">あなたは、<br/><span className="text-orange-500">どうなりたい？</span></h2><p className="mt-7 max-w-md text-sm leading-8 text-white/60">スタート地点も、目標も、人それぞれでいい。VAULTEXは、全員を同じゴールへ連れていくクラブではありません。</p></div><div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">{aspirations.map((item, index) => <div key={item} className="flex min-h-24 items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] px-5 py-4"><span className="text-xs font-black text-orange-500">0{index + 1}</span><strong className="text-base leading-6">{item}</strong></div>)}</div></div><p className="mt-12 border-l-2 border-orange-500 pl-5 text-xl font-black sm:text-2xl">スタート地点も、目標も、人それぞれでいい。</p>
    </div></section>
    <section id="weapons" className="bg-[#101216] py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <SectionLabel index="02">YOUR TOOLS</SectionLabel><div className="mt-7 grid gap-7 lg:grid-cols-12 lg:items-end"><h2 className="text-4xl font-black leading-tight tracking-[-0.055em] sm:text-6xl lg:col-span-7">目標は、人それぞれ。<br/><span className="text-orange-500">だから、武器も一つじゃない。</span></h2><p className="max-w-md text-sm leading-8 text-white/60 lg:col-span-4 lg:col-start-9">難しい機能を使うことが目的ではありません。自分の目標を叶えるために、今必要なものを選びます。</p></div>
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{weapons.map(({ icon: Icon, label, title, text }, index) => <article key={label} className="group rounded-2xl border border-white/10 bg-[#0c0e11] p-6 transition-colors hover:border-orange-500/50 sm:p-7"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-xl bg-orange-500/10 text-orange-400"><Icon size={22} strokeWidth={1.7}/></span><span className="text-[10px] font-black text-white/25">0{index + 1}</span></div><p className="mt-8 text-[10px] font-black tracking-[.2em] text-orange-400">{label}</p><h3 className="mt-2 text-xl font-black">{title}</h3><p className="mt-4 text-sm leading-7 text-white/55">{text}</p></article>)}</div>
      <div className="mt-8 rounded-2xl border border-orange-500/25 bg-orange-500/[.06] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8"><div><h3 className="text-xl font-black">機能を全部使う必要はありません。</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-white/60">動画を使う人、SCANを成長の指標にする人、コーチとの対話を大切にする人。あなたの目標に必要なものを選んで使ってください。</p></div><CheckCircle2 className="mt-5 shrink-0 text-orange-400 sm:mt-0" size={34}/></div>
    </div></section>
    <section className="border-y border-white/10 py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <SectionLabel index="03">VAULTEX GROWTH CYCLE</SectionLabel><div className="mt-7 grid gap-8 lg:grid-cols-12"><h2 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl lg:col-span-7">挑戦を、<span className="text-orange-500">次の成長へ。</span></h2><p className="max-w-md text-sm leading-8 text-white/60 lg:col-span-4 lg:col-start-9">機能はバラバラではなく、一つの成長サイクルを支えるためにつながっています。</p></div><div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">{growthCycle.map(({ icon: Icon, label, text }, index) => <div key={label} className="relative rounded-2xl border border-white/10 bg-[#101216] p-5"><Icon size={22} className="text-orange-400"/><p className="mt-7 text-xs font-black tracking-[.18em] text-orange-400">{label}</p><p className="mt-2 text-sm font-bold leading-6">{text}</p>{index < growthCycle.length - 1 ? <ArrowDown className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-orange-500 p-1 text-black sm:hidden" size={24}/> : null}</div>)}</div><p className="mt-8 text-center text-sm font-black text-orange-300">GOAL → TRY → RECORD → REFLECT → TALK → GROW → NEXT GOAL</p>
    </div></section>
    <section id="feature" className="bg-[#0d0f12] py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionLabel index="04">COACHING PHILOSOPHY</SectionLabel><div className="mt-8 grid gap-5 lg:grid-cols-2">
      <article className="rounded-3xl border border-white/10 bg-black/20 p-7 sm:p-10"><Target className="text-orange-400" size={30}/><h2 className="mt-10 text-3xl font-black tracking-[-0.05em] sm:text-5xl">答えを、<br/>押し付けない。</h2><p className="mt-6 text-sm leading-8 text-white/60">VAULTEXが大切にするのは「あなたはどうしたい？」という問い。本人の感覚・考え・目標を理解し、良い部分を残しながら成長方法を一緒に考えます。</p></article>
      <article className="rounded-3xl border border-orange-500/30 bg-orange-500/[.05] p-7 sm:p-10"><BrainCircuit className="text-orange-400" size={30}/><h2 className="mt-10 text-3xl font-black tracking-[-0.05em] sm:text-5xl">感覚 <span className="text-orange-500">×</span><br/>データ。</h2><p className="mt-6 text-sm leading-8 text-white/60">競技で最後に頼るのは自分自身の感覚。記録・動画・データという客観的な情報と結びつけ、自分自身を理解する力を育てます。</p></article>
    </div></div></section>
    <section id="program" className="py-20 sm:py-28"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
      <SectionLabel index="05">HOW TO TRAIN</SectionLabel><div className="mt-7 grid gap-8 lg:grid-cols-12"><h2 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl lg:col-span-7">クラスに合わせる前に、<br/><span className="text-orange-500">目標から選ぶ。</span></h2><p className="max-w-md text-sm leading-8 text-white/60 lg:col-span-4 lg:col-start-9">曜日・回数・料金など未確定の内容は確定情報として掲載せず、現在の活動構想を紹介しています。</p></div><div className="mt-12 grid gap-4 md:grid-cols-2">{sessions.map((item) => <article key={item.label} className="rounded-2xl border border-white/10 bg-[#101216] p-6 sm:p-7"><p className="text-[10px] font-black tracking-[.2em] text-orange-400">{item.label}</p><h3 className="mt-3 text-xl font-black">{item.title}</h3><p className="mt-4 text-sm leading-7 text-white/55">{item.text}</p></article>)}</div>
      <div className="mt-8 rounded-2xl border border-white/10 p-6 sm:flex sm:items-center sm:justify-between sm:gap-8"><div><p className="text-[10px] font-black tracking-[.2em] text-white/35">ATHLETE CATEGORY</p><h3 className="mt-2 text-xl font-black">年代カテゴリーは、所属先ではなく安全な運用のため。</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">JUNIOR / YOUTH / ELITE / MASTERSは、CONTROL TEST条件・安全管理・ランキング等に使用します。上位クラスへ昇格する制度ではありません。</p></div><CtaLink href="/program" variant="outline" className="mt-5 shrink-0 sm:mt-0">年代カテゴリーを見る</CtaLink></div>
      <div className="mt-8 rounded-2xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-transparent p-6 sm:p-8"><p className="text-[10px] font-black tracking-[.2em] text-orange-400">FOR JUNIOR</p><h3 className="mt-2 text-2xl font-black">楽しいことを、最優先に。</h3><p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">楽しさの中で、仲間を尊重すること、ルールを守ること、片付けや道具を大切にすることも学びます。VAULTEXは楽しさと節度の両立を大切にします。</p></div>
    </div></section>
    <section id="news" className="bg-[#101216] py-20 sm:py-24"><div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><SectionLabel index="06">NEWS</SectionLabel><div className="mt-9 border-t border-white/15">{news.map((item) => <article key={`${item.date}-${item.title}`} className="grid gap-3 border-b border-white/15 py-5 sm:grid-cols-12 sm:items-center sm:px-3"><time className="text-xs font-medium text-white/45 sm:col-span-2">{item.date}</time><span className="text-[10px] font-black tracking-[0.14em] text-orange-500 sm:col-span-2">{item.tag}</span><h3 className="text-sm font-bold sm:col-span-8">{item.title}</h3></article>)}</div></div></section>
    <section id="contact" className="relative overflow-hidden bg-orange-500 py-20 text-[#090a0c] sm:py-28"><div className="pointer-events-none absolute -right-8 -top-28 select-none text-[13rem] font-black leading-none tracking-[-0.1em] text-black/10 sm:text-[22rem]">GO</div><div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10"><p className="flex items-center gap-3 text-xs font-black tracking-[0.22em]"><span className="text-black/50">07</span><span className="h-px w-8 bg-[#090a0c]"/>NEXT STEP</p><div className="mt-8 grid gap-12 lg:grid-cols-12"><div className="lg:col-span-8"><h2 className="text-4xl font-black leading-[0.98] tracking-[-0.065em] sm:text-7xl">まず、あなたの<br/>目標を聞かせてください。</h2><p className="mt-7 max-w-lg text-sm font-medium leading-7 text-black/70">体験・見学・目標についての相談から始められます。機能の知識や競技経験は必要ありません。</p><div className="mt-9 flex flex-wrap gap-3"><CtaLink href="https://forms.gle/gE26L75sc31dJdJk7">VAULTEXを体験する</CtaLink><CtaLink href="https://forms.gle/9KLAq5PSkBudhbyL9" variant="outline">目標について相談する</CtaLink></div></div><div className="space-y-6 self-end text-sm font-semibold lg:col-span-4"><ContactLine icon={MapPin}>山形県庄内地域（活動場所はお問い合わせください）</ContactLine><ContactLine icon={Mail}>shonaivaultex@gmail.com</ContactLine><ContactLine icon={Phone}>準備中</ContactLine></div></div></div></section>
  </main>;
}
