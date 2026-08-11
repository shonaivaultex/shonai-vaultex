"use client";

import { FormEvent, useMemo, useState } from "react";
import { BookmarkPlus, CalendarPlus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { programClasses } from "@/lib/program-classes";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import RecurringScheduleList from "@/app/components/RecurringScheduleList";

function localValue(value?: string | null) { if (!value) return ""; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

export type ScheduleTemplate = { id: number; author_id: string; name: string; title: string; details: string | null; location: string | null; schedule_type: string; audience: string; program_class: string | null; weekday: number; start_time: string; duration_minutes: number | null; repeat_type: string; repeat_weeks: number };

export default function CoachScheduleManager({ initialItems, initialTemplates }: { initialItems: ScheduleItem[]; initialTemplates: ScheduleTemplate[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false); const [saving, setSaving] = useState(false); const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState(""); const [details, setDetails] = useState(""); const [location, setLocation] = useState(""); const [startsAt, setStartsAt] = useState(""); const [endsAt, setEndsAt] = useState(""); const [scheduleType, setScheduleType] = useState("practice"); const [audience, setAudience] = useState("all"); const [programClass, setProgramClass] = useState("ジュニア"); const [repeat, setRepeat] = useState("once"); const [repeatUntil, setRepeatUntil] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(""); const [templateSaving, setTemplateSaving] = useState(false);
  const occurrenceCount = useMemo(() => { if (repeat !== "weekly" || !startsAt || !repeatUntil) return 1; const start = new Date(startsAt); const until = new Date(`${repeatUntil}T23:59:59`); return Math.max(0, Math.min(104, Math.floor((until.getTime() - start.getTime()) / (7 * 86400000)) + 1)); }, [repeat, startsAt, repeatUntil]);
  const weekday = startsAt ? weekdayLabels[new Date(startsAt).getDay()] : "—";
  function reset() { setOpen(false); setEditingId(null); setSelectedTemplate(""); setTitle(""); setDetails(""); setLocation(""); setStartsAt(""); setEndsAt(""); setScheduleType("practice"); setAudience("all"); setRepeat("once"); setRepeatUntil(""); }
  function edit(item: ScheduleItem) { reset(); setEditingId(item.id); setTitle(item.title); setDetails(item.details ?? ""); setLocation(item.location ?? ""); setStartsAt(localValue(item.starts_at)); setEndsAt(localValue(item.ends_at)); setScheduleType(item.schedule_type); setAudience(item.audience); setProgramClass(item.program_class ?? "ジュニア"); setOpen(true); }
  function applyTemplate(id: string) {
    setSelectedTemplate(id); const template = initialTemplates.find((item) => String(item.id) === id); if (!template) return;
    const now = new Date(); now.setSeconds(0, 0); const daysAhead = (template.weekday - now.getDay() + 7) % 7; const start = new Date(now); start.setDate(now.getDate() + daysAhead); const [hours, minutes] = template.start_time.split(":").map(Number); start.setHours(hours, minutes, 0, 0);
    if (start < now) start.setDate(start.getDate() + 7);
    setTitle(template.title); setDetails(template.details ?? ""); setLocation(template.location ?? ""); setScheduleType(template.schedule_type); setAudience(template.audience); setProgramClass(template.program_class ?? "ジュニア"); setStartsAt(localValue(start.toISOString()));
    setEndsAt(template.duration_minutes === null ? "" : localValue(new Date(start.getTime() + template.duration_minutes * 60000).toISOString())); setRepeat(template.repeat_type);
    if (template.repeat_type === "weekly") { const until = new Date(start); until.setDate(start.getDate() + (template.repeat_weeks - 1) * 7); setRepeatUntil(localValue(until.toISOString()).slice(0, 10)); } else setRepeatUntil("");
  }
  async function saveTemplate() {
    if (!title.trim() || !startsAt) { alert("予定名と開始日時を入力してから保存してください。"); return; }
    const name = prompt("テンプレート名", title.trim()); if (!name?.trim()) return;
    setTemplateSaving(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { setTemplateSaving(false); return; }
    const start = new Date(startsAt); const end = endsAt ? new Date(endsAt) : null; const repeatWeeks = repeat === "weekly" && repeatUntil ? Math.max(1, occurrenceCount) : 1;
    const row = { author_id: user.id, name: name.trim(), title: title.trim(), details: details.trim() || null, location: location.trim() || null, schedule_type: scheduleType, audience, program_class: audience === "class" ? programClass : null, weekday: start.getDay(), start_time: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:00`, duration_minutes: end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : null, repeat_type: repeat, repeat_weeks: repeatWeeks, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("schedule_templates").upsert(row, { onConflict: "author_id,name" }); setTemplateSaving(false); if (error) { alert(error.message); return; } router.refresh();
  }
  async function removeTemplate() {
    if (!selectedTemplate) return; const template = initialTemplates.find((item) => String(item.id) === selectedTemplate); if (!template || !confirm(`テンプレート「${template.name}」を削除しますか？`)) return;
    const { error } = await createClient().from("schedule_templates").delete().eq("id", template.id); if (error) { alert(error.message); return; } setSelectedTemplate(""); router.refresh();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (repeat === "weekly" && occurrenceCount < 1) { alert("繰り返し終了日は開始日以降にしてください。"); return; }
    setSaving(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const start = new Date(startsAt); const end = endsAt ? new Date(endsAt) : null;
    if (end && end < start) { setSaving(false); alert("終了日時は開始日時より後にしてください。"); return; }
    const duration = end ? end.getTime() - start.getTime() : null;
    const base = { author_id: user.id, title: title.trim(), details: details.trim() || null, location: location.trim() || null, schedule_type: scheduleType, audience, program_class: audience === "class" ? programClass : null, updated_at: new Date().toISOString() };
    let result;
    if (editingId) {
      result = await supabase.from("schedules").update({ ...base, starts_at: start.toISOString(), ends_at: end?.toISOString() ?? null }).eq("id", editingId);
    } else if (repeat === "weekly") {
      const rows = Array.from({ length: occurrenceCount }, (_, index) => { const occurrenceStart = new Date(start); occurrenceStart.setDate(start.getDate() + index * 7); return { ...base, starts_at: occurrenceStart.toISOString(), ends_at: duration === null ? null : new Date(occurrenceStart.getTime() + duration).toISOString() }; });
      result = await supabase.from("schedules").insert(rows);
    } else {
      result = await supabase.from("schedules").insert({ ...base, starts_at: start.toISOString(), ends_at: end?.toISOString() ?? null });
    }
    if (result.error) { setSaving(false); alert(result.error.message); return; }
    const summary = repeat === "weekly" && !editingId ? `${start.toLocaleDateString("ja-JP")}から${new Date(`${repeatUntil}T00:00:00`).toLocaleDateString("ja-JP")}まで、毎週${weekday}曜日 ${start.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}（全${occurrenceCount}回）` : `${start.toLocaleString("ja-JP")} ${location || "場所未定"}`;
    await supabase.from("announcements").insert({ author_id: user.id, title: `${editingId ? "予定変更" : "新しい予定"}：${title}`, body: summary, audience, program_class: audience === "class" ? programClass : null, priority: editingId ? "important" : "normal" });
    setSaving(false); reset(); router.refresh();
  }
  async function remove(item: ScheduleItem) { if (!confirm(`「${item.title}」を削除しますか？`)) return; const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { error } = await supabase.from("schedules").delete().eq("id", item.id); if (error) { alert(error.message); return; } await supabase.from("announcements").insert({ author_id: user.id, title: `予定中止：${item.title}`, body: `${new Date(item.starts_at).toLocaleString("ja-JP")}の予定は中止になりました。`, audience: item.audience, program_class: item.program_class, priority: "important" }); router.refresh(); }
  async function removeMany(items: ScheduleItem[]) { const first = items[0]; if (!confirm(`「${first.title}」の繰り返し予定 ${items.length}件をすべて削除しますか？`)) return; const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { error } = await supabase.from("schedules").delete().in("id", items.map((item) => item.id)); if (error) { alert(error.message); return; } await supabase.from("announcements").insert({ author_id: user.id, title: `予定中止：${first.title}`, body: `${shortRange(items)}の繰り返し予定は中止になりました。`, audience: first.audience, program_class: first.program_class, priority: "important" }); router.refresh(); }
  return <section className="mt-8 rounded-2xl border border-white/10 bg-[#111] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black">スケジュール管理</h2><p className="mt-1 text-xs text-white/40">単発予定と毎週の予定をまとめて登録できます。</p></div><button type="button" onClick={() => { reset(); setOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black"><CalendarPlus size={17} />予定を追加</button></div>
    {open && <form onSubmit={submit} className="mt-5 border-t border-white/10 pt-5"><div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-3"><span className="mb-2 block text-xs font-bold text-orange-300">予定テンプレート</span><div className="flex flex-wrap gap-2"><select value={selectedTemplate} onChange={(e) => applyTemplate(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#111] px-3 py-2.5 text-sm"><option value="">テンプレートを選択</option>{initialTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={saveTemplate} disabled={templateSaving} className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 px-3 py-2 text-xs font-bold text-orange-300 disabled:opacity-40"><BookmarkPlus size={15} />{templateSaving ? "保存中" : "現在の内容を保存"}</button>{selectedTemplate && <button type="button" onClick={removeTemplate} aria-label="選択中のテンプレートを削除" className="rounded-lg border border-red-500/30 p-2.5 text-red-400"><Trash2 size={16} /></button>}</div><p className="mt-2 text-[11px] text-white/35">選ぶと、次に該当する曜日の日付まで自動入力します。</p></div><div className="grid gap-3 sm:grid-cols-2"><input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="予定名" className="rounded-lg border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-orange-500 sm:col-span-2" /><label><span className="mb-1 block text-[11px] text-white/45">開始日時</span><input required type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]" /></label><label><span className="mb-1 block text-[11px] text-white/45">終了日時（任意）</span><input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]" /></label>
      {!editingId && <><label><span className="mb-1 block text-[11px] text-white/45">繰り返し</span><select value={repeat} onChange={(e) => setRepeat(e.target.value)} className="w-full rounded-lg border border-white/15 bg-[#111] px-4 py-3"><option value="once">繰り返さない</option><option value="weekly">毎週</option></select></label>{repeat === "weekly" && <label><span className="mb-1 block text-[11px] text-white/45">いつまで</span><input required type="date" min={startsAt.slice(0, 10)} value={repeatUntil} onChange={(e) => setRepeatUntil(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]" /></label>}{repeat === "weekly" && startsAt && repeatUntil && <div className="rounded-lg border border-orange-500/25 bg-orange-500/[0.07] px-4 py-3 text-sm text-orange-200 sm:col-span-2">毎週{weekday}曜日・{new Date(startsAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}に固定して、全{occurrenceCount}回を一括登録します。</div>}</>}
      <input maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="場所" className="rounded-lg border border-white/15 bg-black/30 px-4 py-3" /><select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} className="rounded-lg border border-white/15 bg-[#111] px-4 py-3"><option value="practice">練習</option><option value="competition">大会</option><option value="measurement">測定</option><option value="other">その他</option></select><select value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-lg border border-white/15 bg-[#111] px-4 py-3"><option value="all">全会員</option><option value="class">クラス指定</option></select>{audience === "class" && <select value={programClass} onChange={(e) => setProgramClass(e.target.value)} className="rounded-lg border border-white/15 bg-[#111] px-4 py-3">{programClasses.map((item) => <option key={item}>{item}</option>)}</select>}<textarea maxLength={2000} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="詳細・持ち物" className="resize-none rounded-lg border border-white/15 bg-black/30 px-4 py-3 sm:col-span-2" /></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={reset} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/60">キャンセル</button><button disabled={saving || (repeat === "weekly" && occurrenceCount < 1)} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-black disabled:opacity-40">{saving ? "保存中" : editingId ? "変更を保存" : repeat === "weekly" ? `${occurrenceCount}件を一括登録` : "予定を公開"}</button></div></form>}
    {initialItems.length > 0 && <RecurringScheduleList items={initialItems} onEdit={edit} onRemove={remove} onRemoveMany={removeMany} />}
  </section>;
}

function shortRange(items: ScheduleItem[]) { const sorted = [...items].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()); return `${new Date(sorted[0].starts_at).toLocaleDateString("ja-JP")}〜${new Date(sorted.at(-1)!.starts_at).toLocaleDateString("ja-JP")}`; }
