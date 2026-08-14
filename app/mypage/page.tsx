import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Activity, BookOpen, CalendarDays, ChevronDown, ChevronRight, Download, Medal, Plus, Settings, Trophy, Video } from "lucide-react";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import NewsPanel, { type NewsItem } from "@/app/components/NewsPanel";
import { eventKindMap } from "@/lib/performance-events";
import SchedulePanel, { type ScheduleItem } from "@/app/components/SchedulePanel";
import PushNotificationButton from "@/app/components/PushNotificationButton";
import BugReportButton from "@/app/components/BugReportButton";

export default async function MyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mypage");
  }

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!player) {
    redirect("/profile/create");
  }

  const { data: coachRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "coach")
    .maybeSingle();
  const { data: schedules } = await supabase.from("schedules").select("*").gte("starts_at", new Date().toISOString()).order("starts_at").limit(2);

  const { data: announcements } = await supabase.from("announcements").select("id, title, body, priority, created_at").order("created_at", { ascending: false }).limit(10);
  const announcementIds = (announcements ?? []).map((item) => item.id);
  const { data: readRows } = announcementIds.length ? await supabase.from("announcement_reads").select("announcement_id").eq("user_id", user.id).in("announcement_id", announcementIds) : { data: [] };
  const readIds = new Set((readRows ?? []).map((item) => item.announcement_id));
  const { data: ownRecords } = await supabase.from("performance_records").select("id, category, record_kind").eq("user_id", user.id);
  const ownRecordIds = (ownRecords ?? []).map((item) => item.id);
  const { data: unreadFeedback } = ownRecordIds.length ? await supabase.from("coach_feedback").select("id, record_id, body, created_at").in("record_id", ownRecordIds).is("acknowledged_at", null).order("created_at", { ascending: false }).limit(10) : { data: [] };
  const { data: videoRequests } = await supabase.from("video_feedback_requests").select("id, event_name").eq("user_id", user.id);
  const videoRequestIds = (videoRequests ?? []).map((item) => item.id);
  const { data: videoMessages } = videoRequestIds.length ? await supabase.from("video_feedback_messages").select("id, request_id, body, created_at").in("request_id", videoRequestIds).eq("sender_role", "coach").order("created_at", { ascending: false }).limit(10) : { data: [] };
  const videoMessageIds = (videoMessages ?? []).map((item) => item.id);
  const { data: videoMessageReads } = videoMessageIds.length ? await supabase.from("video_feedback_message_reads").select("message_id").eq("user_id", user.id).in("message_id", videoMessageIds) : { data: [] };
  const readVideoMessageIds = new Set((videoMessageReads ?? []).map((item) => item.message_id));
  const videoRequestMap = new Map((videoRequests ?? []).map((item) => [item.id, item]));
  const recordById = new Map((ownRecords ?? []).map((record) => [record.id, record]));
  const newsItems: NewsItem[] = [
    ...(announcements ?? []).map((item) => ({ id: `announcement-${item.id}`, kind: "announcement" as const, title: item.title, body: item.body, date: item.created_at, important: item.priority === "important", unread: !readIds.has(item.id), announcementId: item.id })),
    ...(unreadFeedback ?? []).map((item) => { const record = recordById.get(item.record_id); const kind = record?.record_kind ?? (record ? eventKindMap[record.category] : "control-test"); const baseHref = kind === "athletics" ? "/mypage/athletics" : kind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests"; const href = `${baseHref}?feedback=${item.record_id}`; return { id: `feedback-${item.id}`, kind: "feedback" as const, title: `${record?.category ?? "記録"}にフィードバックが届きました`, body: item.body, date: item.created_at, href, unread: true }; }),
    ...(videoMessages ?? []).map((item) => ({ id: `video-message-${item.id}`, kind: "feedback" as const, title: `${videoRequestMap.get(item.request_id)?.event_name ?? "動画"}に返信が届きました`, body: item.body, date: item.created_at, href: "/mypage/video-feedback", unread: !readVideoMessageIds.has(item.id), videoMessageId: item.id })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "80px auto",
        padding: 20,
      }}
    >
      <h1 className="text-3xl font-black">MY PAGE</h1>

      {/* プロフィール */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-[#111] p-5 text-white">
        <h2 className="text-xl font-black">{player.name}</h2>
        <p className="mt-2 text-sm text-white/50">{player.program_class ?? "クラス未選択"} ・ {player.grade ?? "学年未設定"}</p>
        <p className="mt-1 text-sm text-white/50">{player.event ?? "種目未設定"}</p>
      </div>

      <section className="mt-6">
        <p className="mb-3 text-xs font-black tracking-[0.16em] text-orange-400">QUICK ACTION</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/performance" className="flex items-center gap-3 rounded-2xl bg-orange-500 p-4 font-black text-black transition hover:bg-orange-400 sm:flex-col sm:justify-center sm:text-center"><Plus size={22} /><span>記録を追加</span></Link>
          <Link href="/mypage/video-feedback" className="flex items-center gap-3 rounded-2xl border border-sky-500/45 bg-sky-500/[0.09] p-4 font-black text-white transition hover:border-sky-400 sm:flex-col sm:justify-center sm:text-center"><Video size={22} className="text-sky-400" /><span>動画を送る</span></Link>
          <Link href="/mypage/schedules" className="flex items-center gap-3 rounded-2xl border border-white/15 bg-[#111] p-4 font-black text-white transition hover:border-orange-500/50 sm:flex-col sm:justify-center sm:text-center"><CalendarDays size={22} className="text-orange-400" /><span>予定を見る</span></Link>
        </div>
      </section>

      <NewsPanel initialItems={newsItems} userId={user.id} />
      <SchedulePanel items={(schedules ?? []) as ScheduleItem[]} />
      <h2 style={{ marginTop: 40, marginBottom: 20 }}>PERFORMANCE</h2>
      {coachRole && <Link href="/coach/dashboard" className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-500/50 bg-emerald-500/10 p-5 text-white transition hover:border-emerald-400"><span><strong className="block text-lg">コーチダッシュボード</strong><span className="mt-1 block text-sm text-white/50">担当選手の確認・フィードバック</span></span><ChevronRight className="text-emerald-400" /></Link>}
      <div style={{ display: "grid", gap: 14 }}>
        <Link href="/mypage/control-tests" className="group flex items-center gap-4 rounded-2xl border border-orange-500/60 bg-[#111] p-5 text-white no-underline transition hover:border-orange-400">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Activity aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">コントロールテスト</strong><span className="mt-1 block text-sm text-white/50">スプリント・ジャンプ・筋力</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/mypage/athletics" className="group flex items-center gap-4 rounded-2xl border border-orange-500/60 bg-[#111] p-5 text-white no-underline transition hover:border-orange-400">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Trophy aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">陸上競技記録</strong><span className="mt-1 block text-sm text-white/50">大会・記録会・自己ベスト</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/mypage/unofficial-athletics" className="group flex items-center gap-4 rounded-2xl border border-orange-500/60 bg-[#111] p-5 text-white no-underline transition hover:border-orange-400">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Medal aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">非公認陸上競技記録</strong><span className="mt-1 block text-sm text-white/50">練習跳躍・練習投擲・実践練習</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>

      <details className="group mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#111] text-white open:border-orange-500/35">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 marker:hidden"><Settings size={19} className="text-white/45" /><strong>その他</strong><span className="text-xs text-white/35">設定・保存・ヘルプ</span><ChevronDown size={18} className="ml-auto text-white/40 transition group-open:rotate-180" /></summary>
        <div className="border-t border-white/10 p-4">
          <PushNotificationButton />
          <a href="/api/performance/export" download className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-sm text-white/75 transition hover:border-orange-500/40 hover:text-white"><span className="flex items-center gap-2 font-bold"><Download size={17} className="text-orange-400" />記録データをCSVで保存</span><span className="text-xs text-white/35">バックアップ</span></a>
          <a href="/member-manual.pdf" target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm text-white/75"><span className="flex items-center gap-2 font-bold"><BookOpen size={17} className="text-orange-400" />使用マニュアル</span><ChevronRight size={16} /></a>
          <BugReportButton />
          <Link href="/edit" className="mt-3 block rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/70">プロフィール編集</Link>
        </div>
      </details>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 24,
        }}
      >
        <span />
        <LogoutButton />
      </div>
    </main>
  );
}
