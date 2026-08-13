"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, UserCog, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type MemberStatus = "active" | "paused" | "withdrawn";
type Member = {
  user_id: string;
  name: string;
  grade: string | null;
  program_class: string | null;
  member_status: MemberStatus;
};

const labels = { active: "利用中", paused: "休会", withdrawn: "退会" } as const;
const styles = { active: "text-emerald-300", paused: "text-amber-300", withdrawn: "text-red-300" } as const;

export default function MemberManagement({ members }: { members: Member[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | MemberStatus>("all");

  const classes = useMemo(
    () => Array.from(new Set(members.map((member) => member.program_class).filter((value): value is string => Boolean(value)))).sort(),
    [members],
  );
  const filteredMembers = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ja");
    return members.filter((member) => {
      const matchesQuery = !keyword || [member.name, member.grade, member.program_class].some((value) => value?.toLocaleLowerCase("ja").includes(keyword));
      const matchesClass = classFilter === "all" || member.program_class === classFilter;
      const matchesStatus = statusFilter === "all" || member.member_status === statusFilter;
      return matchesQuery && matchesClass && matchesStatus;
    });
  }, [classFilter, members, query, statusFilter]);
  const hasFilters = Boolean(query || classFilter !== "all" || statusFilter !== "all");

  async function changeStatus(member: Member, status: MemberStatus) {
    if (status === member.member_status) return;
    if (!confirm(`${member.name}さんを「${labels[status]}」に変更しますか？\n記録や動画は削除されません。`)) return;
    setSavingId(member.user_id);
    const { error } = await createClient().rpc("set_member_status", { p_member_id: member.user_id, p_status: status });
    setSavingId(null);
    if (error) { alert(error.message); return; }
    router.refresh();
  }

  function clearFilters() {
    setQuery("");
    setClassFilter("all");
    setStatusFilter("all");
  }

  return <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111]">
    <button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center gap-3 p-5 text-left">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><UserCog size={20} /></span>
      <span><strong className="block">会員管理</strong><span className="text-xs text-white/40">検索・絞り込み・利用状況の変更</span></span>
      <span className="ml-auto text-xs text-white/35">{members.length}名</span>
      <ChevronDown className={`text-white/45 transition ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="border-t border-white/10 p-5">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_180px_150px_auto]">
        <label className="relative">
          <span className="sr-only">会員を検索</span>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・学年・クラスで検索" className="w-full rounded-xl border border-white/15 bg-[#181818] py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-white/25 focus:border-orange-500/60" />
        </label>
        <select aria-label="クラスで絞り込み" value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="rounded-xl border border-white/15 bg-[#181818] px-3 py-2.5 text-sm">
          <option value="all">すべてのクラス</option>
          {classes.map((programClass) => <option key={programClass} value={programClass}>{programClass}</option>)}
        </select>
        <select aria-label="利用状況で絞り込み" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | MemberStatus)} className="rounded-xl border border-white/15 bg-[#181818] px-3 py-2.5 text-sm">
          <option value="all">すべての状況</option>
          <option value="active">利用中</option><option value="paused">休会</option><option value="withdrawn">退会</option>
        </select>
        {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/55 hover:text-white"><X size={14} />解除</button>}
      </div>
      <p className="mt-4 text-xs text-white/35">{filteredMembers.length}名を表示</p>
      <div className="mt-2 divide-y divide-white/10">
        {filteredMembers.map((member) => <div key={member.user_id} className="flex flex-wrap items-center gap-3 py-4">
          <div className="min-w-0 flex-1"><strong className="block truncate text-sm">{member.name}</strong><span className="text-xs text-white/40">{member.program_class ?? "クラス未設定"}・{member.grade ?? "学年未設定"}</span></div>
          <span className={`text-xs font-bold ${styles[member.member_status]}`}>{labels[member.member_status]}</span>
          <select aria-label={`${member.name}さんの利用状況`} value={member.member_status} disabled={savingId === member.user_id} onChange={(event) => changeStatus(member, event.target.value as MemberStatus)} className="rounded-lg border border-white/15 bg-[#181818] px-3 py-2 text-xs disabled:opacity-40"><option value="active">利用中</option><option value="paused">休会</option><option value="withdrawn">退会</option></select>
        </div>)}
        {filteredMembers.length === 0 && <div className="py-10 text-center text-sm text-white/40">条件に一致する会員はいません。</div>}
      </div>
    </div>}
  </section>;
}
