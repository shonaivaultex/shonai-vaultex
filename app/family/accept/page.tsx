import { redirect } from "next/navigation";
import AcceptFamilyInvitation from "./AcceptFamilyInvitation";
import { createClient } from "@/lib/supabase-server";

export default async function FamilyAcceptPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  if (token.length < 32) redirect("/family/welcome?error=invalid");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect(`/login?next=${encodeURIComponent(`/family/accept?token=${token}`)}`);
  return <main className="grid min-h-screen place-items-center bg-[#f5f2ec] px-5 py-24 text-[#151515]"><section className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-7 shadow-xl sm:p-10"><p className="text-[10px] font-black tracking-[.25em] text-orange-600">SHONAI VAULTEX</p><h1 className="mt-3 text-3xl font-black tracking-[-.04em]">VAULTEX FAMILYをはじめる</h1><p className="mt-4 text-sm leading-7 text-black/55">ご家族ご本人のパスワードを設定すると、招待されたお子さまと安全に紐付きます。選手IDの入力は不要です。</p><AcceptFamilyInvitation token={token}/></section></main>;
}
