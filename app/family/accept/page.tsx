import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import AcceptFamilyInvitation from "./AcceptFamilyInvitation";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export default async function FamilyAcceptPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  if (token.length < 32) redirect("/family/welcome?error=invalid");
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect(`/login?next=${encodeURIComponent(`/family/accept?token=${token}`)}`);
  const { data: userData } = await supabase.auth.getUser();
  const currentEmail = userData.user?.email?.trim().toLowerCase() ?? "";
  const metadata = userData.user?.user_metadata as { portal?: string; family_password_set?: boolean } | undefined;
  const needsPasswordSetup = metadata?.portal === "family" && metadata.family_password_set !== true;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data: invitation } = await admin.from("family_invitations").select("athlete_id,email,accepted_at,expires_at").eq("token_hash", tokenHash).maybeSingle();
  const { data: athlete } = invitation ? await admin.from("players").select("name").eq("user_id", invitation.athlete_id).maybeSingle() : { data: null };
  const invitationEmail = invitation?.email.trim().toLowerCase() ?? "";
  const expired = invitation ? new Date(invitation.expires_at) <= new Date() : true;
  const available = Boolean(invitation && !invitation.accepted_at && !expired);
  const emailMatches = Boolean(currentEmail && invitationEmail && currentEmail === invitationEmail);
  const athleteName = athlete?.name?.trim() || "招待された選手";
  return <main className="grid min-h-screen place-items-center bg-[#f5f2ec] px-5 py-24 text-[#151515]"><section className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-7 shadow-xl sm:p-10"><p className="text-[10px] font-black tracking-[.25em] text-orange-600">SHONAI VAULTEX</p><h1 className="mt-3 text-3xl font-black tracking-[-.04em]">VAULTEX FAMILYをはじめる</h1><p className="mt-4 text-sm leading-7 text-black/55">{needsPasswordSetup ? "初めて登録する方はパスワードを設定してください。すでにアカウントをお持ちの方は、パスワードを変更せずそのまま連携できます。" : "現在ログイン中のアカウントを、招待されたお子さまと安全に紐付けます。選手プロフィールの作成は不要です。"}</p><AcceptFamilyInvitation token={token} needsPasswordSetup={needsPasswordSetup} athleteName={athleteName} currentEmail={currentEmail} invitationEmail={invitationEmail} invitationAvailable={available} emailMatches={emailMatches}/></section></main>;
}
