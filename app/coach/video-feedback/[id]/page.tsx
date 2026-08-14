import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Play } from "lucide-react";
import { createClient } from "@/lib/supabase-server";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";
import CompatibleVideoPlayer from "@/app/components/CompatibleVideoPlayer";
import VideoFeedbackConversation, { type VideoFeedbackMessage } from "@/app/components/VideoFeedbackConversation";
import VideoFeedbackAssignee from "@/app/components/VideoFeedbackAssignee";

export default async function CoachVideoFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const requestId = Number((await params).id);
  if (!Number.isInteger(requestId)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/coach/video-feedback/${requestId}`);
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "coach")
    .maybeSingle();
  if (!role) redirect("/mypage");
  const { data: request } = await supabase
    .from("video_feedback_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) notFound();
  const { data: athlete } = await supabase
    .from("players")
    .select("name, program_class, grade, event")
    .eq("user_id", request.user_id)
    .maybeSingle();
  const { data: signed } = await supabase.storage
    .from(PERFORMANCE_VIDEO_BUCKET)
    .createSignedUrl(request.video_path, 3600);
  const { data: messages } = await supabase.from("video_feedback_messages").select("id, sender_id, sender_role, body, created_at, video_feedback_message_reactions(user_id, reaction)").eq("request_id", request.id).order("created_at");
  const coachMessageIds = (messages ?? []).filter((message) => message.sender_role === "coach").map((message) => message.id);
  const { data: messageReads } = coachMessageIds.length ? await supabase.from("video_feedback_message_reads").select("message_id").eq("user_id", request.user_id).in("message_id", coachMessageIds) : { data: [] };
  const readMessageIds = new Set((messageReads ?? []).map((item) => item.message_id));
  const conversationMessages = (messages ?? []).map((message) => ({ ...message, read_by_athlete: message.sender_role === "coach" && readMessageIds.has(message.id) }));
  const { data: availableCoaches } = await supabase.rpc("get_video_feedback_coaches", { p_request_id: request.id });
  return (
    <main className="min-h-screen bg-[#090a0c] px-5 pb-20 pt-32 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/coach/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-orange-400"
        >
          <ArrowLeft size={16} />
          フィードバック依頼一覧
        </Link>
        <header className="mt-8 border-l-2 border-sky-500 pl-5">
          <p className="text-xs font-black tracking-[0.2em] text-sky-400">
            VIDEO ONLY REQUEST
          </p>
          <h1 className="mt-2 text-4xl font-black">動画フィードバック</h1>
          <p className="mt-2 text-white/50">
            {athlete?.name ?? "選手"}・
            {athlete?.program_class ?? "クラス未設定"}・{athlete?.grade ?? ""}
          </p>
        </header>
        <article className="mt-8 rounded-2xl border border-sky-500/25 bg-[#111] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-xs font-black text-sky-300">
                {request.status === "answered" ? "回答済み" : "未回答"}
                {request.priority === "urgent" ? "・大会前／優先" : ""}
              </span>
              <h2 className="mt-2 text-2xl font-black">{request.event_name}</h2>
            </div>
            {request.awareness_category && (
              <span className="rounded-full border border-orange-500/30 px-3 py-1 text-xs text-orange-300">
                {request.awareness_category}
              </span>
            )}
          </div>
          {request.message && (
            <p className="mt-4 whitespace-pre-wrap leading-7 text-white/70">
              {request.message}
            </p>
          )}
          <VideoFeedbackAssignee requestId={request.id} initialCoachId={request.assigned_coach_id ?? null} coaches={(availableCoaches ?? []) as Array<{ user_id: string; name: string }>} />
          {signed?.signedUrl && (
            <div className="mt-5">
              <p className="mb-3 text-sm font-bold text-orange-400">
                <Play className="mr-2 inline" size={16} />
                依頼動画
              </p>
              <CompatibleVideoPlayer
                src={signed.signedUrl}
                className="max-h-[65vh] w-full rounded-xl bg-black object-contain"
              />
            </div>
          )}
          <VideoFeedbackConversation requestId={request.id} messages={conversationMessages as VideoFeedbackMessage[]} role="coach" />
        </article>
      </div>
    </main>
  );
}
