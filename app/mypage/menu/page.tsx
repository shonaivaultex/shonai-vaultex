import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ChevronRight,
  Medal,
  Trophy,
  Video,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import MypageSettings from "@/app/components/MypageSettings";

const links = [
  { href: "/performance", label: "記録を追加", note: "練習・大会・CTの記録", icon: Medal },
  { href: "/mypage/checkins", label: "体調の履歴", note: "これまでの状態を確認", icon: Activity },
  {
    href: "/mypage/growth-report",
    label: "成長レポート",
    note: "記録推移・PB・意識",
    icon: BarChart3,
  },
  {
    href: "/mypage/ranking",
    label: "ランキング",
    note: "クラス別・全体",
    icon: Trophy,
  },
  {
    href: "/mypage/control-tests",
    label: "CONTROL TEST",
    note: "SCAN履歴・身体能力",
    icon: Activity,
  },
  {
    href: "/mypage/athletics",
    label: "本番記録",
    note: "大会記録・詳細",
    icon: Medal,
  },
  {
    href: "/mypage/unofficial-athletics",
    label: "練習記録",
    note: "意識・動画・振り返り",
    icon: Medal,
  },
  {
    href: "/mypage/videos",
    label: "マイ動画",
    note: "日付別に再生・端末へ保存",
    icon: Video,
  },
  {
    href: "/mypage/schedules",
    label: "クラブ予定・申込み",
    note: "参加日を選ぶ・申込み・キャンセル",
    icon: CalendarDays,
  },
];

export default async function MypageMenuPage({
  searchParams,
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const [supabase, query] = await Promise.all([createClient(), searchParams]);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/menu");
  const { data: lineConnection } = await supabase
    .from("line_account_connections")
    .select(
      "display_name,notify_important,notify_schedule,notify_feedback,notify_training_log_reminder,notify_attendance_reminder",
    )
    .eq("user_id", user.id)
    .eq("portal", "athlete")
    .maybeSingle();
  return (
    <main className="min-h-screen bg-[#090a0c] px-4 pb-28 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/mypage"
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55"
        >
          <ArrowLeft size={16} />
          ホームへ戻る
        </Link>
        <header className="mt-8 border-l-2 border-orange-500 pl-5">
          <p className="text-xs font-black tracking-[.22em] text-orange-400">
            MORE
          </p>
          <h1 className="mt-2 text-4xl font-black">その他</h1>
          <p className="mt-3 text-white/55">
            記録の振り返り、設定、ヘルプをまとめています。
          </p>
        </header>
        <section className="mt-8 grid gap-3 sm:grid-cols-2" aria-label="予定と相談">
          <Link href="/mypage/my-calendar" className="rounded-2xl border border-emerald-400/30 bg-[#111] p-5"><strong>自分の予定</strong><p className="mt-2 text-sm text-white/60">申込み済みのクラブ予定と個人予定をまとめて確認・編集</p></Link>
          <Link href="/mypage/schedules" className="rounded-2xl border border-orange-400/30 bg-[#111] p-5"><strong>クラブ予定・申込み</strong><p className="mt-2 text-sm text-white/60">参加日を選ぶ・申込み・キャンセル</p></Link>
          <Link href="/mypage/video-feedback" className="rounded-2xl border border-white/10 bg-[#111] p-5"><strong>コーチに相談する</strong><p className="mt-2 text-sm text-white/60">文章・画像・動画で個別に相談</p></Link>
          <Link href="/mypage/ai-navigator" className="rounded-2xl border border-white/10 bg-[#111] p-5"><strong>AIと整理する</strong><p className="mt-2 text-sm text-white/60">悩みや使い方を整理する補助機能</p></Link>
        </section>
        <details className="mt-6 rounded-2xl border border-white/10 p-5">
          <summary className="cursor-pointer font-bold">記録・振り返り<span className="mt-1 block text-xs font-normal text-white/50">記録、動画、成長レポート、ランキング（任意）</span></summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {links.filter(({ href }) => href !== "/mypage/schedules").map(({ href, label, note, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-20 items-center gap-4 rounded-2xl border border-white/10 bg-[#111] px-5 transition hover:border-orange-500/35"
            >
              <Icon size={20} className="text-orange-300" />
              <span>
                <strong className="block">{label}</strong>
                <span className="mt-1 block text-xs text-white/35">{note}</span>
              </span>
              <ChevronRight size={17} className="ml-auto text-white/25" />
            </Link>
          ))}
        </div>
        </details>
        <MypageSettings
          defaultOpen={query.settings === "1"}
          lineConnection={lineConnection}
          lineConfigured={Boolean(
            process.env.LINE_LOGIN_CHANNEL_ID &&
              process.env.LINE_LOGIN_CHANNEL_SECRET,
          )}
        />
      </div>
    </main>
  );
}
