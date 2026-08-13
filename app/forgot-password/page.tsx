"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error: resetError } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo }); setLoading(false);
    if (resetError) { setError("メールを送信できませんでした。時間をおいてもう一度お試しください。"); return; } setSent(true);
  }
  return <main className="relative grid min-h-[calc(100vh-5rem)] place-items-center overflow-hidden px-5 pb-20 pt-32"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.16),transparent_32%)]" /><section className="relative w-full max-w-md border border-white/10 bg-[#101216]/95 p-7 shadow-2xl shadow-black/40 sm:p-10"><p className="flex items-center gap-3 text-[11px] font-black tracking-[0.2em] text-orange-400"><span className="h-px w-8 bg-orange-500" /> PASSWORD RESET</p><h1 className="mt-6 text-3xl font-black">パスワード再設定</h1>{sent ? <div className="mt-7 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5"><strong className="text-emerald-300">再設定メールを送信しました</strong><p className="mt-2 text-sm leading-6 text-white/55">メール内のリンクを開いて、新しいパスワードを設定してください。届かない場合は迷惑メールもご確認ください。</p></div> : <><p className="mt-4 text-sm leading-7 text-white/55">会員登録したメールアドレスへ、再設定用リンクを送信します。</p><form onSubmit={submit} className="mt-7 space-y-5"><label className="block"><span className="mb-2 block text-[11px] font-black tracking-[0.16em] text-white/55">EMAIL</span><span className="flex items-center gap-3 border border-white/15 bg-black/20 px-4 focus-within:border-orange-500"><Mail size={18} className="text-orange-400" /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="会員登録したメールアドレス" className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-white/25" /></span></label>{error && <p role="alert" className="border-l-2 border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>}<button disabled={loading} className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-4 text-xs font-black text-white disabled:opacity-50"><Send size={16} />{loading ? "送信中…" : "再設定メールを送る"}</button></form></>}<Link href="/login" className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white"><ArrowLeft size={15} />ログインへ戻る</Link></section></main>;
}
