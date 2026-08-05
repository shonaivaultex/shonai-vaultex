import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Program } from "@/app/components/program-data";

type ProgramCardProps = {
  program: Program;
  compact?: boolean;
};

export function ProgramCard({ program, compact = false }: ProgramCardProps) {
  if (compact) {
    return (
      <Link
        href={`/program/${program.slug}`}
        className="group grid gap-4 border-b border-white/10 py-7 transition-colors last:border-b-0 hover:bg-white/[0.035] sm:grid-cols-[5rem_1.2fr_1fr_auto] sm:items-center sm:gap-6 sm:px-5 sm:py-9"
      >
        <p className="text-sm font-black text-orange-500">{program.number}</p>
        <h2 className="text-3xl font-black tracking-[-0.05em] sm:text-4xl">
          {program.name}
        </h2>
        <div>
          <p className="font-bold text-white/90">{program.englishTitle}</p>
          <p className="mt-1 text-sm text-white/50">{program.audience}</p>
        </div>
        <ArrowRight
          aria-hidden="true"
          className="text-orange-500 transition-transform duration-300 group-hover:translate-x-2"
        />
      </Link>
    );
  }

  return (
    <Link
      href={`/program/${program.slug}`}
      className="group grid gap-5 border-b border-white/15 py-7 transition sm:grid-cols-12 sm:items-center sm:gap-6 sm:py-9"
    >
      <div className="sm:col-span-2">
        <span className="text-xs font-black tracking-[0.18em] text-orange-500">
          {program.name}
        </span>
        <p className="mt-2 text-xs text-white/50">{program.audience}</p>
      </div>
      <h3 className="text-2xl font-black tracking-[-0.04em] sm:col-span-4 sm:text-3xl">
        {program.englishTitle}
      </h3>
      <p className="text-sm leading-7 text-white/60 sm:col-span-4">
        {program.description}
      </p>
      <span className="flex size-10 items-center justify-center rounded-full border border-white/25 transition group-hover:border-orange-500 group-hover:bg-orange-500 sm:col-span-2 sm:justify-self-end">
        <ArrowRight aria-hidden="true" size={17} />
      </span>
    </Link>
  );
}
