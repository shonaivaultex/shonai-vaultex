"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AcceptFamilyInvitation({ token, needsPasswordSetup }: { token: string; needsPasswordSetup: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function linkFamily(setPassword: boolean) {
    setError("");
    const supabase = createClient();
    setLoading(true);
    if (setPassword) {
      if (password.length < 8 || password !== confirmation) {
        setLoading(false);
        setError("8文字以上の同じパスワードを2回入力してください。");
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const metadata = userData.user?.user_metadata ?? {};
      const { error: passwordError } = await supabase.auth.updateUser({ password, data: { ...metadata, family_password_set: true } });
      if (passwordError) {
        setLoading(false);
        setError("パスワードを設定できませんでした。すでにアカウントをお持ちの場合は「パスワードを変更せず連携」を押してください。");
        return;
      }
    }
    const { error: acceptError } = await supabase.rpc("accept_family_invitation", { p_token: token });
    setLoading(false);
    if (acceptError) { setError("招待の期限切れ、使用済み、またはログイン中のメールアドレスが招待先と異なります。"); return; }
    router.replace("/family"); router.refresh();
  }
  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    await linkFamily(needsPasswordSetup);
  }
  return <form onSubmit={accept} className="mt-8 space-y-4">
    {needsPasswordSetup ? <><label className="block text-sm font-bold">パスワード<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-orange-500"/></label>
    <label className="block text-sm font-bold">パスワード（確認）<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-orange-500"/></label></> : null}
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
    <button disabled={loading} className="w-full rounded-xl bg-orange-500 px-5 py-4 text-sm font-black text-black disabled:opacity-50">{loading ? "登録しています…" : needsPasswordSetup ? "パスワードを設定してFAMILYを始める" : "VAULTEX FAMILYをはじめる"}</button>
    {needsPasswordSetup ? <button type="button" disabled={loading} onClick={() => void linkFamily(false)} className="w-full rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-black text-black/65 disabled:opacity-50">すでにアカウントがある方：パスワードを変更せず連携</button> : null}
  </form>;
}
