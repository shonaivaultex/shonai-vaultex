"use client";

import Link from "next/link";
import { useState } from "react";
import ScheduleAttendance from "./ScheduleAttendance";
import type { ScheduleItem } from "./SchedulePanel";
import { lineOfficialUrl } from "./site";

function PracticeCard({ item, onSaved }: { item: ScheduleItem; onSaved: (status: string) => void }) {
  const date = new Date(item.starts_at);
  const time = (value: string) => new Date(value).toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" });
  return <article className="rounded-2xl border border-white/15 bg-[#141414] p-5">
    <p className="font-bold text-orange-300">{date.toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo", month: "long", day: "numeric", weekday: "short" })} ・ {item.all_day ? "終日" : `${time(item.starts_at)}${item.ends_at ? `〜${time(item.ends_at)}` : ""}`}</p>
    <h3 className="mt-2 text-lg font-black">{item.title}</h3>
    <p className="mt-2 text-sm text-white/70">{item.location || "場所は確認中です"}</p>
    <p className="mt-1 text-xs text-white/50">{item.audience === "all" ? "全クラス対象" : `${item.program_class}対象`}</p>
    {item.details ? <details className="mt-3 text-sm text-white/70"><summary className="min-h-11 cursor-pointer py-2">練習の詳細を見る</summary><p className="whitespace-pre-wrap leading-7">{item.details}</p></details> : null}
    <ScheduleAttendance scheduleId={item.id} scheduleType={item.schedule_type} onSaved={onSaved} compact />
  </article>;
}

export default function ParticipationHome({ name, items, attendingIds }: { name: string; items: ScheduleItem[]; attendingIds: number[] }) {
  const [changes, setChanges] = useState<Record<number, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [notice, setNotice] = useState("");
  const isAttending = (id: number) => changes[id] ?? attendingIds.includes(id);
  const booked = items.filter((item) => isAttending(item.id));
  const available = items.filter((item) => !isAttending(item.id));
  const save = (id: number, status: string) => {
    setChanges((current) => ({ ...current, [id]: status === "attending" }));
    setNotice(status === "attending" ? "参加が確定しました。「次に参加する練習」に追加しました。" : "申込みをキャンセルしました。");
  };
  return <main className="mx-auto min-h-screen max-w-3xl px-5 pb-28 pt-28 text-white">
    <header className="flex items-center justify-between gap-4"><div><p className="text-sm text-white/55">{name}さん</p><h1 className="mt-2 text-3xl font-black">次の練習へ。</h1></div><Link href="/mypage/menu" className="rounded-xl border border-white/15 px-4 py-3 text-sm">設定・その他</Link></header>
    <p className="mt-3 text-sm leading-6 text-white/60">参加したい練習を選ぶだけ。毎日の入力は必要ありません。</p>
    <p role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>
    <nav aria-label="ホーム内の移動" className="mt-6 flex gap-3 text-sm"><a className="rounded-full border border-white/20 px-4 py-3" href="#booked">申込み済み</a><a className="rounded-full bg-orange-500 px-4 py-3 font-bold text-black" href="#join">練習を探す</a></nav>
    <section id="booked" className="mt-8 scroll-mt-24"><h2 className="mb-4 text-xl font-black">次に参加する練習</h2>
      {booked.length ? <div className="space-y-4">{booked.map((item) => <PracticeCard key={item.id} item={item} onSaved={(status) => save(item.id, status)} />)}</div> : <div className="rounded-2xl border border-dashed border-white/20 p-6"><p>申込み済みの練習はありません。</p><p className="mt-2 text-sm text-white/55">下の開催予定から、参加したい日を選んでください。</p></div>}
    </section>
    <section id="join" className="mt-10 scroll-mt-24"><h2 className="text-xl font-black">参加する練習を選ぶ</h2><p className="mb-4 mt-2 text-sm text-white/55">日時・場所と受付状況を確認して、その場で申し込めます。</p>
      <div className="space-y-4">{(showAll ? available : available.slice(0, 3)).map((item) => <PracticeCard key={item.id} item={item} onSaved={(status) => save(item.id, status)} />)}</div>
      {!available.length ? <p className="rounded-2xl border border-white/15 p-6 text-white/60">新しく申し込める開催予定はありません。次の案内をお待ちください。</p> : null}
      {available.length > 3 ? <button className="mt-4 min-h-11 w-full rounded-xl border border-white/20 p-3 text-sm" onClick={() => setShowAll(!showAll)}>{showAll ? "直近3件に戻す" : "開催予定をもっと見る"}</button> : null}
    </section>
    <a href={lineOfficialUrl} className="mt-8 block rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5"><strong className="text-emerald-300">コーチに相談する →</strong><p className="mt-2 text-sm text-white/65">迷ったら公式LINEへ。相談にログインは不要です。</p></a>
    <details className="mt-8 rounded-xl border border-white/15 p-4"><summary className="min-h-11 cursor-pointer py-2 text-sm">動画・記録・その他の予定</summary><div className="mt-3 grid gap-1 text-sm">{[["/mypage/videos", "届いた動画を見る"], ["/mypage/growth-report", "記録・成長を見る"], ["/mypage/schedules", "大会を含むクラブカレンダー"], ["/mypage/personal", "パーソナル予約"], ["/mypage/my-calendar", "個人カレンダー"], ["/mypage/menu", "機能一覧・設定"]].map(([href, label]) => <Link className="rounded-lg py-3 text-white/70 hover:text-white" key={href} href={href}>{label} →</Link>)}</div></details>
  </main>;
}
