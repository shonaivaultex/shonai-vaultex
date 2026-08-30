"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AcceptFamilyInvitation({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    if (password.length < 8 || password !== confirmation) { setError("8文字以上の同じパスワードを2回入力してください。"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: passwordError } = await supabase.auth.updateUser({ password });
    if (passwordError) { setLoading(false); setError("パスワードを設定できませんでした。招待リンクからもう一度お試しください。"); return; }
    const { error: acceptError } = await supabase.rpc("accept_family_invitation", { p_token: token });
    setLoading(false);
    if (acceptError) { setError("招待の期限切れ、使用済み、またはメールアドレスの不一致です。"); return; }
    router.replace("/family"); router.refresh();
  }
  return <form onSubmit={accept} className="mt-8 space-y-4">
    <label className="block text-sm font-bold">パスワード<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-orange-500"/></label>
    <label className="block text-sm font-bold">パスワード（確認）<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-orange-500"/></label>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p> : null}
    <button disabled={loading} className="w-full rounded-xl bg-orange-500 px-5 py-4 text-sm font-black text-black disabled:opacity-50">{loading ? "登録しています…" : "VAULTEX FAMILYをはじめる"}</button>
  </form>;
}
