export default function PageLoading() {
  return (
    <main className="min-h-[70vh] animate-pulse px-5 pb-20 pt-32 sm:px-8" aria-label="ページを読み込んでいます">
      <div className="mx-auto max-w-7xl">
        <div className="h-3 w-28 rounded-full bg-orange-500/25" />
        <div className="mt-5 h-12 w-72 max-w-full rounded-xl bg-white/10" />
        <div className="mt-4 h-4 w-96 max-w-full rounded bg-white/[.06]" />
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <div className="h-56 rounded-2xl border border-white/[.06] bg-white/[.035]" />
          <div className="h-56 rounded-2xl border border-white/[.06] bg-white/[.035]" />
        </div>
      </div>
    </main>
  );
}
