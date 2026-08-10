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
