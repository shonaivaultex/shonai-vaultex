import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import AiNavigator from "@/app/components/AiNavigator";

export default async function AiNavigatorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/ai-navigator");
  return <main className="min-h-screen bg-[#090a0c] px-4 pb-24 pt-28 text-white sm:px-8"><div className="mx-auto max-w-5xl"><Link href="/mypage" className="mb-7 inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55 hover:text-orange-400"><ArrowLeft size={16}/>マイページへ戻る</Link><AiNavigator/></div></main>;
}
