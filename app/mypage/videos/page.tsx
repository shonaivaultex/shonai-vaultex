import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import MyVideoLibrary, {
  type MyVideoItem,
} from "@/app/components/MyVideoLibrary";
import { createClient } from "@/lib/supabase-server";
import { PERFORMANCE_VIDEO_BUCKET } from "@/lib/performance-awareness";

export default async function MyVideosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mypage/videos");
  const { data: records } = await supabase
    .from("performance_records")
    .select(
      "id,date,category,record_kind,video_path,performance_record_details(id,detail_type,sequence_number,round_name,video_path)",
    )
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(300);
  const raw: Omit<MyVideoItem, "url">[] = (records ?? []).flatMap((record) => {
    const parent = record.video_path
      ? [
          {
            id: `record-${record.id}`,
            date: record.date,
            category: record.category,
            label: "代表動画",
            kind: record.record_kind === "athletics" ? "大会" : "練習",
            path: record.video_path,
          },
        ]
      : [];
    const details = (record.performance_record_details ?? []).flatMap(
      (detail) =>
        detail.video_path
          ? [
              {
                id: `detail-${detail.id}`,
                date: record.date,
                category: record.category,
                label:
                  detail.detail_type === "attempt"
                    ? `${detail.sequence_number}回目`
                    : (detail.round_name ?? `${detail.sequence_number}本目`),
                kind: record.record_kind === "athletics" ? "大会" : "練習",
                path: detail.video_path,
              },
            ]
          : [],
    );
    return [...parent, ...details];
  });
  const paths = [...new Set(raw.map((item) => item.path))];
  const { data: signed } = paths.length
    ? await supabase.storage
        .from(PERFORMANCE_VIDEO_BUCKET)
        .createSignedUrls(paths, 60 * 60)
    : { data: [] };
  const urls = new Map(
    (signed ?? []).map((item) => [item.path, item.signedUrl]),
  );
  const items = raw.flatMap((item) => {
    const url = urls.get(item.path);
    return url ? [{ ...item, url }] : [];
  });
  return (
    <main className="min-h-screen bg-[#090a0c] px-4 pb-28 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/mypage"
          className="inline-flex items-center gap-2 text-xs font-bold tracking-[.12em] text-white/55"
        >
          <ArrowLeft size={16} />
          マイページへ戻る
        </Link>
        <header className="mt-8 border-l-2 border-sky-400 pl-5">
          <p className="text-xs font-black tracking-[.22em] text-sky-300">
            MY VIDEOS
          </p>
          <h1 className="mt-2 text-4xl font-black">マイ動画</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            練習・大会で撮影した動画を日付ごとに確認できます。保存ボタンから端末の写真フォルダへ残せます。
          </p>
        </header>
        <MyVideoLibrary items={items} />
      </div>
    </main>
  );
}
