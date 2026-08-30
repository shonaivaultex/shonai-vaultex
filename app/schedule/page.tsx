import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Clock3, LockKeyhole, MapPin, Users } from "lucide-react";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";

export const metadata: Metadata = {
  title: "スケジュール",
  description: "SHONAI VAULTEXの練習・大会・測定予定をご案内します。",
};

export const revalidate = 300;

type PublicSchedule = {
  id: number;
  title: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  schedule_type: string;
  audience: string;
  program_class: string | null;
};

const typeLabels: Record<string, string> = {
  practice: "練習",
  competition: "大会",
  measurement: "測定",
  other: "その他",
};

function dateKey(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function dateLabel(item: PublicSchedule) {
  const start = new Date(item.starts_at);
  const startDate = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(start);
  if (item.all_day) return `${startDate}・終日`;
  const startTime = start.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  });
  const endTime = item.ends_at
    ? new Date(item.ends_at).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Tokyo",
      })
    : null;
  return `${startDate}・${startTime}${endTime ? `〜${endTime}` : ""}`;
}

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
  return (data ?? []) as PublicSchedule[];
}

export default async function PublicSchedulePage() {
  const schedules = await getSchedules();
  const groups = schedules.reduce<Map<string, PublicSchedule[]>>((result, item) => {
    const key = dateKey(item.starts_at);
    result.set(key, [...(result.get(key) ?? []), item]);
    return result;
  }, new Map());

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

        <div className="mt-12 space-y-12">
          {groups.size ? Array.from(groups.entries()).map(([month, items]) => (
            <section key={month}>
              <div className="flex items-center gap-3 border-b border-white/15 pb-4">
                <CalendarDays size={19} className="text-orange-400" />
                <h2 className="text-xl font-black">{month}</h2>
                <span className="text-xs font-bold text-white/35">{items.length}件</span>
              </div>
              <div className="divide-y divide-white/10">
                {items.map((item) => (
                  <article key={item.id} className="grid gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-orange-400/25 bg-orange-400/10 px-2.5 py-1 text-[10px] font-black text-orange-300">{typeLabels[item.schedule_type] ?? "予定"}</span>
                        <span className="flex items-center gap-1 text-xs font-bold text-white/40"><Users size={13} />{item.audience === "all" ? "全クラス" : item.program_class ?? "クラス別"}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-black sm:text-xl">{item.title}</h3>
                    </div>
                    <div className="space-y-2 text-sm text-white/60 sm:min-w-64">
                      <p className="flex items-center gap-2"><Clock3 size={15} className="text-orange-400" />{dateLabel(item)}</p>
                      <p className="flex items-center gap-2"><MapPin size={15} className="text-orange-400" />{item.location || "場所は調整中"}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )) : (
            <div className="rounded-2xl border border-white/10 bg-white/[.025] px-6 py-16 text-center">
              <CalendarDays className="mx-auto text-white/25" size={36} />
              <p className="mt-5 font-black">現在、公開中の予定はありません。</p>
              <p className="mt-2 text-sm text-white/45">新しい予定が決まり次第、こちらでご案内します。</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
