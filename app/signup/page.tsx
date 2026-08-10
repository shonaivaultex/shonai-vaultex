"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

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
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=/profile/create`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    setLoading(false);

    if (error) {
      setErrorMessage(
        error.message.toLowerCase().includes("already registered")
          ? "このメールアドレスはすでに登録されています。"
          : "アカウントを作成できませんでした。入力内容を確認してください。",
      );
      return;
    }

    if (data.session) {
      router.replace("/profile/create");
      router.refresh();
      return;
    }

    setVerificationEmail(email);
  }

  if (verificationEmail) {
    return (
      <main className="relative grid min-h-[calc(100vh-5rem)] place-items-center overflow-hidden px-5 pb-20 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.16),transparent_32%)]" />
        <section className="relative w-full max-w-md border border-white/10 bg-[#101216]/95 p-7 text-center shadow-2xl shadow-black/40 sm:p-10">
          <CheckCircle2 aria-hidden="true" className="mx-auto text-orange-400" size={46} />
          <h1 className="mt-6 text-3xl font-black tracking-[-0.04em]">メールを確認してください</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            <span className="font-bold text-white">{verificationEmail}</span> に確認メールを送りました。メール内のリンクを開くと、プロフィール作成へ進みます。
          </p>
          <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-xs font-black tracking-[0.12em] text-orange-400 transition hover:text-orange-300">
            LOGIN PAGE <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="relative grid min-h-[calc(100vh-5rem)] place-items-center overflow-hidden px-5 pb-20 pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.16),transparent_32%)]" />
      <section className="relative w-full max-w-md border border-white/10 bg-[#101216]/95 p-7 shadow-2xl shadow-black/40 sm:p-10">
        <p className="flex items-center gap-3 text-[11px] font-black tracking-[0.24em] text-orange-400"><span className="h-px w-8 bg-orange-500" /> NEW ATHLETE</p>
        <h1 className="mt-6 text-4xl font-black tracking-[-0.05em]">CREATE<br />ACCOUNT.</h1>
        <p className="mt-4 text-sm leading-7 text-white/55">メールアドレスとパスワードを登録して、選手プロフィールを作成します。</p>

        <form onSubmit={handleSignup} className="mt-9 space-y-5">
          <AuthField label="EMAIL" icon={<Mail aria-hidden="true" size={18} />} type="email" autoComplete="email" placeholder="メールアドレス" value={email} onChange={setEmail} />
          <AuthField label="PASSWORD" icon={<LockKeyhole aria-hidden="true" size={18} />} type="password" autoComplete="new-password" placeholder="8文字以上のパスワード" value={password} onChange={setPassword} minLength={8} />
          <AuthField label="CONFIRM PASSWORD" icon={<LockKeyhole aria-hidden="true" size={18} />} type="password" autoComplete="new-password" placeholder="パスワードをもう一度入力" value={passwordConfirmation} onChange={setPasswordConfirmation} minLength={8} />

          {errorMessage && <p role="alert" className="border-l-2 border-orange-500 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">{errorMessage}</p>}

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-4 text-xs font-black tracking-[0.16em] text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60">
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
            {!loading && <ArrowRight aria-hidden="true" size={16} />}
          </button>
        </form>

        <Link href="/login" className="mt-7 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-white/45 transition hover:text-white">
          <ArrowLeft aria-hidden="true" size={15} /> ログインへ戻る
        </Link>
      </section>
    </main>
  );
}

function AuthField({ label, icon, onChange, ...inputProps }: {
  label: string;
  icon: React.ReactNode;
  type: "email" | "password";
  autoComplete: string;
  placeholder: string;
  value: string;
  minLength?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-black tracking-[0.16em] text-white/55">{label}</span>
      <span className="flex items-center gap-3 border border-white/15 bg-black/20 px-4 focus-within:border-orange-500">
        <span className="text-orange-400">{icon}</span>
        <input {...inputProps} onChange={(event) => onChange(event.target.value)} required className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-white/25" />
      </span>
    </label>
  );
}
