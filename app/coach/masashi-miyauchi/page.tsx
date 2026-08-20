import Image from "next/image";
import {
  Dumbbell,
  Users,
  Target,
  Trophy,
  Medal,
  Award,
} from "lucide-react";

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

  <div className="mt-10 space-y-8">

    <div className="flex items-start gap-4">
      <Trophy
        size={26}
        className="mt-1 text-orange-500"
      />

      <div>
        <h3 className="font-bold">
          東北大会
        </h3>

        <p className="text-white/60">
          走幅跳 優勝
        </p>
      </div>
    </div>

    <div className="flex items-start gap-4">
      <Medal
        size={26}
        className="mt-1 text-orange-500"
      />

      <div>
        <h3 className="font-bold">
          東北大会
        </h3>

        <p className="text-white/60">
          三段跳 準優勝
        </p>
      </div>
    </div>

    <div className="flex items-start gap-4">
      <Award
        size={26}
        className="mt-1 text-orange-500"
      />

      <div>
        <h3 className="font-bold">
          インターハイ
        </h3>

        <p className="text-white/60">
          4位
        </p>
      </div>
    </div>

    <div className="flex items-start gap-4">
      <Award
        size={26}
        className="mt-1 text-orange-500"
      />

      <div>
        <h3 className="font-bold">
          U18世界選手権
        </h3>

        <p className="text-white/60">
          日本代表・出場
        </p>
      </div>
    </div>

    <div className="flex items-start gap-4">
      <Award
        size={26}
        className="mt-1 text-orange-500"
      />

      <div>
        <h3 className="font-bold">
          学生個人選手権
        </h3>

        <p className="text-white/60">
          4位
        </p>
      </div>
    </div>

    <div className="flex items-start gap-4">
      <Award
        size={26}
        className="mt-1 text-orange-500"
      />

      <div>
        <h3 className="font-bold">
          関東インカレ
        </h3>

        <p className="text-white/60">
          8位
        </p>
      </div>
    </div>

  </div>

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