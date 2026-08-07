import Image from "next/image";
import Link from "next/link";

const coaches = [
  {
    name: "宮内 勝史",
    role: "HEAD COACH",
    image: "/coach.jpg",
    href: "/coach/masashi-miyauchi",
  },
  {
    name: "Coming Soon",
    role: "ASSISTANT COACH",
    image: "/file.svg",
    href: "#",
  },
];


export default function CoachPage() {
  return (
    <main className="bg-[#090a0c] text-white">

      {/* Hero */}
      <section className="border-b border-white/10 py-32">
        <div className="mx-auto max-w-7xl px-6">

          <p className="text-sm font-black tracking-[0.35em] text-orange-500">
            COACHES
          </p>

          <h1 className="mt-6 text-6xl font-black tracking-[-0.06em]">
            Our Coaches
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">
            選手の可能性を引き出し、
            成長を支えるコーチングスタッフ。
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
                  className="object-cover transition duration-500 group-hover:scale-105"
                />

              </div>


              <div className="p-8">

                <p className="text-sm font-black tracking-[0.3em] text-orange-500">
                  {coach.role}
                </p>


                <h2 className="mt-4 text-4xl font-black">
                  {coach.name}
                </h2>


                <p className="mt-6 text-sm text-white/50">
                  VIEW PROFILE →
                </p>


              </div>

            </Link>
          ))}


        </div>

      </section>

    </main>
  );
}