import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, LockKeyhole } from "lucide-react";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import PublicScheduleCalendar, { type PublicScheduleItem } from "@/app/components/PublicScheduleCalendar";

export const metadata: Metadata = {
  title: "スケジュール",
  description: "SHONAI VAULTEXの練習・大会・測定予定をご案内します。",
};

export const revalidate = 300;

async function getSchedules() {
  if (!hasAdminKey()) return [];
  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 6);
  const { data } = await createAdminClient()
    .from("schedules")
    .select("id,title,location,starts_at,ends_at,all_day,schedule_type,audience,program_class")
    .or(`starts_at.gte.${now.toISOString()},ends_at.gte.${now.toISOString()}`)
    .lt("starts_at", end.toISOString())
    .order("starts_at")
    .limit(100);
  return (data ?? []) as PublicScheduleItem[];
}

export default async function PublicSchedulePage() {
  const schedules = await getSchedules();

  return (
    <main className="min-h-screen bg-[#090a0c] px-5 pb-24 pt-32 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="border-l-2 border-orange-500 pl-5">
          <p className="text-xs font-black tracking-[0.22em] text-orange-400">PUBLIC SCHEDULE</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">スケジュール</h1>
          <p className="mt-4 max-w-2xl leading-7 text-white/60">
            一般の方もご覧いただける、今後6か月の活動予定です。内容は変更になる場合があります。
          </p>
        </header>

        <div className="mt-10 rounded-2xl border border-orange-400/25 bg-orange-400/[.06] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-orange-300"><LockKeyhole size={17} />会員の方へ</p>
            <p className="mt-2 text-sm leading-6 text-white/55">出欠回答・大会申込・個人予定はマイページで確認できます。</p>
          </div>
          <Link href="/mypage/schedules" className="mt-4 inline-flex rounded-full bg-orange-500 px-5 py-3 text-xs font-black text-black transition hover:bg-orange-400 sm:mt-0">会員用スケジュール</Link>
        </div>

        {schedules.length ? <PublicScheduleCalendar items={schedules} /> : (
          <div className="mt-12">
            <div className="rounded-2xl border border-white/10 bg-white/[.025] px-6 py-16 text-center">
              <CalendarDays className="mx-auto text-white/25" size={36} />
              <p className="mt-5 font-black">現在、公開中の予定はありません。</p>
              <p className="mt-2 text-sm text-white/45">新しい予定が決まり次第、こちらでご案内します。</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
