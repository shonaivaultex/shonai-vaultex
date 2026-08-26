import Link from "next/link";
import { ArrowLeft, Bot, ChevronRight, MessageCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function ConsultPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/consult");

  return <main className="min-h-screen bg-[#090a0c] px-4 pb-28 pt-28 text-white sm:px-8">
    <div className="mx-auto max-w-4xl">
      <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55"><ArrowLeft size={16}/>ホームへ戻る</Link>
      <header className="mt-8 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[.22em] text-orange-400">CONSULTATION</p><h1 className="mt-2 text-4xl font-black">相談する</h1><p className="mt-3 max-w-xl leading-7 text-white/55">相談したい内容に合わせて、コーチかVAULTEX AIを選べます。</p></header>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link href="/mypage/video-feedback" className="group rounded-3xl border border-sky-400/35 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,.18),transparent_48%),#111] p-6 transition hover:border-sky-300"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-400/15 text-sky-300"><MessageCircle size={24}/></span><p className="mt-6 text-[10px] font-black tracking-[.18em] text-sky-300">COACH</p><h2 className="mt-1 text-2xl font-black">コーチに相談</h2><p className="mt-3 text-sm leading-6 text-white/50">動きを見てほしい、個別に相談したい時はこちら。文章・画像・動画を送れます。</p><span className="mt-6 flex items-center justify-between font-black text-sky-300">相談を始める<ChevronRight size={19} className="transition group-hover:translate-x-1"/></span></Link>
        <Link href="/mypage/ai-navigator" className="group rounded-3xl border border-orange-500/35 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,.18),transparent_48%),#111] p-6 transition hover:border-orange-400"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-500/15 text-orange-300"><Bot size={24}/></span><p className="mt-6 text-[10px] font-black tracking-[.18em] text-orange-300">VAULTEX AI</p><h2 className="mt-1 text-2xl font-black">AIと整理する</h2><p className="mt-3 text-sm leading-6 text-white/50">競技の悩みや使い方を一緒に整理し、次に見る記録や行動を決めたい時はこちら。</p><span className="mt-6 flex items-center justify-between font-black text-orange-300">AIに相談する<ChevronRight size={19} className="transition group-hover:translate-x-1"/></span></Link>
      </div>
    </div>
  </main>;
}
