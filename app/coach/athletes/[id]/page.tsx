import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import CoachFeedbackForm from "@/app/components/CoachFeedbackForm";
import { createClient } from "@/lib/supabase-server";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";
import { unitMap } from "@/lib/performance-events";

export default async function CoachAthletePage({ params }: { params: Promise<{ id: string }> }) {
  const athleteId = (await params).id;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/coach/athletes/${athleteId}`);
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle();
  if (!role) redirect("/mypage");
  const { data: athlete } = await supabase.from("players").select("user_id, name, grade, event, program_class").eq("user_id", athleteId).maybeSingle();
  if (!athlete) notFound();
  const { data: records, error } = await supabase.from("performance_records").select("*").eq("user_id", athleteId).order("date", { ascending: false });
  if (error) notFound();
  const recordIds = (records ?? []).map((record) => record.id);
  const { data: feedback } = recordIds.length ? await supabase.from("coach_feedback").select("id, record_id, body, created_at, coach_id").in("record_id", recordIds).order("created_at", { ascending: false }) : { data: [] };
  const feedbackByRecord = (feedback ?? []).reduce<Record<number, typeof feedback>>((groups, item) => { (groups[item.record_id] ??= []).push(item); return groups; }, {});
  const enriched = await Promise.all((records ?? []).map(async (record) => { if (!record.video_path) return { ...record, video_url: null }; const { data } = await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).createSignedUrl(record.video_path, 3600); return { ...record, video_url: data?.signedUrl ?? null }; }));
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/coach/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-orange-400"><ArrowLeft size={16} />担当選手一覧</Link>
    <header className="mt-8 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.2em] text-orange-400">ATHLETE STATUS</p><h1 className="mt-2 text-4xl font-black">{athlete.name}</h1><p className="mt-2 text-white/50">{athlete.program_class}・{athlete.grade}・{athlete.event}</p></header>
    <div className="mt-8 space-y-5">{enriched.map((record) => <article key={record.id} className="rounded-2xl border border-white/10 bg-[#111] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold text-orange-400">{record.category}</span><strong className="mt-2 block text-3xl">{record.value}<span className="ml-1 text-sm text-white/50">{unitMap[record.category] ?? ""}</span></strong><span className="mt-1 block text-xs text-white/40">{record.date}</span></div>{record.awareness_category && <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{record.awareness_category}</span>}</div>{record.awareness_note && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">{record.awareness_note}</p>}{record.video_url && <details className="mt-4"><summary className="cursor-pointer text-sm font-bold text-orange-400"><Play className="mr-2 inline" size={15} />動画を見る</summary><video controls playsInline className="mt-3 max-h-[65vh] w-full rounded-xl bg-black object-contain" src={record.video_url} /></details>}{(feedbackByRecord[record.id] ?? []).map((item) => <div key={item.id} className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4"><span className="text-xs font-bold text-emerald-300">コーチフィードバック</span><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">{item.body}</p><span className="mt-2 block text-xs text-white/30">{new Date(item.created_at).toLocaleString("ja-JP")}</span></div>)}<CoachFeedbackForm recordId={record.id} /></article>)}</div>
  </div></main>;
}
