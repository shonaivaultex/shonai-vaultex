import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Program } from "@/app/components/program-data";
import Image from "next/image";
type ProgramCardProps = {
  program: Program;
  compact?: boolean;
};

export function ProgramCard({ program, compact = false }: ProgramCardProps) {
if (compact) {
  return (
    <Link
      href={`/program/${program.slug}`}
      className="group relative grid overflow-hidden border-b border-white/10 py-7 transition-all duration-300 last:border-b-0 hover:bg-white/[0.04] hover:px-6 hover:shadow-xl hover:shadow-orange-500/10 sm:grid-cols-[5rem_1.2fr_1fr_auto] sm:items-center sm:gap-6 sm:py-9"
    >
      {/* 背景画像 */}
      <Image
        src={program.image}
        alt={program.name}
        fill
        className="absolute inset-0 object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-20"
      />

      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-[#090a0c]/90 transition-all duration-500 group-hover:bg-[#090a0c]/70" />

      {/* No */}
      <p className="relative text-sm font-black text-orange-500">
        {program.number}
      </p>

      {/* タイトル + タグ */}
      <div className="relative">
        <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">
          {program.name}
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {program.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/60 transition-all duration-300 group-hover:border-orange-500/40 group-hover:text-orange-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 右側 */}
      <div className="relative">
        <p className="font-bold text-white/90">
          {program.englishTitle}
        </p>

        <p className="mt-1 text-sm text-white/50">
          {program.audience}
        </p>
      </div>

      {/* 矢印 */}
      <ArrowRight
        aria-hidden="true"
        className="relative text-orange-500 transition-all duration-300 group-hover:translate-x-3 group-hover:scale-110"
      />

      {/* 下線 */}
      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-orange-500 transition-all duration-500 group-hover:w-full" />
    </Link>
  );
}
}

