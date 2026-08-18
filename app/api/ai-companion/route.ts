import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getAthleteContext } from "@/lib/ai-navigator/context";
import { answerCompanion, type CompanionAnswer, type CompanionHistoryItem } from "@/lib/ai-navigator/knowledge";

type MessageRow = { id: number; role: "user" | "companion"; content: string; response_payload: CompanionAnswer | Record<string, never>; created_at: string };

async function authenticated() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, user } = await authenticated();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  const requestedId = new URL(request.url).searchParams.get("conversationId");
  const { data: conversations, error: conversationError } = await supabase
    .from("ai_companion_conversations")
    .select("id, title, status, resolution_status, coach_handoff_at, last_message_at, created_at")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(30);
  if (conversationError) return NextResponse.json({ error: conversationError.message }, { status: 500 });
  const activeId = requestedId && conversations?.some((item) => item.id === requestedId) ? requestedId : conversations?.[0]?.id ?? null;
  const { data: messages, error: messageError } = activeId ? await supabase
    .from("ai_companion_messages")
    .select("id, role, content, response_payload, created_at")
    .eq("conversation_id", activeId)
    .eq("user_id", user.id)
    .order("created_at")
    .order("id")
    .limit(100) : { data: [], error: null };
  if (messageError) return NextResponse.json({ error: messageError.message }, { status: 500 });
  const activeConversation = conversations?.find((item) => item.id === activeId);
  const { data: consultation } = activeConversation?.coach_handoff_at ? await supabase.from("ai_coach_consultations").select("id").eq("conversation_id", activeId).maybeSingle() : { data: null };
  return NextResponse.json({ conversations: conversations ?? [], activeId, messages: (messages ?? []) as MessageRow[], consultationId: consultation?.id ?? null });
}

export async function POST(request: Request) {
  const { supabase, user } = await authenticated();
  if (!user) return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  const body = await request.json().catch(() => null) as { conversationId?: string | null; message?: string } | null;
  const message = body?.message?.trim() ?? "";
  if (!message || message.length > 1000) return NextResponse.json({ error: "相談内容は1〜1000文字で入力してください。" }, { status: 400 });

  let conversationId = body?.conversationId ?? null;
  let isNew = false;
  if (conversationId) {
    const { data: owned } = await supabase.from("ai_companion_conversations").select("id, coach_handoff_at").eq("id", conversationId).eq("user_id", user.id).maybeSingle();
    if (!owned) return NextResponse.json({ error: "会話が見つかりません。" }, { status: 404 });
    if (owned.coach_handoff_at) return NextResponse.json({ error: "この相談はコーチとの直接トークへ移行しました。", handedOff: true }, { status: 409 });
  } else {
    const title = message.replace(/\s+/g, " ").slice(0, 32);
    const { data: created, error } = await supabase.from("ai_companion_conversations").insert({ user_id: user.id, title }).select("id").single();
    if (error || !created) return NextResponse.json({ error: error?.message ?? "会話を作成できませんでした。" }, { status: 500 });
    conversationId = created.id;
    isNew = true;
  }

  const { data: priorRows } = await supabase.from("ai_companion_messages").select("role, content").eq("conversation_id", conversationId).eq("user_id", user.id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(12);
  const history = ((priorRows ?? []).reverse()) as CompanionHistoryItem[];
  const { data: userMessage, error: userMessageError } = await supabase.from("ai_companion_messages").insert({ conversation_id: conversationId, user_id: user.id, role: "user", content: message }).select("id, role, content, response_payload, created_at").single();
  if (userMessageError) return NextResponse.json({ error: userMessageError.message }, { status: 500 });

  const context = await getAthleteContext(supabase, user.id);
  const answer = answerCompanion(message, history, context);
  const companionContent = [answer.title, answer.body, answer.question].filter(Boolean).join("\n\n");
  const { data: companionMessage, error: companionError } = await supabase.from("ai_companion_messages").insert({ conversation_id: conversationId, user_id: user.id, role: "companion", content: companionContent, response_payload: answer }).select("id, role, content, response_payload, created_at").single();
  if (companionError) return NextResponse.json({ error: companionError.message }, { status: 500 });
  await supabase.from("ai_companion_conversations").update({ last_message_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", user.id);
  return NextResponse.json({ conversationId, isNew, messages: [userMessage, companionMessage] });
}
