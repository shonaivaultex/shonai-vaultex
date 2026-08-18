import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import AthleteStandardAdmin from "@/app/components/AthleteStandardAdmin";

export const dynamic = "force-dynamic";

export default async function AthleteScanAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/athlete-scan");
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!role) redirect("/mypage");
  if (!hasAdminKey()) return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white"><div className="mx-auto max-w-4xl rounded-2xl border border-red-500/30 p-6"><h1 className="text-2xl font-black">管理用キーが未設定です</h1><p className="mt-3 text-sm text-white/55">VercelのSupabase管理用キー設定を確認してください。</p></div></main>;

  const admin = createAdminClient();
  const { data: currentSet } = await admin.from("athlete_scan_standard_sets").select("version,label").eq("is_current", true).single();
  if (!currentSet) redirect("/coach/dashboard/manage");
  const [{ data: standards }, { data: settings }, { data: scans }, { data: players }, { data: history }] = await Promise.all([
    admin.from("athlete_scan_standards").select("*").eq("standard_version", currentSet.version).order("gender").order("test_code").order("id"),
    admin.from("athlete_scan_type_settings").select("balanced_max_spread,composite_max_gap,type_descriptions").eq("standard_version", currentSet.version).single(),
    admin.from("control_test_scans").select("id,user_id,profile_snapshot,control_test_measurements(test_code,primary_value,metrics,implement_weight_kg,implement_name,equipment,distance_m,jump_count)").eq("status", "complete").order("measured_on", { ascending: false }),
    admin.from("players").select("user_id,name,gender"),
    admin.from("athlete_scan_standard_history").select("*").order("changed_at", { ascending: false }).limit(100),
  ]);

  return <main className="min-h-screen bg-[#090a0c] px-4 pb-24 pt-28 text-white sm:px-8"><div className="mx-auto max-w-7xl">
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><Link href="/coach/dashboard/manage" className="inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55 hover:text-orange-400"><ArrowLeft size={16}/>管理メニューへ戻る</Link><span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[.07] px-3 py-2 text-[10px] font-black text-emerald-300"><ShieldCheck size={14}/>ADMIN ONLY</span></div>
    <AthleteStandardAdmin version={currentSet.version} label={currentSet.label} standards={(standards ?? []) as never} settings={(settings ?? { balanced_max_spread: 5, composite_max_gap: 8, type_descriptions: {} }) as never} scans={(scans ?? []) as never} players={(players ?? []) as never} history={(history ?? []) as never}/>
  </div></main>;
}
