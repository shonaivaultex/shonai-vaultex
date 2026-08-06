import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#090a0c] px-6 text-center text-white">
      <p className="text-sm font-black tracking-[0.3em] text-orange-500">
        ERROR 404
      </p>

      <h1 className="mt-6 text-6xl font-black tracking-[-0.06em] sm:text-8xl">
        PAGE
        <br />
        NOT FOUND
      </h1>

      <p className="mt-8 max-w-md text-white/60">
        お探しのページは見つかりませんでした。
        <br />
        トップページからもう一度お探しください。
      </p>

      <Link
        href="/"
        className="mt-10 rounded-full bg-orange-500 px-8 py-4 font-bold text-[#090a0c] transition hover:scale-105"
      >
        ホームへ戻る
      </Link>
    </main>
  );
}