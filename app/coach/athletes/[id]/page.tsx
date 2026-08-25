import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ChevronDown, Flag, Play } from "lucide-react";
import CoachFeedbackForm from "@/app/components/CoachFeedbackForm";
import CoachFeedbackActions from "@/app/components/CoachFeedbackActions";
import CoachPerformanceRecordDelete from "@/app/components/CoachPerformanceRecordDelete";
import { createClient } from "@/lib/supabase-server";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";
import { performanceEvents, unitMap } from "@/lib/performance-events";

export default async function CoachAthletePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ request?: string }> }) {
  const athleteId = (await params).id;
  const focusRecordId = Number((await searchParams).request);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/coach/athletes/${athleteId}`);
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle();
  if (!role) redirect("/mypage");
  const { data: athlete } = await supabase.from("players").select("user_id, name, grade, event, program_class").eq("user_id", athleteId).eq("member_status", "active").maybeSingle();
  if (!athlete) notFound();
  const [{ data: records, error }, { data: athleteGoal }] = await Promise.all([
    supabase.from("performance_records").select("*").eq("user_id", athleteId).order("date", { ascending: false }),
    supabase.from("personal_calendar_goals").select("title,target_date,event_name,target_value,target_unit").eq("user_id", athleteId).eq("status", "active").maybeSingle(),
  ]);
  if (error) notFound();
  const recordIds = (records ?? []).map((record) => record.id);
  const { data: requests } = recordIds.length ? await supabase.from("feedback_requests").select("id, record_id, request_type, message, priority, created_at").in("record_id", recordIds).eq("status", "pending") : { data: [] };
  const requestByRecord = new Map((requests ?? []).map((item) => [item.record_id, item]));
  const requestLabels: Record<string, string> = { video: "動画を見てほしい", movement: "動作について", awareness: "意識の方向性", improvement: "次回の改善点", other: "その他" };
  const requestMode = Number.isInteger(focusRecordId) && focusRecordId > 0 && requestByRecord.has(focusRecordId);
  const { data: feedback } = recordIds.length ? await supabase.from("coach_feedback").select("id, record_id, body, created_at, coach_id").in("record_id", recordIds).order("created_at", { ascending: false }) : { data: [] };
  const feedbackByRecord = (feedback ?? []).reduce<Record<number, typeof feedback>>((groups, item) => { (groups[item.record_id] ??= []).push(item); return groups; }, {});
  if (requestMode) Object.keys(feedbackByRecord).forEach((key) => delete feedbackByRecord[Number(key)]);
  const visibleRecords = requestMode ? (records ?? []).filter((record) => record.id === focusRecordId) : (records ?? []);
  const enriched = await Promise.all(visibleRecords.map(async (record) => { if (!record.video_path) return { ...record, video_url: null }; const { data } = await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).createSignedUrl(record.video_path, 3600); return { ...record, video_url: data?.signedUrl ?? null }; }));
  const eventOrder = new Map(performanceEvents.map((event, index) => [event.name, index]));
  const recordsByCategory = enriched.reduce<Record<string, typeof enriched>>((groups, record) => {
    (groups[record.category] ??= []).push(record);
    return groups;
  }, {});
  const groupedRecords = Object.entries(recordsByCategory).sort(([categoryA], [categoryB]) => {
    const orderA = eventOrder.get(categoryA) ?? Number.MAX_SAFE_INTEGER;
    const orderB = eventOrder.get(categoryB) ?? Number.MAX_SAFE_INTEGER;
    return orderA - orderB || categoryA.localeCompare(categoryB, "ja");
  });
  const renderRecord = (record: (typeof enriched)[number]) => {
    const request = requestByRecord.get(record.id);
    return <article id={`request-record-${record.id}`} key={record.id} className={`rounded-2xl bg-[#111] p-5 sm:p-6 ${focusRecordId === record.id ? "border border-sky-400 shadow-lg shadow-sky-500/10" : "border border-white/10"}`}>
      {request && <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/[0.08] p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs font-black text-sky-300">フィードバック依頼：{requestLabels[request.request_type]}</span>{request.priority === "urgent" && <span className="rounded-full bg-red-500/15 px-2 py-1 text-[10px] font-bold text-red-300">大会前・優先</span>}</div>{request.message && <p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{request.message}</p>}</div>}
      <div className="flex items-start justify-between gap-4"><div><span className="text-xs font-bold text-orange-400">{record.category}</span><strong className="mt-2 block text-3xl">{record.value}<span className="ml-1 text-sm text-white/50">{unitMap[record.category] ?? ""}</span></strong><span className="mt-1 block text-xs text-white/40">{record.date}</span></div>{record.awareness_category && <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">{record.awareness_category}</span>}</div>
      {record.awareness_note && <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-white/65">{record.awareness_note}</p>}
      {record.video_url && <details className="mt-4" open={focusRecordId === record.id && request?.request_type === "video"}><summary className="cursor-pointer text-sm font-bold text-orange-400"><Play className="mr-2 inline" size={15} />動画を見る</summary><video controls playsInline className="mt-3 max-h-[65vh] w-full rounded-xl bg-black object-contain" src={record.video_url} /></details>}
      {record.entry_source === "coach" && <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4"><span className="text-[11px] text-white/35">コーチ入力の記録</span><CoachPerformanceRecordDelete recordId={record.id} /></div>}
      {(feedbackByRecord[record.id] ?? []).map((item) => <div key={item.id} className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4"><span className="text-xs font-bold text-emerald-300">コーチフィードバック</span><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">{item.body}</p><span className="mt-2 block text-xs text-white/30">{new Date(item.created_at).toLocaleString("ja-JP")}</span>{item.coach_id === user.id && <CoachFeedbackActions feedbackId={item.id} initialBody={item.body} />}</div>)}
      <CoachFeedbackForm recordId={record.id} requestId={request?.id ?? null} />
    </article>;
  };
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/coach/dashboard" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-orange-400"><ArrowLeft size={16} />担当選手一覧</Link>
    <header className="mt-8 border-l-2 border-orange-500 pl-5"><p className="text-xs font-black tracking-[0.2em] text-orange-400">{requestMode ? "FEEDBACK REQUEST" : "ATHLETE STATUS"}</p><h1 className="mt-2 text-4xl font-black">{requestMode ? "フィードバック回答" : athlete.name}</h1><p className="mt-2 text-white/50">{athlete.name}・{athlete.program_class}・{athlete.grade}・{athlete.event}</p></header>
    {!requestMode && athleteGoal ? <section className="mt-6 rounded-2xl border border-orange-500/35 bg-orange-500/[.07] p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500 text-black"><Flag size={18}/></span><div><p className="text-[10px] font-black tracking-[.18em] text-orange-400">NEXT TARGET</p><h2 className="mt-1 text-lg font-black">{athleteGoal.title}</h2><p className="mt-1 text-sm text-white/55">{athleteGoal.target_date.replaceAll("-", "/")}{athleteGoal.event_name ? ` ・ ${athleteGoal.event_name}` : ""}{athleteGoal.target_value ? ` ・ ${athleteGoal.target_value}${athleteGoal.target_unit ?? ""}` : ""}</p></div></div></section> : null}
    {enriched.length === 0 ? <div className="mt-8 rounded-2xl border border-white/10 bg-[#111] p-8 text-center text-white/45">まだ記録がありません</div> : requestMode ? <div className="mt-8">{enriched.map(renderRecord)}</div> : <div className="mt-8 space-y-3">{groupedRecords.map(([category, categoryRecords]) => {
      const pendingCount = categoryRecords.filter((record) => requestByRecord.has(record.id)).length;
      return <details key={category} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111] open:border-orange-500/45">
        <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 marker:hidden sm:px-6"><div className="min-w-0 flex-1"><strong className="block text-lg">{category}</strong><span className="mt-1 block text-xs text-white/40">{categoryRecords.length}件・最新 {categoryRecords[0]?.date}</span></div>{pendingCount > 0 && <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-black text-sky-300">未回答 {pendingCount}件</span>}<ChevronDown size={20} className="shrink-0 text-orange-400 transition group-open:rotate-180" /></summary>
        <div className="space-y-4 border-t border-white/10 bg-black/15 p-4 sm:p-5">{categoryRecords.map(renderRecord)}</div>
      </details>;
    })}</div>}
  </div></main>;
}
