import Image from "next/image";
import { Dumbbell, Users, Target } from "lucide-react";

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
            宮内 勝史
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
        src="/coach.jpg"
        alt="Coach"
        width={700}
        height={900}
        className="h-full w-full object-cover transition duration-500 hover:scale-105"
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

    </main>
  );
}