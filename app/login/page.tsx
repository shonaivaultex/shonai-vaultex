"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import Link from "next/link";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

   const supabase = createClient();

const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage("メールアドレスまたはパスワードを確認してください。");
      return;
    }

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
      ? requestedPath
      : "/mypage";

    router.replace(destination);
    router.refresh();
  }

  return (
    <main className="relative grid min-h-[calc(100vh-5rem)] place-items-center overflow-hidden px-5 pb-20 pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(249,115,22,0.16),transparent_32%)]" />
      <section className="relative w-full max-w-md border border-white/10 bg-[#101216]/95 p-7 shadow-2xl shadow-black/40 sm:p-10">
        <p className="flex items-center gap-3 text-[11px] font-black tracking-[0.24em] text-orange-400">
          <span className="h-px w-8 bg-orange-500" /> ATHLETE ACCESS
        </p>
        <h1 className="mt-6 text-4xl font-black tracking-[-0.05em]">MY PAGE<br />LOGIN.</h1>
        <p className="mt-4 text-sm leading-7 text-white/55">選手専用ページにログインして、競技記録や成長の履歴を確認できます。</p>

        <form onSubmit={handleLogin} className="mt-9 space-y-5">
          <label className="block">
            <span className="mb-2 block text-[11px] font-black tracking-[0.16em] text-white/55">EMAIL</span>
            <span className="flex items-center gap-3 border border-white/15 bg-black/20 px-4 focus-within:border-orange-500">
              <Mail aria-hidden="true" size={18} className="text-orange-400" />
              <input className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-white/25" type="email" autoComplete="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-[11px] font-black tracking-[0.16em] text-white/55">PASSWORD</span>
            <span className="flex items-center gap-3 border border-white/15 bg-black/20 px-4 focus-within:border-orange-500">
              <LockKeyhole aria-hidden="true" size={18} className="text-orange-400" />
              <input className="min-w-0 flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-white/25" type="password" autoComplete="current-password" placeholder="パスワード" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </span>
          </label>

          {errorMessage && <p role="alert" className="border-l-2 border-orange-500 bg-orange-500/10 px-4 py-3 text-sm text-orange-200">{errorMessage}</p>}

          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 bg-orange-500 px-5 py-4 text-xs font-black tracking-[0.16em] text-white transition hover:bg-orange-400 disabled:cursor-wait disabled:opacity-60">
            {loading ? "LOGIN..." : "LOGIN TO MY PAGE"}
            {!loading && <ArrowRight aria-hidden="true" size={16} />}
          </button>
        </form>

        <div className="mt-7 border-t border-white/10 pt-6 text-center">
          <p className="text-sm text-white/50">アカウントをお持ちでない方</p>
          <Link href="/signup" className="mt-3 inline-flex items-center gap-2 text-xs font-black tracking-[0.12em] text-orange-400 transition hover:text-orange-300">
            CREATE ACCOUNT <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </div>

        <Link href="/" className="mt-7 inline-flex items-center gap-2 text-xs font-bold tracking-wide text-white/45 transition hover:text-white">
          <ArrowLeft aria-hidden="true" size={15} /> ホームへ戻る
        </Link>
      </section>
    </main>
  );
}
