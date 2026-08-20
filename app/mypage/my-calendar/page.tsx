import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import MyCalendar from "@/app/components/MyCalendar";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";

export default async function MyCalendarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/my-calendar");

  const [{ data: entries }, { data: attendance }, { data: applications }, { data: records }] = await Promise.all([
    supabase.from("personal_calendar_entries").select("*").eq("user_id", user.id).order("entry_date"),
    supabase.from("schedule_attendance").select("schedule_id,status").eq("user_id", user.id),
    supabase.from("competition_applications").select("schedule_id,status").eq("user_id", user.id),
    supabase.from("performance_records").select("id,category,value,date,record_kind").eq("user_id", user.id).order("date", { ascending: false }).limit(200),
  ]);

  const activeScheduleIds = new Set<number>();
  (attendance ?? []).forEach((row) => { if (row.status === "attending") activeScheduleIds.add(row.schedule_id); });
  (applications ?? []).forEach((row) => { if (row.status === "submitted") activeScheduleIds.add(row.schedule_id); });
  const savedScheduleIds = (entries ?? []).flatMap((row) => row.schedule_id ? [row.schedule_id] : []);
  const scheduleIds = [...new Set([...activeScheduleIds, ...savedScheduleIds])];
  const { data: schedules } = scheduleIds.length
    ? await supabase.from("schedules").select("id,title,details,location,starts_at,ends_at,all_day,schedule_type").in("id", scheduleIds)
    : { data: [] };

  const videoPaths = (entries ?? []).flatMap((row) => row.video_path ? [row.video_path] : []);
  const { data: signedVideos } = videoPaths.length
    ? await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).createSignedUrls(videoPaths, 3600)
    : { data: [] };
  const videoUrls = new Map((signedVideos ?? []).map((item, index) => [videoPaths[index], item.signedUrl]));
  const enrichedEntries = (entries ?? []).map((row) => ({ ...row, video_url: row.video_path ? videoUrls.get(row.video_path) ?? null : null }));

  return <main className="min-h-screen bg-[#090a0c] px-4 pb-24 pt-28 text-white sm:px-8">
    <div className="mx-auto max-w-7xl">
      <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[.14em] text-white/55"><ArrowLeft size={16}/>MY PAGE</Link>
      <header className="mt-8 border-l-2 border-orange-500 pl-5">
        <p className="text-xs font-black tracking-[.22em] text-orange-400">MY CALENDAR</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.04em] sm:text-5xl">自分の競技生活を残す</h1>
        <p className="mt-3 max-w-2xl leading-7 text-white/55">クラブ予定と、学校・自主練習・休養を一つのカレンダーで管理できます。日誌、動画、記録も自分だけに保存されます。</p>
      </header>
      <MyCalendar userId={user.id} initialEntries={enrichedEntries} schedules={schedules ?? []} activeScheduleIds={[...activeScheduleIds]} records={records ?? []}/>
    </div>
  </main>;
}
