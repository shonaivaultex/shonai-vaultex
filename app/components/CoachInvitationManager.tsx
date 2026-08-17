"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronDown, FileUp, MailMinus, MailPlus, RefreshCw, Send, UsersRound, X } from "lucide-react";
import { programClasses } from "@/lib/program-classes";

type Draft = { email: string; name: string; programClass: string };
type Invitation = { id: string; email: string; name: string; programClass: string | null; status: "registered" | "pending"; invitedAt: string; registeredAt: string | null };
const emptyDraft: Draft = { email: "", name: "", programClass: "エリート" };

function parseCsvLine(line: string) {
  const values: string[] = []; let current = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { current += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { values.push(current.trim()); current = ""; }
    else current += char;
  }
  values.push(current.trim()); return values;
}

export default function CoachInvitationManager() {
  const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false); const [sending, setSending] = useState(false);
  const [drafts, setDrafts] = useState<Draft[]>([{ ...emptyDraft }]); const [items, setItems] = useState<Invitation[]>([]); const [message, setMessage] = useState("");
  const [status, setStatus] = useState("all"); const [query, setQuery] = useState("");
  const pendingCount = items.filter((item) => item.status === "pending").length;
  const filtered = useMemo(() => items.filter((item) => (status === "all" || item.status === status) && (!query.trim() || `${item.name} ${item.email} ${item.programClass ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()))), [items, query, status]);

  async function load() {
    setLoading(true); setMessage(""); const response = await fetch("/api/coach/invitations", { cache: "no-store" }); const data = await response.json(); setLoading(false);
    if (!response.ok) { setMessage(data.error ?? "登録状況を取得できませんでした。"); return; } setItems(data.invitations ?? []);
  }
  useEffect(() => {
    if (!open || items.length > 0) return;
    const request = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(request);
  }, [open, items.length]);
  function update(index: number, key: keyof Draft, value: string) { setDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item)); }
  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const lines = (await file.text()).replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
    const rows = lines.map(parseCsvLine); const start = rows[0]?.some((value) => /メール|email/i.test(value)) ? 1 : 0;
    const imported = rows.slice(start).map(([name, email, programClass]) => ({ name: name ?? "", email: email ?? "", programClass: programClass ?? "" }));
    if (!imported.length) { setMessage("CSVに会員データがありません。"); return; } setDrafts(imported.slice(0, 100)); setMessage(`${Math.min(imported.length, 100)}名を読み込みました。内容を確認して送信してください。`);
  }
  async function send(event: FormEvent) {
    event.preventDefault(); setSending(true); setMessage(""); const response = await fetch("/api/coach/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitations: drafts }) }); const data = await response.json(); setSending(false);
    const success = (data.results ?? []).filter((item: { ok: boolean }) => item.ok).length;
    if (!response.ok && !success) { setMessage(data.error ?? data.results?.map((item: { email: string; message: string }) => `${item.email}: ${item.message}`).join("\n") ?? "送信できませんでした。"); return; }
    const failed = (data.results ?? []).filter((item: { ok: boolean }) => !item.ok); setMessage(`${success}名へ招待を送信しました。${failed.length ? ` ${failed.length}名は送信できませんでした。` : ""}`); setDrafts([{ ...emptyDraft }]); await load();
  }
  async function resend(item: Invitation) {
    setSending(true); setMessage(""); const response = await fetch("/api/coach/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ invitations: [{ email: item.email, name: item.name, programClass: item.programClass }] }) }); const data = await response.json(); setSending(false);
    setMessage(response.ok ? `${item.name}さんへ招待を再送しました。` : data.error ?? data.results?.[0]?.message ?? "再送できませんでした。"); if (response.ok) await load();
  }
  return <section className="mt-8 overflow-hidden rounded-2xl border border-orange-500/25 bg-[#111]">
    <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 p-5 text-left"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500/15 text-orange-400"><UsersRound size={20} /></span><span><strong className="block">会員を招待</strong><span className="text-xs text-white/40">1名ずつ・CSV一括・未登録者へ再送</span></span>{pendingCount > 0 && <span className="ml-auto rounded-full bg-orange-500 px-2.5 py-1 text-xs font-black text-black">未登録 {pendingCount}名</span>}<ChevronDown className={`${pendingCount ? "" : "ml-auto"} text-white/45 transition ${open ? "rotate-180" : ""}`} /></button>
    {open && <div className="border-t border-white/10 p-5"><form onSubmit={send}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">招待メールを送る</h3><p className="mt-1 text-xs text-white/40">CSV列：氏名,メールアドレス,クラス（最大100名）</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/70"><FileUp size={15} />CSVを読み込む<input type="file" accept=".csv,text/csv" onChange={importCsv} className="sr-only" /></label></div>
      <div className="mt-4 space-y-2">{drafts.map((draft, index) => <div key={index} className="grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:grid-cols-[1fr_1.35fr_150px_auto]"><input required value={draft.name} onChange={(event) => update(index, "name", event.target.value)} placeholder="氏名" className="rounded-lg border border-white/15 bg-[#181818] px-3 py-2.5 text-sm" /><input required type="email" value={draft.email} onChange={(event) => update(index, "email", event.target.value)} placeholder="メールアドレス" className="rounded-lg border border-white/15 bg-[#181818] px-3 py-2.5 text-sm" /><select required value={draft.programClass} onChange={(event) => update(index, "programClass", event.target.value)} className="rounded-lg border border-white/15 bg-[#181818] px-3 py-2.5 text-sm"><option value="">クラス</option>{programClasses.map((item) => <option key={item}>{item}</option>)}</select><button type="button" aria-label={`${index + 1}行目を削除`} onClick={() => setDrafts((current) => current.length === 1 ? [{ ...emptyDraft }] : current.filter((_, itemIndex) => itemIndex !== index))} className="grid h-10 w-10 place-items-center rounded-lg text-white/40 hover:bg-red-500/10 hover:text-red-300"><X size={16} /></button></div>)}</div>
      <div className="mt-3 flex flex-wrap justify-between gap-2"><div className="flex flex-wrap gap-2"><button type="button" disabled={drafts.length >= 100} onClick={() => setDrafts((current) => [...current, { ...emptyDraft }])} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/65 disabled:cursor-not-allowed disabled:opacity-30"><MailPlus size={14} />1名追加</button><button type="button" disabled={drafts.length <= 1} onClick={() => setDrafts((current) => current.length <= 1 ? current : current.slice(0, -1))} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/65 disabled:cursor-not-allowed disabled:opacity-30"><MailMinus size={14} />1名減らす</button></div><button disabled={sending} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-black disabled:opacity-40"><Send size={15} />{sending ? "送信中…" : `${drafts.length}名へ招待を送信`}</button></div></form>
      {message && <p className="mt-4 whitespace-pre-wrap rounded-lg border border-orange-500/20 bg-orange-500/[0.06] px-4 py-3 text-sm text-orange-200">{message}</p>}
      <div className="mt-7 border-t border-white/10 pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">登録状況</h3><p className="mt-1 text-xs text-white/40">登録済み／未登録を確認し、未登録者へ再送できます。</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 text-xs font-bold text-white/55"><RefreshCw size={14} className={loading ? "animate-spin" : ""} />更新</button></div><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_180px]"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="名前・メール・クラスで検索" className="rounded-lg border border-white/15 bg-[#181818] px-3 py-2.5 text-sm" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-white/15 bg-[#181818] px-3 py-2.5 text-sm"><option value="all">すべて</option><option value="pending">未登録</option><option value="registered">登録済み</option></select></div>
        <div className="mt-3 max-h-[420px] divide-y divide-white/10 overflow-y-auto">{filtered.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-0 flex-1"><strong className="block text-sm">{item.name}</strong><span className="block truncate text-xs text-white/40">{item.email}・{item.programClass ?? "クラス未設定"}</span></div><span className={`text-xs font-bold ${item.status === "registered" ? "text-emerald-300" : "text-amber-300"}`}>{item.status === "registered" ? "登録済み" : "未登録"}</span>{item.status === "pending" && <button type="button" disabled={sending} onClick={() => resend(item)} className="rounded-lg border border-orange-500/35 px-3 py-2 text-xs font-bold text-orange-300 disabled:opacity-40">再送</button>}</div>)}{!loading && filtered.length === 0 && <p className="py-8 text-center text-sm text-white/35">該当する会員はいません。</p>}</div></div>
    </div>}
  </section>;
}
