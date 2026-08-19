export default function CoachDashboardLoading() {
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8" aria-label="コーチ画面を読み込んでいます">
    <div className="mx-auto max-w-5xl animate-pulse">
      <div className="h-3 w-36 rounded bg-emerald-400/20" />
      <div className="mt-4 h-11 w-72 max-w-full rounded bg-white/10" />
      <div className="mt-10 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-32 rounded-2xl border border-white/10 bg-[#111]" />)}</div>
      <div className="mt-8 h-72 rounded-2xl border border-white/10 bg-[#111]" />
    </div>
  </main>;
}
