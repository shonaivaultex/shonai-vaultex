export default function MyPageLoading() {
  return <main className="mx-auto my-16 max-w-[1480px] animate-pulse px-4 pb-16 sm:px-7 lg:my-20 xl:px-10" aria-label="マイページを読み込んでいます">
    <div className="h-3 w-36 rounded bg-orange-500/25" />
    <div className="mt-3 h-11 w-48 rounded bg-white/10" />
    <div className="mt-8 grid min-h-64 overflow-hidden rounded-[28px] border border-white/10 bg-[#111] lg:grid-cols-2">
      <div className="space-y-5 p-7 lg:p-10"><div className="h-6 w-24 rounded-full bg-orange-500/15"/><div className="h-12 w-56 rounded bg-white/10"/><div className="h-4 w-32 rounded bg-white/[.06]"/></div>
      <div className="border-t border-white/10 p-7 lg:border-l lg:border-t-0"><div className="h-5 w-28 rounded bg-white/[.06]"/><div className="mt-4 h-8 w-64 max-w-full rounded bg-white/10"/></div>
    </div>
    <div className="mt-5 grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-20 rounded-2xl border border-white/10 bg-[#111]" />)}</div>
    <div className="mt-5 h-64 rounded-3xl border border-orange-500/20 bg-[#111]" />
  </main>;
}
