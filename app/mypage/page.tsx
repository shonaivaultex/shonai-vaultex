import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Activity, ChevronRight, Medal, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";
import NewsPanel, { type NewsItem } from "@/app/components/NewsPanel";
import { eventKindMap } from "@/lib/performance-events";
import SchedulePanel, { type ScheduleItem } from "@/app/components/SchedulePanel";
import PushNotificationButton from "@/app/components/PushNotificationButton";

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
  const recordById = new Map((ownRecords ?? []).map((record) => [record.id, record]));
  const newsItems: NewsItem[] = [
    ...(announcements ?? []).map((item) => ({ id: `announcement-${item.id}`, kind: "announcement" as const, title: item.title, body: item.body, date: item.created_at, important: item.priority === "important", unread: !readIds.has(item.id), announcementId: item.id })),
    ...(unreadFeedback ?? []).map((item) => { const record = recordById.get(item.record_id); const kind = record?.record_kind ?? (record ? eventKindMap[record.category] : "control-test"); const baseHref = kind === "athletics" ? "/mypage/athletics" : kind === "unofficial-athletics" ? "/mypage/unofficial-athletics" : "/mypage/control-tests"; const href = `${baseHref}?feedback=${item.record_id}`; return { id: `feedback-${item.id}`, kind: "feedback" as const, title: `${record?.category ?? "記録"}にフィードバックが届きました`, body: item.body, date: item.created_at, href, unread: true }; }),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "80px auto",
        padding: 20,
      }}
    >
      <h1>MY PAGE</h1>

      {/* プロフィール */}
      <div
        style={{
          marginTop: 30,
          padding: 30,
          borderRadius: 20,
          background: "#111",
          color: "white",
        }}
      >
        <h2>{player.name}</h2>

        <p>
          <strong>GRADE</strong>
          <br />
          {player.grade}
        </p>

        <p>
          <strong>EVENT</strong>
          <br />
          {player.event}
        </p>

        <p>
          <strong>SCHOOL</strong>
          <br />
          {player.school}
        </p>
        <p><strong>VAULTEX CLASS</strong><br />{player.program_class ?? "未選択"}</p>
      </div>

      <NewsPanel initialItems={newsItems} userId={user.id} />
      <PushNotificationButton />
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 24,
        }}
      >
        <Link href="/edit">
          プロフィール編集
        </Link>
        <LogoutButton />
      </div>
    </main>
  );
}
