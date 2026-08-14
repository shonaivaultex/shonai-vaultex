import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { unitMap } from "@/lib/performance-events";

const kindLabels: Record<string, string> = {
  "control-test": "コントロールテスト",
  athletics: "本番記録",
  "unofficial-athletics": "練習記録",
};

function csvCell(value: unknown) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function fileSafe(value: string) {
  return value.replace(/[\\/:*?"<>|\s]+/g, "_").slice(0, 40) || "member";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: player }, { data: records, error }] = await Promise.all([
    supabase.from("players").select("name, grade, event, program_class").eq("user_id", user.id).single(),
    supabase.from("performance_records").select("id, date, category, value, record_kind, awareness_category, awareness_categories, awareness_note, video_path").eq("user_id", user.id).order("date", { ascending: false }).order("id", { ascending: false }),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recordIds = (records ?? []).map((record) => record.id);
  const { data: feedback } = recordIds.length
    ? await supabase.from("coach_feedback").select("record_id, body, created_at").in("record_id", recordIds).order("created_at")
    : { data: [] };
  const feedbackByRecord = (feedback ?? []).reduce<Record<number, string[]>>((result, item) => {
    (result[item.record_id] ??= []).push(item.body);
    return result;
  }, {});

  const headers = ["日付", "記録区分", "種目", "記録", "単位", "意識カテゴリ", "意識メモ", "動画", "コーチフィードバック"];
  const rows = (records ?? []).map((record) => [
    record.date,
    kindLabels[record.record_kind] ?? record.record_kind,
    record.category,
    record.value,
    unitMap[record.category] ?? "",
    (record.awareness_categories?.length ? record.awareness_categories : record.awareness_category ? [record.awareness_category] : []).join("・"),
    record.awareness_note,
    record.video_path ? "あり" : "なし",
    (feedbackByRecord[record.id] ?? []).join("\n---\n"),
  ]);
  const profileRows = [
    ["SHONAI VAULTEX 記録バックアップ"],
    ["氏名", player?.name ?? ""],
    ["クラス", player?.program_class ?? ""],
    ["学年", player?.grade ?? ""],
    ["主な種目", player?.event ?? ""],
    ["出力日時", new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })],
    [],
  ];
  const csv = "\uFEFF" + [...profileRows, headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const date = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Tokyo" });
  const filename = `SHONAI_VAULTEX_${fileSafe(player?.name ?? "member")}_${date}.csv`;
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" } });
}
