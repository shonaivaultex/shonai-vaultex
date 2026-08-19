"use client";

import { FormEvent, useState } from "react";
import { Check, Clock3, Send, Trophy, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export type CompetitionApplicationItem = {
  id: number;
  schedule_id: number;
  events: string;
  note: string | null;
  status: "submitted" | "withdrawn";
};

type Props = {
  scheduleId: number;
  opensAt: string | null;
  deadline: string | null;
  currentTime: string;
  initialApplication?: CompetitionApplicationItem;
};

function dateTime(value: string) {
  return new Date(value).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CompetitionApplication({ scheduleId, opensAt, deadline, currentTime, initialApplication }: Props) {
  const [application, setApplication] = useState(initialApplication);
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState(initialApplication?.events ?? "");
  const [note, setNote] = useState(initialApplication?.note ?? "");
  const [saving, setSaving] = useState(false);
  const now = new Date(currentTime).getTime();
  const beforeOpen = opensAt ? now < new Date(opensAt).getTime() : false;
  const closed = deadline ? now > new Date(deadline).getTime() : false;
  const submitted = application?.status === "submitted";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const row = { schedule_id: scheduleId, user_id: user.id, events: events.trim(), note: note.trim() || null, status: "submitted", updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from("competition_applications").upsert(row, { onConflict: "schedule_id,user_id" }).select("id,schedule_id,events,note,status").single();
    setSaving(false);
    if (error) { alert(error.message); return; }
    setApplication(data as CompetitionApplicationItem);
    setOpen(false);
  }

  async function withdraw() {
    if (!application || !confirm("この試合への申込を取り消しますか？")) return;
    setSaving(true);
    const { data, error } = await createClient().from("competition_applications").update({ status: "withdrawn", updated_at: new Date().toISOString() }).eq("id", application.id).select("id,schedule_id,events,note,status").single();
    setSaving(false);
    if (error) { alert(error.message); return; }
    setApplication(data as CompetitionApplicationItem);
    setOpen(false);
  }

  if (beforeOpen) return <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white/40"><Clock3 size={13}/>申込開始：{dateTime(opensAt!)}</p>;
  if (closed && !submitted) return <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-white/35"><X size={13}/>申込受付は終了しました</p>;

  return <div className="mt-3">
    {submitted && !open ? <div className="flex flex-wrap items-center gap-2"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-black text-emerald-300"><Check size={13}/>申込済み</span><button type="button" onClick={() => setOpen(true)} className="text-xs font-bold text-white/45 hover:text-white">内容を確認・変更</button>{deadline ? <span className="text-[10px] text-white/30">締切 {dateTime(deadline)}</span> : null}</div> : !open ? <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-400"><Trophy size={15}/>この試合に申し込む</button> : null}
    {open ? <form onSubmit={submit} className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/[0.06] p-4">
      <div className="flex items-center justify-between"><strong className="text-sm text-red-200">試合申込</strong>{deadline ? <span className="text-[10px] text-white/35">締切 {dateTime(deadline)}</span> : null}</div>
      <label className="mt-3 block"><span className="mb-1 block text-[11px] font-bold text-white/55">出場種目</span><input required maxLength={500} value={events} onChange={(event) => setEvents(event.target.value)} placeholder="例：100m、走幅跳" className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-red-400"/></label>
      <label className="mt-3 block"><span className="mb-1 block text-[11px] font-bold text-white/55">連絡事項（任意）</span><textarea maxLength={500} rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="希望種目、確認事項など" className="w-full resize-none rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-red-400"/></label>
      <div className="mt-3 flex flex-wrap justify-end gap-2">{submitted ? <button type="button" disabled={saving} onClick={() => void withdraw()} className="mr-auto rounded-lg px-3 py-2 text-xs font-bold text-red-300 disabled:opacity-40">申込を取り消す</button> : null}<button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/55">閉じる</button><button disabled={saving || !events.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-2 text-xs font-black text-white disabled:opacity-40"><Send size={13}/>{saving ? "保存中" : submitted ? "変更を保存" : "申し込む"}</button></div>
    </form> : null}
  </div>;
}
