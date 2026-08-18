import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import AiNavigator, { type CompanionInitialData } from "@/app/components/AiNavigator";

export default async function AiNavigatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/ai-navigator");
  const { data: conversations } = await supabase.from("ai_companion_conversations").select("id, title, status, last_message_at, created_at").eq("user_id", user.id).order("last_message_at", { ascending: false }).limit(30);
  const activeId = conversations?.[0]?.id ?? null;
  const { data: messages } = activeId ? await supabase.from("ai_companion_messages").select("id, role, content, response_payload, created_at").eq("conversation_id", activeId).eq("user_id", user.id).order("created_at").order("id").limit(100) : { data: [] };
  const initialData = { conversations: conversations ?? [], activeId, messages: messages ?? [] } as CompanionInitialData;
  return <main className="min-h-screen bg-[#090a0c] px-4 pb-24 pt-28 text-white sm:px-8"><div className="mx-auto max-w-5xl"><Link href="/mypage" className="mb-7 inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55 hover:text-orange-400"><ArrowLeft size={16}/>マイページへ戻る</Link><AiNavigator initialData={initialData}/></div></main>;
}
