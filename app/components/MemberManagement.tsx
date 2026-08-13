"use client";

import { useState } from "react";
import { ChevronDown, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Member = { user_id: string; name: string; grade: string | null; program_class: string | null; member_status: "active" | "paused" | "withdrawn" };
const labels = { active: "利用中", paused: "休会", withdrawn: "退会" } as const;
const styles = { active: "text-emerald-300", paused: "text-amber-300", withdrawn: "text-red-300" } as const;

export default function MemberManagement({ members }: { members: Member[] }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [savingId, setSavingId] = useState<string | null>(null);
  async function changeStatus(member: Member, status: Member["member_status"]) {
    if (status === member.member_status) return; const action = labels[status];
    if (!confirm(`${member.name}さんを「${action}」に変更しますか？\n記録や動画は削除されません。`)) return;
    setSavingId(member.user_id); const { error } = await createClient().rpc("set_member_status", { p_member_id: member.user_id, p_status: status }); setSavingId(null); if (error) { alert(error.message); return; } router.refresh();
  }
  return <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111]"><button type="button" onClick={() => setOpen((current) => !current)} className="flex w-full items-center gap-3 p-5 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><UserCog size={20} /></span><span><strong className="block">会員管理</strong><span className="text-xs text-white/40">休会・退会・利用再開</span></span><ChevronDown className={`ml-auto text-white/45 transition ${open ? "rotate-180" : ""}`} /></button>{open && <div className="divide-y divide-white/10 border-t border-white/10 px-5">{members.map((member) => <div key={member.user_id} className="flex flex-wrap items-center gap-3 py-4"><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{member.name}</strong><span className="text-xs text-white/40">{member.program_class ?? "クラス未設定"}・{member.grade ?? "学年未設定"}</span></div><span className={`text-xs font-bold ${styles[member.member_status]}`}>{labels[member.member_status]}</span><select value={member.member_status} disabled={savingId === member.user_id} onChange={(event) => changeStatus(member, event.target.value as Member["member_status"])} className="rounded-lg border border-white/15 bg-[#181818] px-3 py-2 text-xs disabled:opacity-40"><option value="active">利用中</option><option value="paused">休会</option><option value="withdrawn">退会</option></select></div>)}</div>}</section>;
}
