"use client";

import { FormEvent, useState } from "react";
import { Bug, Send, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function BugReportButton() {
  const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const [category, setCategory] = useState("display"); const [detail, setDetail] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!detail.trim()) return; setSaving(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); alert("ログインが必要です。"); return; }
    const { error } = await supabase.from("bug_reports").insert({ user_id: user.id, category, detail: detail.trim(), page_url: window.location.href, user_agent: navigator.userAgent }); setSaving(false);
    if (error) { alert("報告を送信できませんでした：" + error.message); return; }
    setDetail(""); setOpen(false); alert("不具合を報告しました。ありがとうございます。コーチが確認します。");
  }
  return <>
    <button type="button" onClick={() => setOpen(true)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-left text-sm text-white/70 transition hover:border-orange-500/40 hover:text-white"><span className="flex items-center gap-2 font-bold"><Bug size={17} className="text-orange-400" />不具合を報告</span><span className="text-xs text-white/35">困ったときはこちら</span></button>
    {open && <div className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-labelledby="bug-report-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setOpen(false); }}><form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-orange-500/40 bg-[#111] p-5 text-white shadow-2xl sm:p-6"><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-xs font-black tracking-[0.16em] text-orange-400">SUPPORT</p><h2 id="bug-report-title" className="mt-1 text-xl font-black">不具合を報告</h2><p className="mt-2 text-xs leading-5 text-white/45">起きたことと、本来どうなってほしかったかを書いてください。</p></div><button type="button" aria-label="閉じる" disabled={saving} onClick={() => setOpen(false)} className="rounded-full bg-white/10 p-2 text-white/60"><X size={18} /></button></div><label className="mt-5 block"><span className="mb-2 block text-sm font-bold">不具合の種類</span><select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full rounded-xl border border-white/15 bg-[#181818] px-4 py-3"><option value="display">表示がおかしい</option><option value="operation">ボタン・操作が動かない</option><option value="video">動画をアップロード・再生できない</option><option value="data">記録・データがおかしい</option><option value="notification">通知が届かない</option><option value="other">その他</option></select></label><label className="mt-4 block"><span className="mb-2 block text-sm font-bold">詳しい内容</span><textarea required minLength={5} maxLength={1000} rows={6} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="例：記録を追加ボタンを押しても画面が変わりません。今日の朝から発生しています。" className="w-full resize-none rounded-xl border border-white/15 bg-[#181818] px-4 py-3 text-sm leading-6 outline-none placeholder:text-white/25 focus:border-orange-500" /><span className="mt-1 block text-right text-xs text-white/30">{detail.length}/1000</span></label><p className="mt-3 text-xs leading-5 text-white/35">現在のページと端末・ブラウザ情報も、調査のため自動で送信されます。パスワードなどは送信されません。</p><button disabled={saving || detail.trim().length < 5} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3.5 text-sm font-black disabled:opacity-50"><Send size={16} />{saving ? "送信中…" : "報告を送信"}</button></form></div>}
  </>;
}
