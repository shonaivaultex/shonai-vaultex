import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import VideoFeedbackManager from "@/app/components/VideoFeedbackManager";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";
import { FEEDBACK_ATTACHMENT_BUCKET } from "@/lib/feedback-attachments";

export default async function VideoFeedbackPage({ searchParams }: { searchParams: Promise<{ event?: string; message?: string }> }) {
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/video-feedback");
  const { data: requests } = await supabase.from("video_feedback_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const requestIds = (requests ?? []).map((item) => item.id);
  const { data: messages } = requestIds.length ? await supabase.from("video_feedback_messages").select("id, request_id, sender_id, sender_role, body, created_at, attachment_path, attachment_type, attachment_name, attachment_size, video_feedback_message_reactions(user_id, reaction)").in("request_id", requestIds).order("created_at") : { data: [] };
  const coachMessageIds = (messages ?? []).filter((message) => message.sender_role === "coach").map((message) => message.id);
  const attachmentPaths = (messages ?? []).flatMap((message) => message.attachment_path ? [message.attachment_path] : []);
  const [{ data: messageReads }, { data: requestUrls }, { data: attachmentUrls }] = await Promise.all([
    coachMessageIds.length ? supabase.from("video_feedback_message_reads").select("message_id").eq("user_id", user.id).in("message_id", coachMessageIds) : Promise.resolve({ data: [] }),
    (requests ?? []).some((item) => item.video_path) ? supabase.storage.from(PERFORMANCE_VIDEO_BUCKET).createSignedUrls((requests ?? []).flatMap((item) => item.video_path ? [item.video_path] : []), 3600) : Promise.resolve({ data: [] }),
    attachmentPaths.length ? supabase.storage.from(FEEDBACK_ATTACHMENT_BUCKET).createSignedUrls(attachmentPaths, 3600) : Promise.resolve({ data: [] }),
  ]);
  const readMessageIds = new Set((messageReads ?? []).map((item) => item.message_id));
  const requestPaths = (requests ?? []).flatMap((item) => item.video_path ? [item.video_path] : []);
  const requestUrlByPath = new Map((requestUrls ?? []).map((item, index) => [requestPaths[index], item.signedUrl]));
  const attachmentUrlByPath = new Map((attachmentUrls ?? []).map((item, index) => [attachmentPaths[index], item.signedUrl]));
  const items = (requests ?? []).map((item) => ({ ...item, video_url: requestUrlByPath.get(item.video_path) ?? null, messages: (messages ?? []).filter((message) => message.request_id === item.id).map((message) => ({ ...message, attachment_url: message.attachment_path ? attachmentUrlByPath.get(message.attachment_path) ?? null : null, read_by_athlete: message.sender_role === "coach" && readMessageIds.has(message.id) })) }));
  return <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8"><div className="mx-auto max-w-3xl">
    <Link href="/mypage" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-orange-400"><ArrowLeft size={16} />マイページ</Link>
    <header className="mt-10 border-l-2 border-sky-500 pl-5"><p className="text-xs font-black tracking-[0.22em] text-sky-400">COACH CONSULTATION</p><h1 className="mt-3 text-4xl font-black">コーチに相談</h1><p className="mt-3 text-white/55">動画がなくても相談できます。文章・画像・動画を使って、その後はコーチと直接やり取りできます。</p></header>
    <VideoFeedbackManager initialItems={items} initialEventName={(query.event ?? "").slice(0,80)} initialMessage={(query.message ?? "").slice(0,500)} />
  </div></main>;
}
