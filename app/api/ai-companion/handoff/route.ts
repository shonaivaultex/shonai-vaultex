import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAthleteContext } from "@/lib/ai-navigator/context";

type Draft = { eventName: string; consultation: string; currentFeeling: string; triedActions: string; dataSummary: string; requestedFocus: string; attachmentCandidates: Array<{ label: string; kind: string }> };

function draftFrom(messages: Array<{ role: string; content: string }>, context: Awaited<ReturnType<typeof getAthleteContext>>): Draft {
  const userTexts = messages.filter((message) => message.role === "user").map((message) => message.content);
  const feeling = [...userTexts].reverse().find((text) => text.startsWith("今の感覚："))?.replace("今の感覚：", "") ?? "未入力";
  const consultation = userTexts[0] ?? "競技について相談したい";
  const tried = [...userTexts].reverse().find((text) => /意識|試し|やって|取り組/.test(text)) ?? "会話内では未入力";
  const top = context.highPerformanceAwareness[0];
  const summary = top ? `高記録側の${top.total}記録では「${top.label}」を意識した記録が${top.count}件あります（原因を断定するものではありません）。` : context.recordCount ? `本人の記録${context.recordCount}件を参照できます。傾向の断定はしていません。` : "比較できる記録データはまだありません。";
  const candidates = [{ label: "最近の動画", kind: "recent_video" }, { label: "PB時の動画", kind: "pb_video" }].filter((candidate) => context.videoCount > 0 || candidate.kind !== "recent_video");
  return { eventName: context.event ?? "", consultation, currentFeeling: feeling, triedActions: tried, dataSummary: summary, requestedFocus: "今の感覚と動きの確認", attachmentCandidates: candidates };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  const body = await request.json().catch(() => null) as { conversationId?: string; action?: "preview" | "submit"; draft?: Draft } | null;
  if (!body?.conversationId) return NextResponse.json({ error: "相談が見つかりません。" }, { status: 400 });
  const { data: conversation } = await supabase.from("ai_companion_conversations").select("id, coach_handoff_at").eq("id", body.conversationId).eq("user_id", user.id).maybeSingle();
  if (!conversation) return NextResponse.json({ error: "相談が見つかりません。" }, { status: 404 });
  if (conversation.coach_handoff_at) {
    const { data: existing } = await supabase.from("ai_coach_consultations").select("id").eq("conversation_id", conversation.id).maybeSingle();
    return NextResponse.json({ consultationId: existing?.id, alreadySent: true });
  }
  const { data: rows } = await supabase.from("ai_companion_messages").select("role, content").eq("conversation_id", conversation.id).eq("user_id", user.id).order("created_at").order("id");
  const context = await getAthleteContext(supabase, user.id);
  const generated = draftFrom(rows ?? [], context);
  if (body.action !== "submit") return NextResponse.json({ draft: generated });
  const draft = body.draft ?? generated;
  if (!draft.consultation?.trim()) return NextResponse.json({ error: "相談内容を入力してください。" }, { status: 400 });
  const { data: consultation, error } = await supabase.from("ai_coach_consultations").insert({
    user_id: user.id, conversation_id: conversation.id, event_name: draft.eventName.trim() || null,
    consultation_summary: draft.consultation.trim(), current_feeling: draft.currentFeeling.trim() || null,
    tried_actions: draft.triedActions.trim() || null, data_summary: generated.dataSummary,
    requested_focus: draft.requestedFocus.trim() || null, attachment_candidates: generated.attachmentCandidates,
  }).select("id").single();
  if (error || !consultation) return NextResponse.json({ error: error?.message ?? "コーチへ送信できませんでした。" }, { status: 500 });
  await supabase.from("ai_companion_conversations").update({ event_name: draft.eventName.trim() || null, resolution_status: "handed_off", coach_handoff_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conversation.id).eq("user_id", user.id);
  return NextResponse.json({ consultationId: consultation.id });
}
