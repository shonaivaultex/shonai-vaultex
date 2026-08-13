export const awarenessCategories = [
  "リズム",
  "力感",
  "スタート",
  "動作",
  "気持ち",
  "感覚",
  "その他",
] as const;

export type AwarenessCategory = (typeof awarenessCategories)[number];

export const PERFORMANCE_VIDEO_BUCKET = "performance-videos";
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export function createVideoPath(userId: string, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "mp4";
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

export function validateVideo(file: File) {
  if (!file.type.startsWith("video/")) return "動画ファイルを選択してください。";
  if (file.size > MAX_VIDEO_SIZE) return "動画は100MB以下にしてください。";
  return null;
}

export function formatVideoSize(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 1 : 2)}MB`;
}

type StorageClient = ReturnType<typeof import("@/lib/supabase-browser").createClient>;

export async function uploadVideoWithProgress(
  supabase: StorageClient,
  path: string,
  file: File,
  onProgress: (percent: number) => void,
) {
  const bucket = supabase.storage.from(PERFORMANCE_VIDEO_BUCKET);
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
