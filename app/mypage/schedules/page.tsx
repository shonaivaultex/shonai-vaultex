import Link from "next/link";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import type { CoachAttendanceRoster } from "@/app/components/SchedulePanel";
import ScheduleCalendar from "@/app/components/ScheduleCalendar";
import type { CompetitionApplicationItem } from "@/app/components/CompetitionApplication";
import CoachScheduleManager, { type CompetitionApplicant, type ScheduleTemplate } from "@/app/components/CoachScheduleManager";

export default async function SchedulesPage({ searchParams }: { searchParams: Promise<{ newDate?: string; edit?: string; attendance?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;
  if (!userId) redirect("/login?next=/mypage/schedules");
  const now = new Date();
  const rangeStart = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  const rangeEnd = new Date(now.getFullYear() + 2, 0, 1).toISOString();
  const [{ data }, { data: applications }, { data: coachRole }, { data: ownAttendanceRows }] = await Promise.all([
    supabase.from("schedules").select("*").gte("starts_at", rangeStart).lt("starts_at", rangeEnd).order("starts_at").limit(500),
    supabase.from("competition_applications").select("id,schedule_id,events,note,status").eq("user_id", userId),
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "coach").maybeSingle(),
    supabase.from("schedule_attendance").select("schedule_id").eq("user_id", userId),
  ]);
  const items = (data ?? []) as ScheduleItem[];
  const isCoach = Boolean(coachRole);
  const unansweredOnly = !isCoach && query.attendance === "unanswered";
  const answeredScheduleIds = new Set((ownAttendanceRows ?? []).map((row) => row.schedule_id));
  const memberCalendarItems = unansweredOnly
    ? items.filter((item) => !answeredScheduleIds.has(item.id) && new Date(item.ends_at ?? item.starts_at) >= now)
    : items;
  const ownedItems = items.filter((item) => item.author_id === userId);
  let templates: ScheduleTemplate[] = [];
  let attendance: Array<{ schedule_id: number; status: string }> = [];
  let attendanceRosters: Record<number, CoachAttendanceRoster> = {};
  let competitionApplicants: CompetitionApplicant[] = [];
  let calendarItems = items;
  if (isCoach) {
    const ownedIds = ownedItems.map((item) => item.id);
    const scheduleIds = items.map((item) => item.id);
    const rosterClient = hasAdminKey() ? createAdminClient() : supabase;
    const [{ data: templateRows }, { data: attendanceRows }, { data: applicationRows }, { data: rosterRows }, { data: playerRows }] = await Promise.all([
      supabase.from("schedule_templates").select("*").eq("author_id", userId).order("name"),
      ownedIds.length ? supabase.from("schedule_attendance").select("schedule_id,status").in("schedule_id", ownedIds) : Promise.resolve({ data: [] }),
      ownedIds.length ? supabase.from("competition_applications").select("id,schedule_id,user_id,events,note,status,created_at").in("schedule_id", ownedIds).order("created_at") : Promise.resolve({ data: [] }),
      scheduleIds.length ? rosterClient.from("schedule_attendance").select("schedule_id,user_id,status,comment").in("schedule_id", scheduleIds) : Promise.resolve({ data: [] }),
      rosterClient.from("players").select("user_id,name,program_class").eq("member_status", "active").order("name"),
    ]);
    const applicantIds = [...new Set((applicationRows ?? []).map((item) => item.user_id))];
    const { data: applicantPlayers } = applicantIds.length ? await supabase.from("players").select("user_id,name").in("user_id", applicantIds) : { data: [] };
    const names = new Map((applicantPlayers ?? []).map((player) => [player.user_id, player.name]));
    templates = (templateRows ?? []) as ScheduleTemplate[];
    attendance = attendanceRows ?? [];
    competitionApplicants = (applicationRows ?? []).map((item) => ({ ...item, player_name: names.get(item.user_id) ?? "会員" })) as CompetitionApplicant[];
    const rosterPlayers = (playerRows ?? []).map((player) => ({ id: player.user_id, name: player.name || "会員", programClass: player.program_class ?? null }));
    const authorNames = new Map((playerRows ?? []).map((player) => [player.user_id, player.name || "コーチ名未登録"]));
    calendarItems = items.map((item) => ({ ...item, author_name: item.author_id ? authorNames.get(item.author_id) : undefined }));
    const responsesBySchedule = new Map<number, Map<string, { status: string; comment: string | null }>>();
    for (const row of rosterRows ?? []) {
      const responses = responsesBySchedule.get(row.schedule_id) ?? new Map();
      responses.set(row.user_id, { status: row.status, comment: row.comment });
      responsesBySchedule.set(row.schedule_id, responses);
    }
    attendanceRosters = items.reduce<Record<number, CoachAttendanceRoster>>((rosters, item) => {
      const eligiblePlayers = item.audience === "class" && item.program_class
        ? rosterPlayers.filter((player) => player.programClass === item.program_class)
        : rosterPlayers;
      const responses = responsesBySchedule.get(item.id) ?? new Map();
      const members = eligiblePlayers.map((player) => {
        const response = responses.get(player.id);
        return { ...player, status: response?.status ?? "unanswered", comment: response?.comment ?? null };
      });
      rosters[item.id] = {
        attending: members.filter((member) => member.status === "attending"),
        absent: members.filter((member) => member.status === "absent"),
        undecided: members.filter((member) => member.status === "undecided"),
        unanswered: members.filter((member) => member.status === "unanswered"),
      };
      return rosters;
    }, {});
  }
  const initialEditingId = query.edit && /^\d+$/.test(query.edit) ? Number(query.edit) : null;
  const initialDate = query.newDate && /^\d{4}-\d{2}-\d{2}$/.test(query.newDate) ? query.newDate : undefined;
  const editingItem = initialEditingId ? ownedItems.find((item) => item.id === initialEditingId) : undefined;
  const selectedDate = initialDate ?? (editingItem ? editingItem.starts_at.slice(0, 10) : unansweredOnly ? memberCalendarItems[0]?.starts_at.slice(0, 10) : undefined);
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className={`mx-auto ${isCoach ? "max-w-7xl" : "max-w-3xl"}`}><Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-white/60"><ArrowLeft size={16} />MY PAGE</Link><div className="mt-10 flex flex-wrap items-end justify-between gap-5"><header className="border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-orange-400">SCHEDULE</p><h1 className="mt-3 text-4xl font-black">{unansweredOnly ? "未回答の予定" : "スケジュール"}</h1><p className="mt-3 text-white/55">{isCoach ? "カレンダーを確認しながら、予定を直接追加・編集できます。" : unansweredOnly ? "出欠をまだ回答していない予定だけを表示しています。" : "全体予定と所属クラスの予定を月ごとに確認できます。"}</p></header><Link href="/mypage/my-calendar" className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300 transition hover:bg-emerald-400/15"><CalendarRange size={18}/>マイカレンダーを開く</Link></div>{unansweredOnly ? <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-400/25 bg-orange-400/[.07] p-5"><div><strong className="text-orange-300">未回答 {memberCalendarItems.length}件</strong><p className="mt-1 text-sm text-white/50">回答すると、この画面の一覧から外れます。</p></div><Link href="/mypage/schedules" className="rounded-full border border-white/15 px-4 py-2 text-xs font-black text-white/65 transition hover:border-white/30 hover:text-white">すべての予定を見る</Link></div> : null}{isCoach ? <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]"><div><ScheduleCalendar key={selectedDate ?? "today"} items={calendarItems} periods={[]} applications={(applications ?? []) as CompetitionApplicationItem[]} currentTime={new Date().toISOString()} canManage coachId={userId} initialSelectedDate={selectedDate} attendanceRosters={attendanceRosters}/></div><div id="schedule-management" className="space-y-6 xl:sticky xl:top-20"><CoachScheduleManager key={`${initialEditingId ?? "new"}-${initialDate ?? "none"}`} initialItems={ownedItems} initialTemplates={templates} initialAttendance={attendance} competitionApplicants={competitionApplicants} initialDate={initialDate} initialEditingId={initialEditingId}/></div></div> : <ScheduleCalendar key={unansweredOnly ? selectedDate ?? "unanswered" : "all"} items={memberCalendarItems} periods={[]} applications={(applications ?? []) as CompetitionApplicationItem[]} currentTime={new Date().toISOString()} initialSelectedDate={selectedDate}/>}</div></main>;
}
