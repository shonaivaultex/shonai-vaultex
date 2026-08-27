import Link from "next/link";
import { ArrowLeft, CalendarDays, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import MyCalendar from "@/app/components/MyCalendar";
import type { SchedulePeriod } from "@/lib/schedule-periods";

export default async function MyCalendarPage({ searchParams }: { searchParams: Promise<{ period?: string; periodDate?: string; date?: string; new?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;
  if (!userId) redirect("/login?next=/mypage/my-calendar");

  const [{ data: entries }, { data: attendance }, { data: applications }, { data: records }, { data: scans }, { data: periodRows }, { data: activeGoal }, { data: goalHistory }, { data: inputHistory }] = await Promise.all([
    supabase.from("personal_calendar_entries").select("*").eq("user_id", userId).order("entry_date"),
    supabase.from("schedule_attendance").select("schedule_id,status").eq("user_id", userId),
    supabase.from("competition_applications").select("schedule_id,status").eq("user_id", userId),
    supabase.from("performance_records").select("id,category,value,wind_speed,date,record_kind,awareness_categories,awareness_note,video_path,advanced_details,performance_record_details(id,detail_type,sequence_number,round_name,value,wind_speed,place,status)").eq("user_id", userId).order("date", { ascending: false }).limit(500),
    supabase.from("control_test_scans").select("id,scan_number,measured_on,control_test_measurements(test_code,primary_value,performance_record_id)").eq("user_id", userId).eq("status", "complete").order("measured_on", { ascending: false }).limit(100),
    supabase.from("schedule_periods").select("*").eq("author_id", userId).order("starts_on"),
    supabase.from("personal_calendar_goals").select("*").eq("user_id", userId).eq("status", "active").maybeSingle(),
    supabase.from("personal_calendar_goals").select("*").eq("user_id", userId).neq("status", "active").order("target_date", { ascending: false }).limit(50),
    supabase.from("personal_calendar_input_history").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(30),
  ]);

  const activeScheduleIds = new Set<number>();
  (attendance ?? []).forEach((row) => { if (row.status === "attending") activeScheduleIds.add(row.schedule_id); });
  (applications ?? []).forEach((row) => { if (row.status === "submitted") activeScheduleIds.add(row.schedule_id); });
  const savedScheduleIds = (entries ?? []).flatMap((row) => row.schedule_id ? [row.schedule_id] : []);
  const scheduleIds = [...new Set([...activeScheduleIds, ...savedScheduleIds])];
  const { data: schedules } = scheduleIds.length
    ? await supabase.from("schedules").select("id,title,details,location,starts_at,ends_at,all_day,schedule_type").in("id", scheduleIds)
    : { data: [] };

  const recordIds = (records ?? []).map((record) => record.id);
  const { data: feedbackRequests } = recordIds.length
    ? await supabase.from("feedback_requests").select("id,record_id,request_type,message,priority,status").in("record_id", recordIds).eq("status", "pending")
    : { data: [] };
  const feedbackRequestByRecord = new Map((feedbackRequests ?? []).map((request) => [request.record_id, request]));

  const enrichedEntries = (entries ?? []).map((row) => ({ ...row, video_url: null }));
  const enrichedRecords = (records ?? []).map((row) => ({ ...row, video_url: null, feedback_request: feedbackRequestByRecord.get(row.id) ?? null }));
  const periods = (periodRows ?? []) as SchedulePeriod[];
  const initialPeriodId = query.period && /^\d+$/.test(query.period) ? Number(query.period) : null;
  const initialPeriodDate = query.periodDate && /^\d{4}-\d{2}-\d{2}$/.test(query.periodDate) ? query.periodDate : undefined;
  const initialSelectedDate = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : undefined;

  return <main className="min-h-screen bg-[#090a0c] px-4 pb-24 pt-28 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-white/55"><ArrowLeft size={16}/>MY PAGE</Link>
      <header className="mt-8 border-l-2 border-orange-500 pl-5">
        <p className="text-xs font-black tracking-[.22em] text-orange-400">MY CALENDAR</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.04em] sm:text-5xl">自分の競技生活を残す</h1>
        <p className="mt-3 max-w-2xl leading-7 text-white/55">クラブ予定と、学校・自主練習・休養を一つのカレンダーで管理できます。登録した練習記録・意識・動画は、実施日のカレンダーへ自動で反映されます。</p>
      </header>
      <nav className="mt-6 grid gap-2 sm:grid-cols-2" aria-label="カレンダー切り替え">
        <div className="rounded-2xl border border-emerald-400/45 bg-emerald-400/10 p-4 text-emerald-200"><span className="flex items-center gap-2 text-sm font-black"><CalendarDays size={18}/>マイカレンダー</span><span className="mt-1 block text-xs text-white/45">自分の予定・練習日誌・目標</span></div>
        <Link href="/mypage/schedules" className="rounded-2xl border border-white/10 bg-[#111] p-4 text-white transition hover:border-orange-400/45"><span className="flex items-center gap-2 text-sm font-black"><Users size={18} className="text-orange-400"/>全体スケジュール</span><span className="mt-1 block text-xs text-white/45">クラブ予定・大会・出欠を確認</span></Link>
      </nav>
      <MyCalendar userId={userId} initialEntries={enrichedEntries} schedules={schedules ?? []} activeScheduleIds={[...activeScheduleIds]} records={enrichedRecords} scans={(scans ?? []).map((scan) => ({ id: scan.id, scan_number: scan.scan_number, measured_on: scan.measured_on, measurements: scan.control_test_measurements ?? [] }))} periods={periods} initialGoal={activeGoal} goalHistory={goalHistory ?? []} initialInputHistory={inputHistory ?? []} initialOpen={query.new === "1"} initialSelectedDate={initialSelectedDate} initialPeriodId={initialPeriodId} initialPeriodDate={initialPeriodDate}/>
    </div>
  </main>;
}
