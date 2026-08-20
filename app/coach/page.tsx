import Image from "next/image";
import Link from "next/link";

const coaches = [
  {
    name: "宮内 勝史",
    display: "COACHES",
    role: "HEAD COACH",
    image: "/coach-large.jpg",
    href: "/coach/masashi-miyauchi",
    specialty: ["走幅跳", "短距離", "投てき"],
  },
  {
    name: "Coming Soon",
    role: "ASSISTANT COACH",
    image: "/coming-soon.jpg",
    href: "#",
    specialty: [],
  },
];


export default function CoachPage() {
  return (
    <main className="bg-[#090a0c] text-white">

      {/* Hero */}
      <section className="border-b border-white/10 py-32">
        <div className="relative mx-auto max-w-7xl px-6">

  <p className="absolute right-0 top-0 hidden text-[12rem] font-black leading-none tracking-[-0.08em] text-white/5 lg:block">
    COACH
  </p>

  <p className="text-sm font-black tracking-[0.35em] text-orange-500">
    COACHES
  </p>

  <h1 className="mt-6 text-5xl font-black leading-none tracking-[-0.06em] sm:text-7xl">
    Beyond
    <br />
    Coaching.
  </h1>

  <p className="mt-8 max-w-2xl text-lg leading-9 text-white/60">
    選手の未来をつくるのは、
    技術だけではありません。
    <br />
    人を育てることを大切にする、
    SHONAI VAULTEXのコーチ陣です。
  </p>

</div>
      </section>


      {/* Coaches */}
      <section className="py-24">

        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-2">

          {coaches.map((coach)=>(
            <Link
              key={coach.name}
              href={coach.href}
              className="group overflow-hidden border border-white/10 bg-white/[0.02]"
            >

              <div className="relative aspect-[4/3] overflow-hidden">

                <Image
                  src={coach.image}
                  alt={coach.name}
                  fill
                  quality={95}
                  sizes="(min-width: 768px) 50vw, 95vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

              </div>
<p className="absolute -right-6 top-2 text-[6rem] font-black leading-none tracking-[-0.08em] text-white/5 transition-all duration-700 group-hover:scale-110 group-hover:text-white/10 sm:text-[8rem]">
  {coach.display}
</p>

              <div className="p-8">

                <p className="text-sm font-black tracking-[0.3em] text-orange-500">
                  {coach.role}
                </p>


                <h2 className="mt-4 text-4xl font-black">
                  {coach.name}
                </h2>
                <div className="mt-6 flex flex-wrap gap-2">

  {coach.specialty.map((item) => (
    <span
      key={item}
      className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/60 transition-all duration-300 group-hover:border-orange-500/40 group-hover:text-orange-300"
    >
      {item}
    </span>
  ))}

</div>


                <div className="flex items-center justify-between p-8">

  <p className="font-bold tracking-[0.15em] text-white/70 transition-all duration-300 group-hover:text-orange-400">
    VIEW PROFILE
  </p>

  <span className="text-2xl text-orange-500 transition-all duration-300 group-hover:translate-x-2">
    →
  </span>

</div>


              </div>

            </Link>
          ))}


        </div>

      </section>

    </main>
  );
}