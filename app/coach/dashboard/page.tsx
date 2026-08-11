import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ChevronRight, Users } from "lucide-react";
import { createClient } from "@/lib/supabase-server";

export default async function CoachDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/coach/dashboard");
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle();
  if (!role) redirect("/mypage");
  const { data: assignments } = await supabase.from("coach_class_assignments").select("program_class").eq("coach_id", user.id);
  const classes = (assignments ?? []).map((item) => item.program_class);
  const { data: athletes } = classes.length ? await supabase.from("players").select("user_id, name, grade, event, program_class").in("program_class", classes).order("program_class").order("name") : { data: [] };
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-5xl">
    <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60 hover:text-orange-400"><ArrowLeft size={16} />自分のマイページ</Link>
    <header className="mt-10 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">COACH DASHBOARD</p><h1 className="mt-3 text-4xl font-black">担当選手</h1><p className="mt-3 text-white/55">選手の現状を確認して、記録ごとにフィードバックできます。</p></header>
    <div className="mt-8 flex flex-wrap gap-2">{classes.map((item) => <span key={item} className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{item}</span>)}</div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(athletes ?? []).map((athlete) => <Link key={athlete.user_id} href={`/coach/athletes/${athlete.user_id}`} className="group rounded-2xl border border-white/10 bg-[#111] p-5 transition hover:border-orange-500/60"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Users size={20} /></span><strong className="mt-4 block text-lg">{athlete.name}</strong><span className="mt-1 block text-sm text-white/45">{athlete.program_class}・{athlete.grade}</span><span className="mt-1 block text-sm text-white/45">{athlete.event}</span><ChevronRight className="mt-4 text-orange-400 transition group-hover:translate-x-1" /></Link>)}</div>
  </div></main>;
}
