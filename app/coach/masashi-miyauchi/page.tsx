import Image from "next/image";
import {
  Dumbbell,
  Users,
  Target,
} from "lucide-react";

// International, national, then regional achievements; national senior category first.
const achievements = [
  {
    "year": "2015",
    "title": "第9回世界ユース陸上競技選手権（U18）",
    "result": "男子走幅跳 日本代表・決勝進出（12位）",
    "record": "予選 7m40（+1.0）",
    "note": "カリ（コロンビア）開催",
    "url": "https://www.jaaf.or.jp/taikai/1311/result.pdf"
  },
  {
    "year": "2016",
    "title": "日本学生陸上競技個人選手権",
    "result": "男子走幅跳 4位",
    "record": "7m60（+1.4）",
    "note": "筑波大学",
    "url": "https://www.iuau.jp/ev2016/16kojin/16kojin_results.pdf#page=23"
  },
  {
    "year": "2014",
    "title": "全国高等学校総合体育大会（山梨インターハイ）",
    "result": "男子走幅跳 4位",
    "record": "7m53（+1.9）",
    "note": "酒田西高校",
    "url": "https://www.jaaf.or.jp/taikai/1196/result.pdf"
  },
  {
    "year": "2019",
    "title": "関東学生陸上競技対校選手権（関東インカレ）",
    "result": "男子1部走幅跳 8位",
    "record": "7m68（+4.0・追い風参考）",
    "note": "筑波大学",
    "url": "https://tsukubathletics.com/archives/11989"
  },
  {
    "year": "2015",
    "title": "第70回東北高等学校陸上競技大会",
    "result": "男子走幅跳 優勝",
    "record": "7m50（+1.5）",
    "note": "大会新記録（当時）／酒田西高校",
    "url": "https://gold.jaic.org/fukushima/kekka/2015/2015%20touhoku%20IH.pdf#page=47"
  },
  {
    "year": "2015",
    "title": "第70回東北高等学校陸上競技大会",
    "result": "男子三段跳 準優勝",
    "record": "14m51（+3.1・追い風参考）",
    "note": "同大会の公認条件内最高記録：14m46（+1.0）",
    "url": "https://gold.jaic.org/fukushima/kekka/2015/2015%20touhoku%20IH.pdf#page=48"
  }
];

