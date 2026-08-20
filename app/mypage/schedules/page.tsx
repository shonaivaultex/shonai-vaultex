import Link from "next/link";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import ScheduleCalendar from "@/app/components/ScheduleCalendar";
import type { CompetitionApplicationItem } from "@/app/components/CompetitionApplication";
import CoachScheduleManager, { type CompetitionApplicant, type ScheduleTemplate } from "@/app/components/CoachScheduleManager";

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ newDate?: string; edit?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/schedules");
  const now = new Date();
  const rangeStart = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  const rangeEnd = new Date(now.getFullYear() + 2, 0, 1).toISOString();
  const [{ data }, { data: applications }, { data: coachRole }] = await Promise.all([
    supabase.from("schedules").select("*").gte("starts_at", rangeStart).lt("starts_at", rangeEnd).order("starts_at").limit(500),
    supabase.from("competition_applications").select("id,schedule_id,events,note,status").eq("user_id", user.id),
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle(),
  ]);
  const items = (data ?? []) as ScheduleItem[];
  const isCoach = Boolean(coachRole);
  const ownedItems = items.filter((item) => item.author_id === user.id);
  let templates: ScheduleTemplate[] = [];
  let attendance: Array<{ schedule_id: number; status: string }> = [];
  let competitionApplicants: CompetitionApplicant[] = [];
  if (isCoach) {
    const ownedIds = ownedItems.map((item) => item.id);
    const [{ data: templateRows }, { data: attendanceRows }, { data: applicationRows }] = await Promise.all([
      supabase.from("schedule_templates").select("*").eq("author_id", user.id).order("name"),
      ownedIds.length ? supabase.from("schedule_attendance").select("schedule_id,status").in("schedule_id", ownedIds) : Promise.resolve({ data: [] }),
      ownedIds.length ? supabase.from("competition_applications").select("id,schedule_id,user_id,events,note,status,created_at").in("schedule_id", ownedIds).order("created_at") : Promise.resolve({ data: [] }),
    ]);
    const applicantIds = [...new Set((applicationRows ?? []).map((item) => item.user_id))];
    const { data: players } = applicantIds.length ? await supabase.from("players").select("user_id,name").in("user_id", applicantIds) : { data: [] };
    const names = new Map((players ?? []).map((player) => [player.user_id, player.name]));
    templates = (templateRows ?? []) as ScheduleTemplate[];
    attendance = attendanceRows ?? [];
    competitionApplicants = (applicationRows ?? []).map((item) => ({ ...item, player_name: names.get(item.user_id) ?? "会員" })) as CompetitionApplicant[];
  }
  const initialEditingId = query.edit && /^\d+$/.test(query.edit) ? Number(query.edit) : null;
  const initialDate = query.newDate && /^\d{4}-\d{2}-\d{2}$/.test(query.newDate) ? query.newDate : undefined;
  const editingItem = initialEditingId ? ownedItems.find((item) => item.id === initialEditingId) : undefined;
  const selectedDate = initialDate ?? (editingItem ? editingItem.starts_at.slice(0, 10) : undefined);
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className={`mx-auto ${isCoach ? "max-w-7xl" : "max-w-3xl"}`}><Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60"><ArrowLeft size={16} />MY PAGE</Link><div className="mt-10 flex flex-wrap items-end justify-between gap-5"><header className="border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">SCHEDULE</p><h1 className="mt-3 text-4xl font-black">スケジュール</h1><p className="mt-3 text-white/55">{isCoach ? "カレンダーを確認しながら、予定を直接追加・編集できます。" : "全体予定と所属クラスの予定を月ごとに確認できます。"}</p></header><Link href="/mypage/my-calendar" className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-400/15"><CalendarRange size={18}/>マイカレンダーを開く</Link></div>{isCoach ? <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]"><div><ScheduleCalendar key={selectedDate ?? "today"} items={items} periods={[]} applications={(applications ?? []) as CompetitionApplicationItem[]} currentTime={new Date().toISOString()} canManage coachId={user.id} initialSelectedDate={selectedDate}/></div><div id="schedule-management" className="space-y-6 xl:sticky xl:top-20"><CoachScheduleManager key={`${initialEditingId ?? "new"}-${initialDate ?? "none"}`} initialItems={ownedItems} initialTemplates={templates} initialAttendance={attendance} competitionApplicants={competitionApplicants} initialDate={initialDate} initialEditingId={initialEditingId}/></div></div> : <ScheduleCalendar items={items} periods={[]} applications={(applications ?? []) as CompetitionApplicationItem[]} currentTime={new Date().toISOString()}/>}</div></main>;
}
