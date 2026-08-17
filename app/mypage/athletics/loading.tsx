export default function Loading() {
  return <PerformanceLoading />;
}

function PerformanceLoading() {
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-7xl"><div className="h-4 w-24 animate-pulse rounded bg-white/10" /><div className="mt-10 h-16 max-w-lg animate-pulse rounded-xl bg-white/[0.06]" /><div className="mt-10 grid gap-5 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-[560px] animate-pulse rounded-[20px] border border-orange-500/20 bg-white/[0.035]" />)}</div></div></main>;
}
