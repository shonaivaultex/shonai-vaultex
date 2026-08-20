import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Program } from "@/app/components/program-data";

type ProgramCardProps = {
  program: Program;
  compact?: boolean;
};

export function ProgramCard({
  program,
  compact = false,
}: ProgramCardProps) {
  return (
    <Link
      href={`/program/${program.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#111317] transition-all duration-500 hover:-translate-y-2 hover:border-orange-500/40 hover:shadow-2xl hover:shadow-orange-500/20"
    >
      {/* 背景画像 */}
      <div className="relative h-64 overflow-hidden">
        <Image
          src={program.image}
          alt={program.name}
          fill
          className="object-cover transition-all duration-700 group-hover:scale-110"
        />

        {/* 黒グラデーション */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090a0c] via-[#090a0c]/50 to-transparent" />

        {/* オレンジグロー */}
        <div className="absolute -left-32 top-0 h-full w-48 bg-orange-500/20 blur-[90px] transition-all duration-700 group-hover:left-full" />

        {/* 番号 */}
        <div className="absolute left-6 top-6 text-sm font-black tracking-[0.2em] text-orange-500">
          {program.number}
        </div>

        {/* 英語タイトル */}
        <div className="absolute bottom-6 left-6">
          <p className="text-4xl font-black tracking-[-0.05em]">
            {program.name}
          </p>

          <p className="mt-1 text-sm text-white/60">
            {program.englishTitle}
          </p>
        </div>
      </div>

      {/* 内容 */}
      <div className="p-6">
        <p className="text-sm text-white/60">
          {program.audience}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {program.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-white/70 transition-all duration-300 group-hover:border-orange-500 group-hover:text-orange-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className="translate-y-3 text-sm font-bold tracking-[0.18em] text-orange-500 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            VIEW CATEGORY
          </span>

          <ArrowRight
            className="text-orange-500 transition-all duration-500 group-hover:translate-x-2"
            size={22}
          />
        </div>
      </div>
    </Link>
  );
}
