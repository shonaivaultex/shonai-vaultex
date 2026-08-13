"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function ActivatePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleActivation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (!/^\d{8}$/.test(code)) {
      setErrorMessage("メールに記載された8桁の確認コードを入力してください。");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("パスワードは8文字以上で入力してください。");
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("確認用パスワードが一致していません。");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    let { error: verificationError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "invite",
    });

    if (verificationError) {
      const signupVerification = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "signup",
      });
      verificationError = signupVerification.error;
    }

    if (verificationError) {
      setLoading(false);
      setErrorMessage("メールアドレスまたは確認コードが正しくありません。最新の招待メールをご確認ください。");
      return;
    }

    const { error: passwordError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (passwordError) {
      setErrorMessage("パスワードを設定できませんでした。もう一度お試しください。");
      return;
    }

    router.replace("/mypage");
    router.refresh();
  }

  return (
    <main className="relative grid min-h-[calc(100vh-5rem)] place-items-center overflow-hidden px-5 pb-20 pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.16),transparent_32%)]" />
      <section className="relative w-full max-w-md border border-white/10 bg-[#101216]/95 p-7 shadow-2xl shadow-black/40 sm:p-10">
        <p className="flex items-center gap-3 text-[11px] font-black tracking-[0.24em] text-orange-400"><span className="h-px w-8 bg-orange-500" /> MEMBER ACTIVATION</p>
        <h1 className="mt-6 text-4xl font-black tracking-[-0.05em]">ACCOUNT<br />SETUP.</h1>
        <p className="mt-4 text-sm leading-7 text-white/55">招待メールに記載された確認コードを入力して、会員アカウントを有効にしてください。</p>

        <form onSubmit={handleActivation} className="mt-9 space-y-5">
          <AuthField label="EMAIL" icon={<Mail aria-hidden="true" size={18} />} type="email" autoComplete="email" placeholder="招待を受け取ったメールアドレス" value={email} onChange={setEmail} />
          <AuthField label="確認コード" icon={<KeyRound aria-hidden="true" size={18} />} type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="8桁の確認コード" value={code} onChange={(value) => setCode(value.replace(/\D/g, "").slice(0, 8))} maxLength={8} />
          <AuthField label="NEW PASSWORD" icon={<LockKeyhole aria-hidden="true" size={18} />} type="password" autoComplete="new-password" placeholder="8文字以上のパスワード" value={password} onChange={setPassword} minLength={8} />
          <AuthField label="CONFIRM PASSWORD" icon={<LockKeyhole aria-hidden="true" size={18} />} type="password" autoComplete="new-password" placeholder="パスワードをもう一度入力" value={passwordConfirmation} onChange={setPasswordConfirmation} minLength={8} />

          {errorMessage && <p role="alert" className="border-l-2 border-orange-500 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">{errorMessage}</p>}

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-4 text-xs font-black tracking-[0.12em] text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60">
            {loading ? "SETTING..." : "アカウントを有効にする"}
            {!loading && <ArrowRight aria-hidden="true" size={16} />}
          </button>
        </form>

        <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-white/45 transition hover:text-white"><ArrowLeft aria-hidden="true" size={15} /> ログインへ戻る</Link>
      </section>
    </main>
  );
}

function AuthField({ label, icon, onChange, inputMode, maxLength, ...inputProps }: {
  label: string;
  icon: React.ReactNode;
  type: "email" | "password" | "text";
  inputMode?: "numeric";
  autoComplete: string;
  placeholder: string;
  value: string;
  minLength?: number;
  maxLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black tracking-[0.16em] text-white/55">{label}</span>
      <span className="flex items-center gap-3 border border-white/15 bg-black/20 px-4 focus-within:border-orange-500">
        <span className="text-orange-400">{icon}</span>
        <input {...inputProps} inputMode={inputMode} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} required className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-white/25" />
      </span>
    </label>
  );
}
