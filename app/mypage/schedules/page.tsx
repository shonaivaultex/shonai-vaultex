import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import ScheduleCalendar from "@/app/components/ScheduleCalendar";
import type { CompetitionApplicationItem } from "@/app/components/CompetitionApplication";

export default async function SchedulesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/schedules");
  const now = new Date();
  const rangeStart = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  const rangeEnd = new Date(now.getFullYear() + 2, 0, 1).toISOString();
  const [{ data }, { data: applications }] = await Promise.all([
    supabase.from("schedules").select("*").gte("starts_at", rangeStart).lt("starts_at", rangeEnd).order("starts_at").limit(500),
    supabase.from("competition_applications").select("id,schedule_id,events,note,status").eq("user_id", user.id),
  ]);
  const items = (data ?? []) as ScheduleItem[];
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-3xl"><Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60"><ArrowLeft size={16} />MY PAGE</Link><header className="mt-10 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">SCHEDULE</p><h1 className="mt-3 text-4xl font-black">スケジュール</h1><p className="mt-3 text-white/55">全体予定と所属クラスの予定を月ごとに確認できます。</p></header><ScheduleCalendar items={items} applications={(applications ?? []) as CompetitionApplicationItem[]} currentTime={new Date().toISOString()} /></div></main>;
}
