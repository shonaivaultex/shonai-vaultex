export default function Loading() {
  return <div className="grid min-h-[65vh] place-items-center px-5 pt-24" role="status" aria-label="読み込み中"><div className="text-center"><span className="mx-auto block h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-orange-500" /><p className="mt-4 text-xs font-bold tracking-[0.18em] text-white/40">LOADING...</p></div></div>;
}
