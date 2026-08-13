import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import VideoFeedbackManager from "@/app/components/VideoFeedbackManager";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";

export default async function VideoFeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/video-feedback");
  const { data: requests } = await supabase.from("video_feedback_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const items = await Promise.all((requests ?? []).map(async (item) => {
    const { data } = await supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).createSignedUrl(item.video_path, 3600);
    return { ...item, video_url: data?.signedUrl ?? null };
  }));
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-orange-400"><ArrowLeft size={16} />マイページ</Link>
    <header className="mt-10 border-l-2 border-sky-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-sky-400">VIDEO FEEDBACK</p><h1 className="mt-3 text-4xl font-black">動画だけ見てもらう</h1><p className="mt-3 text-white/55">記録に関係なく、フォームや動作の動画をコーチへ送れます。</p></header>
    <VideoFeedbackManager initialItems={items} />
  </div></main>;
}
