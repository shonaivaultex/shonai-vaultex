import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import PerformanceSession from "@/app/components/PerformanceSession";

export default async function PerformanceSessionPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const coachId = auth?.claims.sub;
  if (!coachId) redirect("/login?next=/coach/performance-session");
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", coachId).in("role", ["coach", "admin"]);
  if (!roles?.length) redirect("/mypage");
  const isAdmin = roles.some((item) => item.role === "admin");
  const admin = createAdminClient();
  const from = new Date(); from.setDate(from.getDate() - 30);
  const to = new Date(); to.setDate(to.getDate() + 120);
  const { data: assignments } = await admin.from("coach_class_assignments").select("program_class").eq("coach_id", coachId);
  const classes = (assignments ?? []).map((item) => item.program_class);
  const [{ data: scheduleRows }, { data: athleteRows }] = await Promise.all([
    admin.from("schedules").select("id,title,starts_at,schedule_type,program_class,schedule_attendance(user_id,status)").gte("starts_at", from.toISOString()).lte("starts_at", to.toISOString()).order("starts_at"),
    admin.from("players").select("user_id,name,program_class,event").eq("member_status", "active").order("name"),
  ]);
  const schedules = isAdmin ? (scheduleRows ?? []) : (scheduleRows ?? []).filter((item) => !item.program_class || classes.includes(item.program_class));
  const athletes = isAdmin ? (athleteRows ?? []) : (athleteRows ?? []).filter((item) => item.program_class && classes.includes(item.program_class));
  return <main className="min-h-screen bg-[#090a0c] px-4 pb-24 pt-28 text-white sm:px-8"><div className="mx-auto max-w-7xl">
    <Link href="/coach/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-white/55 hover:text-orange-400"><ArrowLeft size={16}/>コーチダッシュボード</Link>
    <header className="mt-7 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[.2em] text-orange-400">LIVE PERFORMANCE</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">練習・大会記録 一括入力</h1><p className="mt-3 text-sm text-white/50">コーチが数値を先に登録し、選手があとから意識・振り返り・動画を追記します。</p></header>
    <PerformanceSession athletes={athletes.map((a) => ({ id:a.user_id,name:a.name,programClass:a.program_class,event:a.event }))} schedules={schedules.map((s) => ({ id:s.id,title:s.title,startsAt:s.starts_at,type:s.schedule_type,programClass:s.program_class,attendeeIds:(s.schedule_attendance ?? []).filter((a) => a.status === "attending").map((a) => a.user_id) }))}/>
  </div></main>;
}
