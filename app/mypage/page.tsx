import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ParticipationHome from "@/app/components/ParticipationHome";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import LogoutButton from "@/app/components/LogoutButton";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;
  if (!userId) redirect("/login?next=/mypage");

  const [profile, role] = await Promise.all([
    supabase.from("players").select("name,program_class").eq("user_id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "coach").maybeSingle(),
  ]);
  if (profile.error || role.error) throw new Error("登録情報を取得できませんでした。もう一度お試しください。");
  if (!profile.data) redirect("/profile/create");

  if (role.data) return <main className="mx-auto min-h-screen max-w-3xl px-5 pb-28 pt-28 text-white">
    <p className="text-sm text-white/60">{profile.data.name}さん</p>
    <h1 className="mt-2 text-3xl font-black">クラブの予定を管理</h1>
    <p className="mt-3 text-sm text-white/60">開催日と参加者の確認から始めましょう。</p>
    <Link href="/mypage/schedules" className="mt-8 block rounded-2xl bg-orange-500 p-6 text-black"><strong className="text-xl">開催予定・参加者を確認する →</strong><p className="mt-2 text-sm">全クラスの確認・予定の追加・編集</p></Link>
    <a href="https://manager.line.biz/" className="mt-4 block rounded-2xl border border-emerald-400/30 p-5 text-emerald-300">公式LINEで相談に返信する →</a>
    <details className="mt-8 rounded-xl border border-white/15 p-4"><summary className="cursor-pointer">その他の管理・記録</summary><div className="mt-4 grid gap-4"><Link href="/coach/dashboard">コーチ管理画面</Link><Link href="/coach/performance-session">記録・動画を登録</Link><Link href="/mypage/menu">機能一覧・設定</Link></div></details>
    <div className="mt-8"><LogoutButton /></div>
  </main>;

  const now = new Date().toISOString();
  const [scheduleResult, attendanceResult] = await Promise.all([
    supabase.from("schedules").select("*").in("schedule_type", ["practice", "measurement"]).eq("is_personal_slot", false).or(`starts_at.gte.${now},ends_at.gte.${now}`).order("starts_at").limit(100),
    supabase.from("schedule_attendance").select("schedule_id,status").eq("user_id", userId),
  ]);
  if (scheduleResult.error || attendanceResult.error) throw new Error("予定を取得できませんでした。再読み込みしてお試しください。");
  const programClass = profile.data.program_class;
  const attendingIds = (attendanceResult.data ?? []).filter((row) => row.status === "attending").map((row) => row.schedule_id);
  const items = (scheduleResult.data as ScheduleItem[]).filter((item) => attendingIds.includes(item.id) || item.audience === "all" || (Boolean(programClass) && item.program_class === programClass));
  return <ParticipationHome name={profile.data.name || "会員"} items={items} attendingIds={attendingIds} />;
}
