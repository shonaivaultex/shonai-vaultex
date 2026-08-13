import Link from "next/link";
import { ChevronDown, ChevronRight, Users } from "lucide-react";

type Athlete = {
  user_id: string;
  name: string;
  grade: string | null;
  event: string | null;
  program_class: string | null;
};

const classOrder = ["ジュニア", "ユース", "エリート", "マスターズ"];

export default function AthletesByClass({ athletes }: { athletes: Athlete[] }) {
  const grouped = athletes.reduce<Map<string, Athlete[]>>((result, athlete) => {
    const className = athlete.program_class ?? "クラス未設定";
    result.set(className, [...(result.get(className) ?? []), athlete]);
    return result;
  }, new Map());
  const groups = Array.from(grouped.entries()).sort(([left], [right]) => {
    const leftIndex = classOrder.indexOf(left);
    const rightIndex = classOrder.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) return left.localeCompare(right, "ja");
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });

  return <section className="mt-8">
    <div className="mb-4 flex items-end justify-between gap-4">
      <div><p className="text-xs font-black tracking-[0.18em] text-orange-400">ATHLETES</p><h2 className="mt-1 text-2xl font-black">担当選手一覧</h2></div>
      <span className="text-sm text-white/40">全{athletes.length}名</span>
    </div>
    <div className="space-y-3">
      {groups.map(([className, members]) => <details key={className} className="group/class overflow-hidden rounded-2xl border border-white/10 bg-[#111] open:border-orange-500/40">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden sm:px-6">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Users size={20} /></span>
          <strong className="text-lg">{className}</strong>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/45">{members.length}名</span>
          <ChevronDown size={19} className="ml-auto text-white/40 transition group-open/class:rotate-180" />
        </summary>
        <div className="grid gap-3 border-t border-white/10 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
          {members.map((athlete) => <Link key={athlete.user_id} href={`/coach/athletes/${athlete.user_id}`} className="group/card rounded-xl border border-white/10 bg-[#161616] p-4 transition hover:border-orange-500/60">
            <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><strong className="block truncate">{athlete.name}</strong><span className="mt-1 block text-xs text-white/45">{athlete.grade ?? "学年未設定"}</span><span className="mt-1 block truncate text-sm text-white/45">{athlete.event ?? "種目未設定"}</span></div><ChevronRight size={18} className="mt-1 shrink-0 text-orange-400 transition group-hover/card:translate-x-1" /></div>
          </Link>)}
        </div>
      </details>)}
      {groups.length === 0 && <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-center text-sm text-white/40">担当選手はまだ登録されていません。</div>}
    </div>
  </section>;
}
