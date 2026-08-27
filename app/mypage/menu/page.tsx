import Link from "next/link";
import { Activity, ArrowLeft, BarChart3, CalendarDays, ChevronRight, Medal, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import MypageSettings from "@/app/components/MypageSettings";

const links = [
  { href: "/mypage/growth-report", label: "成長レポート", note: "記録推移・PB・意識", icon: BarChart3 },
  { href: "/mypage/ranking", label: "ランキング", note: "クラス別・全体", icon: Trophy },
  { href: "/mypage/control-tests", label: "CONTROL TEST", note: "SCAN履歴・身体能力", icon: Activity },
  { href: "/mypage/athletics", label: "本番記録", note: "大会記録・詳細", icon: Medal },
  { href: "/mypage/unofficial-athletics", label: "練習記録", note: "意識・動画・振り返り", icon: Medal },
  { href: "/mypage/schedules", label: "全体スケジュール", note: "クラブ予定・出欠", icon: CalendarDays },
];

export default async function MypageMenuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/menu");
  return <main className="min-h-screen bg-[#090a0c] px-4 pb-28 pt-28 text-white sm:px-8"><div className="mx-auto max-w-4xl">
    <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55"><ArrowLeft size={16}/>ホームへ戻る</Link>
    <header className="mt-8 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[.22em] text-orange-400">MORE</p><h1 className="mt-2 text-4xl font-black">その他</h1><p className="mt-3 text-white/55">記録の振り返り、設定、ヘルプをまとめています。</p></header>
    <section className="mt-8 grid gap-2 sm:grid-cols-2">{links.map(({href,label,note,icon:Icon})=><Link key={href} href={href} className="flex min-h-20 items-center gap-4 rounded-2xl border border-white/10 bg-[#111] px-5 transition hover:border-orange-500/35"><Icon size={20} className="text-orange-300"/><span><strong className="block">{label}</strong><span className="mt-1 block text-xs text-white/35">{note}</span></span><ChevronRight size={17} className="ml-auto text-white/25"/></Link>)}</section>
    <MypageSettings/>
  </div></main>;
}
