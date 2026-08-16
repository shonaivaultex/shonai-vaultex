export const FEEDBACK_ATTACHMENT_BUCKET = "feedback-attachments";
export const MAX_FEEDBACK_VIDEO_SIZE = 100 * 1024 * 1024;
export const MAX_FEEDBACK_IMAGE_SIZE = 15 * 1024 * 1024;

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedVideoTypes = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"]);

export type FeedbackAttachmentType = "image" | "video";

export function getFeedbackAttachmentType(file: File): FeedbackAttachmentType | null {
  if (allowedImageTypes.has(file.type)) return "image";
  if (allowedVideoTypes.has(file.type)) return "video";
  return null;
}

export function validateFeedbackAttachment(file: File) {
  const type = getFeedbackAttachmentType(file);
  if (!type) return "画像はJPG・PNG・WEBP、動画はMP4・MOV・WEBMを選択してください。";
  if (type === "image" && file.size > MAX_FEEDBACK_IMAGE_SIZE) return "画像は15MB以下にしてください。";
  if (type === "video" && file.size > MAX_FEEDBACK_VIDEO_SIZE) return "動画は100MB以下にしてください。";
  return null;
}

export function createFeedbackAttachmentPath(requestId: number, userId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (getFeedbackAttachmentType(file) === "image" ? "jpg" : "mp4");
  return `${requestId}/${userId}/${crypto.randomUUID()}.${extension}`;
}

type StorageClient = ReturnType<typeof import("@/lib/supabase-browser").createClient>;

export async function uploadFeedbackAttachment(
  supabase: StorageClient,
  path: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  const bucket = supabase.storage.from(FEEDBACK_ATTACHMENT_BUCKET);
  const { data: signed, error: signedError } = await bucket.createSignedUploadUrl(path);
  if (signedError || !signed) throw signedError ?? new Error("アップロード先を作成できませんでした。");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("ログイン情報を確認できませんでした。");

  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("cacheControl", "3600");
    formData.append("", file);
    request.open("PUT", signed.signedUrl);
    request.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
    request.setRequestHeader("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    request.setRequestHeader("x-upsert", "false");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    });
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) { onProgress(100); resolve(); return; }
      try { reject(new Error(JSON.parse(request.responseText).message ?? `アップロードに失敗しました（${request.status}）`)); }
      catch { reject(new Error(`アップロードに失敗しました（${request.status}）`)); }
    });
    request.addEventListener("error", () => reject(new Error("通信が切断されました。接続を確認して再度お試しください。")));
    request.send(formData);
  });
}