export default function CoachPage() {
  return (
    <main className="bg-[#090a0c] text-white">

      <section className="relative overflow-hidden border-b border-white/10 py-32">

        <div className="absolute -left-40 top-20 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[180px]" />

        <div className="relative mx-auto max-w-7xl px-6">

          <p className="text-sm font-black tracking-[0.35em] text-orange-500">
            HEAD COACH
          </p>

          <h1 className="mt-6 text-6xl font-black tracking-[-0.06em]">
            MASASHI MIYAUCHI
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            選手として、指導者として。
            庄内から全国へ挑戦するアスリートを育てます。
          </p>

        </div>

      </section>

      <section className="py-24">

  <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2">

    {/* 写真 */}
    <div className="overflow-hidden rounded-3xl">
      <Image
        src="/coach-large.jpg"
        alt="Coach"
        width={700}
        height={900}
        className="h-full w-full object-cover transition duration-500 hover:scale-105"
        quality={95}
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority
      />
    </div>

    {/* プロフィール */}
    <div className="flex flex-col justify-center">

      <p className="text-sm font-black tracking-[0.3em] text-orange-500">
        PROFILE
      </p>

      <h2 className="mt-5 text-5xl font-black">
        宮内 勝史
      </h2>

      <p className="mt-3 text-lg font-bold text-orange-500">
        SHONAI VAULTEX Head Coach
      </p>

      <p className="mt-8 leading-8 text-white/70">
        陸上競技を通して、競技力だけでなく、
        人として成長できる環境づくりを大切にしています。
        「挑戦する楽しさ」を伝え、
        一人ひとりの可能性を最大限に引き出します。
      </p>
      <div className="mt-12 grid gap-8 border-t border-white/10 pt-10 md:grid-cols-3">

  <div className="border-r border-white/10 pr-6">
    <Dumbbell
  size={34}
  strokeWidth={1.7}
  className="text-orange-500"
/>

    <h3 className="mt-4 text-lg font-black text-orange-500">
      専門種目
    </h3>

    <p className="mt-3 text-white/70">
      走幅跳・短距離・投てき
    </p>
  </div>

  <div className="border-r border-white/10 pr-6">
  <Users
  size={34}
  strokeWidth={1.7}
  className="text-orange-500"
/>

    <h3 className="mt-4 text-lg font-black text-orange-500">
      指導対象
    </h3>

    <p className="mt-3 text-white/70">
      小学生〜一般
    </p>
  </div>

  <div>
    <Target
  size={34}
  strokeWidth={1.7}
  className="text-orange-500"
/>

    <h3 className="mt-4 text-lg font-black text-orange-500">
      指導理念
    </h3>

    <p className="mt-3 text-white/70">
      「競技を通して人生を豊かにする」
    </p>
  </div>

</div>

    </div>

  </div>

</section>
{/* Achievements */}
<section className="border-t border-white/10 py-24">

  <div className="mx-auto max-w-7xl px-6">

    <p className="text-sm font-black tracking-[0.35em] text-orange-500">
      ACHIEVEMENTS
    </p>

    <h2 className="mt-6 text-5xl font-black tracking-[-0.05em]">
      Athlete Career
    </h2>

    <p className="mt-6 max-w-2xl leading-8 text-white/60">
      選手として積み重ねた経験を、
      次世代のアスリート育成へ。
    </p>
    <div className="mt-16 grid gap-8 lg:grid-cols-2">

  {/* PERSONAL BEST */}
  <div className="group rounded-3xl border border-white/10 bg-white/[0.03] p-10 transition-all duration-500 hover:-translate-y-2 hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/10">

    <p className="text-sm font-black tracking-[0.3em] text-orange-500">
      PERSONAL BEST
    </p>

    <div className="mt-12">

      <p className="text-7xl font-black leading-none tracking-[-0.08em]">
        7.81
      </p>

      <p className="mt-3 text-lg font-semibold text-white/60">
        LONG JUMP
      </p>

    </div>

    <div className="mt-12 space-y-4 border-t border-white/10 pt-8">

      <div className="flex justify-between">
        <span className="text-white/50">Triple Jump</span>
        <span className="font-bold">14.76m</span>
      </div>

      <div className="flex justify-between">
        <span className="text-white/50">100m</span>
        <span className="font-bold">10.81</span>
      </div>

      <div className="flex justify-between">
        <span className="text-white/50">200m</span>
        <span className="font-bold">21.70</span>
      </div>

      <div className="flex justify-between">
        <span className="text-white/50">javelin throw</span>
        <span className="font-bold">50.13m</span>
      </div>

    </div>

  </div>

  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10">

  <p className="text-sm font-black tracking-[0.3em] text-orange-500">
    MAJOR ACHIEVEMENTS
  </p>

  <h3 className="mt-4 text-2xl font-black">主な競技実績</h3>
  <ol className="mt-8 divide-y divide-white/10">
    {achievements.map((achievement) => (
      <li key={achievement.title + achievement.result} className="py-6 first:pt-0">
        <p className="text-sm font-bold text-orange-500">{achievement.year}年</p>
        <h4 className="mt-2 font-bold leading-relaxed">{achievement.title}</h4>
        <p className="mt-2 text-lg font-bold">{achievement.result}</p>
        <p className="mt-2 text-white/80">{achievement.record}</p>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{achievement.note}</p>
        <a
          href={achievement.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm text-orange-400 underline underline-offset-4 hover:text-orange-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label={achievement.year + "年 " + achievement.title + " " + achievement.result + "の出典（別タブ）"}
        >
          出典を見る
        </a>
      </li>
    ))}
  </ol>
  <p className="mt-4 text-xs leading-6 text-white/60">
    括弧内は風速（m/s）。追い風参考記録は大会順位の記録として掲載しています。
  </p>
</div>
</div>

  </div>

</section>
{/* Coaching Experience */}
<section className="border-t border-white/10 py-24">

  <div className="mx-auto max-w-7xl px-6">

    <p className="text-sm font-black tracking-[0.35em] text-orange-500">
      COACHING
    </p>

    <h2 className="mt-6 text-5xl font-black tracking-[-0.05em]">
      Coaching Experience
    </h2>

    <p className="mt-6 max-w-2xl leading-8 text-white/60">
      選手として培った経験を活かし、
      次世代アスリートの育成に取り組んでいます。
    </p>

    <div className="mt-16 grid gap-8 lg:grid-cols-2">

      {/* 左 */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10">

        <p className="text-sm font-black tracking-[0.3em] text-orange-500">
          EXPERIENCE
        </p>

        <div className="mt-10 space-y-10">

          <div>
            <h3 className="text-2xl font-black">
              つくばツインピークス
            </h3>

            <p className="mt-2 font-semibold text-orange-500">
              Student Coach
            </p>

            <p className="mt-4 leading-8 text-white/60">
              筑波大学在学中、
              学生コーチとして選手指導・練習運営に携わる。
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-black">
              SHONAI VAULTEX
            </h3>

            <p className="mt-2 font-semibold text-orange-500">
              Head Coach
            </p>

            <p className="mt-4 leading-8 text-white/60">
              地域に根差した総合陸上クラブを設立。
              子どもから一般まで、
              一人ひとりの可能性を伸ばす指導を行う。
            </p>
          </div>

        </div>

      </div>

      {/* 右 */}
      <div className="rounded-3xl border border-orange-500/20 bg-orange-500/5 p-10">

        <p className="text-sm font-black tracking-[0.3em] text-orange-500">
          PHILOSOPHY
        </p>

        <h2 className="mt-10 text-4xl font-black leading-tight">
          Challenge
          <br />
          Changes
          <br />
          People.
        </h2>

        <p className="mt-10 leading-8 text-white/70">
          勝つことだけを目的にするのではなく、
          挑戦を楽しみ、
          人として成長できる環境づくりを大切にしています。
        </p>

      </div>

    </div>

  </div>

</section>

    </main>
  );
}
