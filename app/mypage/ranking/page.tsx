import Link from "next/link";
import { ArrowLeft, ChevronRight, Medal, TrendingUp, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { eventNamesByKind, unitMap } from "@/lib/performance-events";

type RankingRow = {
  ranking_scope: "overall" | "class";
  leaderboard_position: number;
  display_name: string;
  best_value: number | string;
  is_current_user: boolean;
  total_count: number;
  program_class: string | null;
  gender: "male" | "female";
};

type GrowthRankingRow = {
  ranking_scope: "overall" | "class";
  leaderboard_position: number;
  display_name: string;
  growth_percent: number | string;
  previous_average: number | string;
  current_average: number | string;
  previous_count: number;
  current_count: number;
  is_current_user: boolean;
  total_count: number;
  program_class: string | null;
  gender: "male" | "female";
};

function rankingHref(category: string, gender: string, scope: string, period: string, mode = "position", kind = "athletics") {
  const query = new URLSearchParams({ category, gender, scope, period, mode, kind });
  return `/mypage/ranking?${query.toString()}`;
}

function growthTone(value: number) {
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-white/55";
}

function formatValue(value: number | string, unit: string) {
  return `${Number(value).toLocaleString("ja-JP", { maximumFractionDigits: 3 })}${unit}`;
}

function PodiumCard({ row, unit }: { row: RankingRow; unit: string }) {
  const styles = row.leaderboard_position === 1
    ? "border-orange-400/60 bg-orange-400/[.12] sm:-translate-y-3"
    : row.leaderboard_position === 2
      ? "border-white/20 bg-white/[.05]"
      : "border-amber-700/35 bg-amber-900/[.08]";
  return <article className={`relative rounded-3xl border p-5 text-center ${styles}`}>
    <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-black/25 text-lg font-black text-orange-300">{row.leaderboard_position}</span>
    <strong className={`mt-4 block truncate ${row.is_current_user ? "text-orange-300" : "text-white"}`}>{row.display_name}</strong>
    <span className="mt-2 block text-2xl font-black tracking-[-.04em]">{formatValue(row.best_value, unit)}</span>
    {row.is_current_user ? <span className="mt-3 inline-block rounded-full bg-orange-400 px-2.5 py-1 text-[9px] font-black text-black">YOU</span> : null}
  </article>;
}

function GrowthPodiumCard({ row, unit }: { row: GrowthRankingRow; unit: string }) {
  const styles = row.leaderboard_position === 1
    ? "border-emerald-400/60 bg-emerald-400/[.1] sm:-translate-y-3"
    : row.leaderboard_position === 2
      ? "border-white/20 bg-white/[.05]"
      : "border-cyan-700/35 bg-cyan-900/[.08]";
  const growth = Number(row.growth_percent);
  return <article className={`relative rounded-3xl border p-5 text-center ${styles}`}>
    <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-black/25 text-lg font-black text-emerald-300">{row.leaderboard_position}</span>
    <strong className={`mt-4 block truncate ${row.is_current_user ? "text-orange-300" : "text-white"}`}>{row.display_name}</strong>
    <span className={`mt-2 block text-2xl font-black tracking-[-.04em] ${growthTone(growth)}`}>{growth > 0 ? "+" : ""}{growth.toFixed(1)}%</span>
    <span className="mt-2 block text-[10px] text-white/35">前月 {formatValue(row.previous_average, unit)} → 今月 {formatValue(row.current_average, unit)}</span>
    {row.is_current_user ? <span className="mt-3 inline-block rounded-full bg-orange-400 px-2.5 py-1 text-[9px] font-black text-black">YOU</span> : null}
  </article>;
}

export default async function RankingPage({ searchParams }: { searchParams: Promise<{ category?: string; gender?: string; scope?: string; period?: string; mode?: string; kind?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims.sub;
  if (!userId) redirect("/login?next=/mypage/ranking");

  const { data: player } = await supabase.from("players").select("event,gender,program_class").eq("user_id", userId).single();
  if (!player) redirect("/profile/create");

  const mode = query.mode === "growth" ? "growth" : "position";
  const kind = query.kind === "athletics" || query.kind === "control-test" ? query.kind : "unofficial-athletics";
  const categories = eventNamesByKind(mode === "growth" ? kind : "athletics");
  const category = categories.includes(query.category ?? "") ? query.category! : categories.includes(player.event ?? "") ? player.event! : "100m";
  const gender = query.gender === "female" ? "female" : query.gender === "male" ? "male" : player.gender === "female" ? "female" : "male";
  const scope = query.scope === "class" ? "class" : "overall";
  const period = query.period === "season" ? "season" : "all";
  const year = new Date().getFullYear();
  const selectedYear = period === "season" ? year : null;
  const unit = unitMap[category] ?? "";

  const currentMonth = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }).slice(0, 7) + "-01";
  const { data, error } = mode === "growth"
    ? await supabase.rpc("get_monthly_growth_rankings", { p_category: category, p_record_kind: kind, p_month: currentMonth, p_gender: gender, p_scope: scope })
    : await supabase.rpc("get_official_ranking_page", { p_category: category, p_year: selectedYear, p_gender: gender, p_scope: scope });
  const rows = mode === "position" ? (data ?? []) as RankingRow[] : [];
  const growthRows = mode === "growth" ? (data ?? []) as GrowthRankingRow[] : [];
  const podium = [1, 0, 2].map((index) => rows[index]).filter(Boolean) as RankingRow[];
  const current = rows.find((row) => row.is_current_user);
  const next = current ? [...rows].reverse().find((row) => row.leaderboard_position < current.leaderboard_position) : null;
  const gap = current && next ? Math.abs(Number(current.best_value) - Number(next.best_value)) : null;
  const growthPodium = [1, 0, 2].map((index) => growthRows[index]).filter(Boolean) as GrowthRankingRow[];
  const currentGrowth = growthRows.find((row) => row.is_current_user);

  return <main className="min-h-screen bg-[#090a0c] px-4 pb-28 pt-28 text-white sm:px-7">
    <div className="mx-auto max-w-6xl">
      <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-black tracking-[.12em] text-white/45 transition hover:text-orange-300"><ArrowLeft size={16}/>MY PAGE</Link>
      <header className="mt-8 border-l-2 border-orange-500 pl-5">
        <p className="text-[10px] font-black tracking-[.28em] text-orange-400">VAULTEX RANKING</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-6xl">現在地を、次の力に。</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">{mode === "position" ? "本番記録だけで集計しています。順位は評価ではなく、次の目標を考えるための現在地です。" : "前月と今月の平均を比べ、継続して伸びた選手を表示します。順位よりも、自分の変化を楽しむためのランキングです。"}</p>
      </header>

      <nav className="mt-7 grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#111] p-2" aria-label="ランキング種類">
        <Link href={rankingHref(category, gender, scope, period, "position", "athletics")} className={`rounded-xl px-4 py-3 text-center text-sm font-black ${mode === "position" ? "bg-orange-500 text-black" : "text-white/45"}`}>現在地ランキング</Link>
        <Link href={rankingHref(category, gender, scope, period, "growth", kind)} className={`rounded-xl px-4 py-3 text-center text-sm font-black ${mode === "growth" ? "bg-emerald-400 text-black" : "text-white/45"}`}>今月の成長</Link>
      </nav>

      {mode === "growth" ? <nav className="mt-3 grid grid-cols-3 gap-2" aria-label="記録の種類">
        {([['unofficial-athletics','練習記録'],['athletics','本番記録'],['control-test','CONTROL TEST']] as const).map(([value,label]) => <Link key={value} href={rankingHref(eventNamesByKind(value)[0] ?? category, gender, scope, period, mode, value)} className={`rounded-xl border px-2 py-3 text-center text-[10px] font-black sm:text-xs ${kind === value ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-300" : "border-white/10 text-white/40"}`}>{label}</Link>)}
      </nav> : null}

      <form className="mt-8 grid gap-3 rounded-3xl border border-white/10 bg-[#121212] p-4 sm:grid-cols-[2fr_1fr_auto] sm:p-5">
        <label className="text-[10px] font-black tracking-[.12em] text-white/40">種目<select name="category" defaultValue={category} className="mt-2 w-full rounded-xl border border-white/10 bg-[#090909] px-4 py-3 text-sm text-white">{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        <input type="hidden" name="gender" value={gender}/><input type="hidden" name="scope" value={scope}/><input type="hidden" name="period" value={period}/><input type="hidden" name="mode" value={mode}/><input type="hidden" name="kind" value={kind}/>
        <div className="self-end text-xs text-white/35">{scope === "class" ? `${player.program_class ?? "クラス未設定"}内` : "VAULTEX全体"}</div>
        <button className="self-end rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black">表示する</button>
      </form>

      <nav className="mt-4 space-y-3" aria-label="ランキング条件">
        <div className="flex gap-2">{(["male", "female"] as const).map((item) => <Link key={item} href={rankingHref(category, item, scope, period, mode, kind)} className={`flex-1 rounded-xl border px-4 py-3 text-center text-sm font-black ${gender === item ? "border-orange-400 bg-orange-400 text-black" : "border-white/10 bg-white/[.025] text-white/50"}`}>{item === "male" ? "男子" : "女子"}</Link>)}</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Link href={rankingHref(category, gender, "overall", period, mode, kind)} className={`rounded-xl border px-3 py-3 text-center text-xs font-black ${scope === "overall" ? "border-orange-400/60 bg-orange-400/10 text-orange-300" : "border-white/10 text-white/45"}`}>全体</Link>
          <Link href={rankingHref(category, gender, "class", period, mode, kind)} className={`rounded-xl border px-3 py-3 text-center text-xs font-black ${scope === "class" ? "border-orange-400/60 bg-orange-400/10 text-orange-300" : "border-white/10 text-white/45"}`}>クラス別</Link>
          {mode === "position" ? <><Link href={rankingHref(category, gender, scope, "all", mode, kind)} className={`rounded-xl border px-3 py-3 text-center text-xs font-black ${period === "all" ? "border-orange-400/60 bg-orange-400/10 text-orange-300" : "border-white/10 text-white/45"}`}>累計</Link>
          <Link href={rankingHref(category, gender, scope, "season", mode, kind)} className={`rounded-xl border px-3 py-3 text-center text-xs font-black ${period === "season" ? "border-orange-400/60 bg-orange-400/10 text-orange-300" : "border-white/10 text-white/45"}`}>{year}シーズン</Link></> : <div className="col-span-2 rounded-xl border border-white/10 px-3 py-3 text-center text-xs font-black text-white/35">前月平均 → 今月平均</div>}
        </div>
      </nav>

      {mode === "position" ? <section className="mt-8 rounded-[28px] border border-orange-500/35 bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,.14),transparent_42%),#101010] p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.2em] text-orange-400">{gender === "female" ? "WOMEN" : "MEN"} / {scope === "class" ? player.program_class ?? "CLASS" : "OVERALL"}</p><h2 className="mt-1 text-2xl font-black">{category}</h2></div><span className="text-xs text-white/35">{rows[0]?.total_count ?? 0}人</span></div>
        {error ? <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">ランキングを読み込めませんでした。しばらくしてから再度お試しください。</p> : rows.length ? <>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">{podium.map((row) => <PodiumCard key={`${row.leaderboard_position}-${row.display_name}`} row={row} unit={unit}/>)}</div>
          {rows.length > 3 ? <ol className="mt-8 overflow-hidden rounded-2xl border border-white/10">{rows.slice(3).map((row) => <li key={`${row.leaderboard_position}-${row.display_name}`} className={`flex items-center gap-3 border-t border-white/[.06] px-4 py-4 first:border-t-0 ${row.is_current_user ? "bg-orange-400/10 text-orange-300" : "bg-black/15"}`}><b className="w-8 text-white/35">{row.leaderboard_position}</b><span className="min-w-0 flex-1 truncate font-bold">{row.display_name}</span><strong>{formatValue(row.best_value, unit)}</strong>{row.is_current_user ? <span className="rounded-full bg-orange-400 px-2 py-1 text-[9px] font-black text-black">YOU</span> : null}</li>)}</ol> : null}
        </> : <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center"><Medal className="mx-auto text-white/20"/><p className="mt-4 font-bold text-white/45">この条件の本番記録はまだありません</p><Link href="/performance?kind=athletics" className="mt-5 inline-flex items-center gap-1 text-sm font-black text-orange-300">本番記録を追加<ChevronRight size={16}/></Link></div>}
      </section> : <section className="mt-8 rounded-[28px] border border-emerald-400/35 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,.12),transparent_42%),#101010] p-5 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.2em] text-emerald-300">MONTHLY GROWTH / {gender === "female" ? "WOMEN" : "MEN"}</p><h2 className="mt-1 text-2xl font-black">{category}</h2></div><span className="text-xs text-white/35">対象 {growthRows[0]?.total_count ?? 0}人</span></div>
        <p className="mt-3 text-xs leading-6 text-white/40">前月と今月にそれぞれ3件以上ある記録の平均を比較します。タイム種目は短縮率、それ以外は向上率です。</p>
        {error ? <p className="mt-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">成長ランキングを読み込めませんでした。しばらくしてから再度お試しください。</p> : growthRows.length ? <>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">{growthPodium.map((row) => <GrowthPodiumCard key={`${row.leaderboard_position}-${row.display_name}`} row={row} unit={unit}/>)}</div>
          {growthRows.length > 3 ? <ol className="mt-8 overflow-hidden rounded-2xl border border-white/10">{growthRows.slice(3).map((row) => { const value = Number(row.growth_percent); return <li key={`${row.leaderboard_position}-${row.display_name}`} className={`flex items-center gap-3 border-t border-white/[.06] px-4 py-4 first:border-t-0 ${row.is_current_user ? "bg-orange-400/10" : "bg-black/15"}`}><b className="w-8 text-white/35">{row.leaderboard_position}</b><span className={`min-w-0 flex-1 truncate font-bold ${row.is_current_user ? "text-orange-300" : "text-white"}`}>{row.display_name}</span><strong className={growthTone(value)}>{value > 0 ? "+" : ""}{value.toFixed(1)}%</strong>{row.is_current_user ? <span className="rounded-full bg-orange-400 px-2 py-1 text-[9px] font-black text-black">YOU</span> : null}</li>; })}</ol> : null}
        </> : <div className="mt-8 rounded-2xl border border-dashed border-white/10 px-5 py-12 text-center"><TrendingUp className="mx-auto text-white/20"/><p className="mt-4 font-bold text-white/45">集計できる記録がまだありません</p><p className="mt-2 text-xs leading-6 text-white/30">前月と今月に、それぞれ3件以上記録すると参加できます。</p></div>}
      </section>}

      <p className="mt-5 text-center text-xs leading-6 text-white/30">名前を非公開にしている会員は、クラス名を使った匿名表示になります。</p>
    </div>
    {mode === "position" && current ? <aside className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-2xl rounded-2xl border border-orange-400/45 bg-[#18120e]/95 p-4 shadow-2xl backdrop-blur sm:bottom-5">
      <div className="flex items-center gap-4"><Trophy className="shrink-0 text-orange-400"/><div className="min-w-0 flex-1"><span className="text-[9px] font-black tracking-[.16em] text-orange-300">YOUR POSITION</span><strong className="mt-1 block truncate">{current.leaderboard_position}位 / {current.total_count}人 ・ {formatValue(current.best_value, unit)}</strong>{gap !== null ? <span className="mt-1 block text-[10px] text-white/45">ひとつ上まで {gap.toLocaleString("ja-JP", { maximumFractionDigits: 3 })}{unit}</span> : <span className="mt-1 block text-[10px] text-white/45">現在この条件のトップです</span>}</div></div>
    </aside> : mode === "growth" && currentGrowth ? <aside className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-2xl rounded-2xl border border-emerald-400/45 bg-[#0d1915]/95 p-4 shadow-2xl backdrop-blur sm:bottom-5"><div className="flex items-center gap-4"><TrendingUp className="shrink-0 text-emerald-300"/><div><span className="text-[9px] font-black tracking-[.16em] text-emerald-300">YOUR MONTHLY GROWTH</span><strong className="mt-1 block">{currentGrowth.leaderboard_position}位 / {currentGrowth.total_count}人 ・ {Number(currentGrowth.growth_percent) > 0 ? "+" : ""}{Number(currentGrowth.growth_percent).toFixed(1)}%</strong></div></div></aside> : null}
  </main>;
}
