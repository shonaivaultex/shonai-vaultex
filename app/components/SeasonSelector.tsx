import Link from "next/link";

export default function SeasonSelector({ years, selectedYear }: { years: number[]; selectedYear: number | null }) {
  return (
    <nav aria-label="表示期間" className="mt-8 flex flex-wrap gap-2">
      <Link href="?" className={`rounded-full border px-4 py-2 text-sm font-bold transition ${selectedYear === null ? "border-orange-500 bg-orange-500 text-white" : "border-white/15 text-white/60 hover:border-orange-500/60"}`}>累計</Link>
      {years.map((year) => <Link key={year} href={`?season=${year}`} className={`rounded-full border px-4 py-2 text-sm font-bold transition ${selectedYear === year ? "border-orange-500 bg-orange-500 text-white" : "border-white/15 text-white/60 hover:border-orange-500/60"}`}>{year}シーズン</Link>)}
    </nav>
  );
}
