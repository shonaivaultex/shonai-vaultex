import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Activity, ChevronRight, Medal, Trophy } from "lucide-react";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";

export default async function MyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/mypage");
  }

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!player) {
    redirect("/profile/create");
  }

  return (
    <main
      style={{
        maxWidth: 600,
        margin: "80px auto",
        padding: 20,
      }}
    >
      <h1>MY PAGE</h1>

      {/* プロフィール */}
      <div
        style={{
          marginTop: 30,
          padding: 30,
          borderRadius: 20,
          background: "#111",
          color: "white",
        }}
      >
        <h2>{player.name}</h2>

        <p>
          <strong>GRADE</strong>
          <br />
          {player.grade}
        </p>

        <p>
          <strong>EVENT</strong>
          <br />
          {player.event}
        </p>

        <p>
          <strong>SCHOOL</strong>
          <br />
          {player.school}
        </p>
      </div>

      <h2 style={{ marginTop: 40, marginBottom: 20 }}>PERFORMANCE</h2>
      <div style={{ display: "grid", gap: 14 }}>
        <Link href="/mypage/control-tests" className="group flex items-center gap-4 rounded-2xl border border-orange-500/60 bg-[#111] p-5 text-white no-underline transition hover:border-orange-400">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Activity aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">コントロールテスト</strong><span className="mt-1 block text-sm text-white/50">スプリント・ジャンプ・筋力</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/mypage/athletics" className="group flex items-center gap-4 rounded-2xl border border-orange-500/60 bg-[#111] p-5 text-white no-underline transition hover:border-orange-400">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Trophy aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">陸上競技記録</strong><span className="mt-1 block text-sm text-white/50">大会・記録会・自己ベスト</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/mypage/unofficial-athletics" className="group flex items-center gap-4 rounded-2xl border border-orange-500/60 bg-[#111] p-5 text-white no-underline transition hover:border-orange-400">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><Medal aria-hidden="true" /></span>
          <span className="min-w-0 flex-1"><strong className="block text-lg">非公認陸上競技記録</strong><span className="mt-1 block text-sm text-white/50">練習跳躍・練習投擲・実践練習</span></span>
          <ChevronRight className="text-orange-400 transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginTop: 24,
        }}
      >
        <Link href="/edit">
          プロフィール編集
        </Link>
        <LogoutButton />
      </div>
    </main>
  );
}
