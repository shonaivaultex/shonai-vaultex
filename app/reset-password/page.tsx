"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const router = useRouter(); const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [checking, setChecking] = useState(true); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace("/forgot-password"); else setChecking(false); }); }, [router]);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); if (password.length < 8) { setError("パスワードは8文字以上で入力してください。"); return; } if (password !== confirmation) { setError("確認用パスワードが一致していません。"); return; }
    setLoading(true); const { error: updateError } = await createClient().auth.updateUser({ password }); setLoading(false); if (updateError) { setError("再設定リンクの有効期限が切れている可能性があります。もう一度メールを送信してください。"); return; } router.replace("/mypage"); router.refresh();
  }
  if (checking) return <main className="grid min-h-[70vh] place-items-center pt-24 text-sm text-white/45">確認中…</main>;
  return <main className="relative grid min-h-[calc(100vh-5rem)] place-items-center overflow-hidden px-5 pb-20 pt-32"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.16),transparent_32%)]" /><section className="relative w-full max-w-md border border-white/10 bg-[#101216]/95 p-7 sm:p-10"><p className="text-[11px] font-black tracking-[0.2em] text-orange-400">NEW PASSWORD</p><h1 className="mt-5 text-3xl font-black">新しいパスワード</h1><p className="mt-3 text-sm text-white/55">8文字以上で設定してください。</p><form onSubmit={submit} className="mt-7 space-y-5">{[["新しいパスワード", password, setPassword], ["確認用パスワード", confirmation, setConfirmation]].map(([label, value, setter]) => <label key={label as string} className="block"><span className="mb-2 block text-xs font-bold text-white/50">{label as string}</span><span className="flex items-center gap-3 border border-white/15 bg-black/20 px-4 focus-within:border-orange-500"><LockKeyhole size={18} className="text-orange-400" /><input type="password" autoComplete="new-password" required minLength={8} value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none" /></span></label>)}{error && <p role="alert" className="border-l-2 border-orange-500 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-4 text-xs font-black text-white disabled:opacity-50">{loading ? "変更中…" : "変更してマイページへ"}<ArrowRight size={16} /></button></form></section></main>;
}
