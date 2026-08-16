export default function CoachDashboardLoading() {
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8">
    <div className="mx-auto max-w-5xl animate-pulse">
      <div className="h-4 w-32 rounded bg-white/10" />
      <div className="mt-10 border-l-2 border-orange-500 pl-5">
        <div className="h-3 w-36 rounded bg-orange-500/20" />
        <div className="mt-4 h-10 w-48 rounded bg-white/10" />
        <div className="mt-4 h-4 w-72 max-w-full rounded bg-white/10" />
      </div>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-36 rounded-2xl border border-white/10 bg-[#111]" />)}
      </div>
    </div>
  </main>;
}
