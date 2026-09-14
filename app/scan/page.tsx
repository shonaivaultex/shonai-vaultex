import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardCheck, Users } from "lucide-react";
import { createClient } from "@/lib/supabase-server";

export default async function ScanLanding() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  return <main className="px-5 pb-24 pt-28 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-black tracking-[.28em] text-emerald-400">VAULTEX PERFORMANCE SYSTEM</p>
      <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[.92] tracking-[-.06em] sm:text-8xl">VAULTEX<br/><span className="text-orange-500">SCAN</span></h1>
      <p className="mt-7 max-w-2xl text-lg leading-8 text-white/60">部活動のCONTROL TESTを、名簿作成から一括測定、成長の確認まで。生徒のメール登録なしですぐに始められます。</p>
      <Link href={auth?.claims.sub?"/scan/dashboard":"/login?next=/scan/dashboard"} className="mt-8 inline-flex items-center gap-3 rounded-full bg-orange-500 px-7 py-4 font-black text-black">{auth?.claims.sub?"チーム管理を開く":"顧問として始める"}<ArrowRight size={19}/></Link>
      <section className="mt-20 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 sm:grid-cols-3">
        {[[Users,"名簿をつくる","生徒のアカウント登録は不要。学年・種目と一緒に管理。"],[ClipboardCheck,"その場で測る","スマホで選手を切り替えながら試技を連続入力。"],[BarChart3,"変化をみる","ベスト記録と前回からの変化を種目ごとに確認。"]].map(([Icon,title,body])=><div key={String(title)} className="bg-[#0e1110] p-7 sm:p-9"><Icon className="text-emerald-400"/><h2 className="mt-8 text-xl font-black">{String(title)}</h2><p className="mt-3 text-sm leading-6 text-white/45">{String(body)}</p></div>)}
      </section>
    </div>
  </main>;
}
