"use client";

import { FormEvent, useMemo, useState } from "react";
import { BookmarkPlus, CalendarClock, CalendarPlus, Copy, Gauge, PersonStanding, Trash2, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { programClasses } from "@/lib/program-classes";
import type { ScheduleItem } from "@/app/components/SchedulePanel";
import RecurringScheduleList from "@/app/components/RecurringScheduleList";
import { addMonthsToMonthKey, japanMonthKey, japanMonthStartIso } from "@/lib/japan-time";

const japanTimeZone = "Asia/Tokyo";
function localValue(value?: string | null) {
  if (!value) return "";
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: japanTimeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
function japanLocalDate(value: string) { return new Date(`${value}:00+09:00`); }
function dateOnlyUtc(value: string) { return new Date(`${value.slice(0, 10)}T00:00:00Z`); }
function formatJapan(value: Date | string, options?: Intl.DateTimeFormatOptions) { return new Date(value).toLocaleString("ja-JP", { timeZone: japanTimeZone, ...options }); }
function japanDateKey(value: Date | string) { return new Date(value).toLocaleDateString("en-CA", { timeZone: japanTimeZone }); }
function scheduleDateKeys(startsAt: string, endsAt?: string | null) {
  const cursor = dateOnlyUtc(japanDateKey(startsAt));
  const last = dateOnlyUtc(japanDateKey(endsAt ?? startsAt));
  const keys: string[] = [];
  while (cursor <= last && keys.length < 370) { keys.push(cursor.toISOString().slice(0, 10)); cursor.setUTCDate(cursor.getUTCDate() + 1); }
  return keys;
}
const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];
const quickPrograms = [
  { key: "event", icon: PersonStanding, label: "土曜・種目別セッション", description: "毎週土曜 9:00〜12:00", title: "種目別セッション", weekday: 6, hour: 9, minute: 0, duration: 180, scheduleType: "practice", repeat: "weekly", weeks: 12 },
  { key: "open", icon: CalendarPlus, label: "日曜・オープントレーニング", description: "毎週日曜 9:00〜12:00", title: "オープントレーニング", weekday: 0, hour: 9, minute: 0, duration: 180, scheduleType: "practice", repeat: "weekly", weeks: 12 },
  { key: "basic", icon: CalendarClock, label: "平日・基礎セッション", description: "毎週水曜 17:00〜19:00", title: "走り方・基礎セッション", weekday: 3, hour: 17, minute: 0, duration: 120, scheduleType: "practice", repeat: "weekly", weeks: 12 },
  { key: "class", icon: BookmarkPlus, label: "クラス別セッション", description: "平日17:00〜19:00・クラス指定", title: "クラス別セッション", weekday: 3, hour: 17, minute: 0, duration: 120, scheduleType: "practice", repeat: "weekly", weeks: 12, audience: "class" },
  { key: "control", icon: Gauge, label: "月1回・CONTROL TEST", description: "第1日曜 9:00〜12:00", title: "CONTROL TEST / SCAN", weekday: 0, hour: 9, minute: 0, duration: 180, scheduleType: "measurement", repeat: "monthly", weeks: 24 },
  { key: "personal-friday", icon: PersonStanding, label: "金曜・パーソナル枠", description: "毎週金曜 17:00／18:00", title: "パーソナルセッション", weekday: 5, hour: 17, minute: 0, duration: 60, scheduleType: "other", repeat: "weekly", weeks: 12, secondHour: 18 },
  { key: "personal-saturday", icon: PersonStanding, label: "土曜午後・パーソナル枠", description: "毎週土曜 13:00／14:00", title: "パーソナルセッション", weekday: 6, hour: 13, minute: 0, duration: 60, scheduleType: "other", repeat: "weekly", weeks: 12, secondHour: 14 },
  { key: "personal-sunday", icon: PersonStanding, label: "日曜午後・パーソナル枠", description: "毎週日曜 13:00／14:00", title: "パーソナルセッション", weekday: 0, hour: 13, minute: 0, duration: 60, scheduleType: "other", repeat: "weekly", weeks: 12, secondHour: 14 },
] as const;

function nextWeekdayLocal(weekday: number, hour: number, minute: number) {
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: japanTimeZone });
  const date = dateOnlyUtc(`${todayKey}T00:00`);
  const delta = (weekday - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + delta);
  return `${date.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function nextFirstWeekdayLocal(weekday: number, hour: number, minute: number) {
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: japanTimeZone });
  const today = dateOnlyUtc(`${todayKey}T00:00`);
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  first.setUTCDate(1 + (weekday - first.getUTCDay() + 7) % 7);
  if (first < today) {
    first.setUTCMonth(first.getUTCMonth() + 1, 1);
    first.setUTCDate(1 + (weekday - first.getUTCDay() + 7) % 7);
  }
  return `${first.toISOString().slice(0, 10)}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function monthlyOccurrenceLocal(sourceLocal: string, monthOffset: number) {
  const source = dateOnlyUtc(sourceLocal);
  const occurrence = Math.floor((source.getUTCDate() - 1) / 7);
  const weekday = source.getUTCDay();
  const first = new Date(Date.UTC(source.getUTCFullYear(), source.getUTCMonth() + monthOffset, 1));
  first.setUTCDate(1 + (weekday - first.getUTCDay() + 7) % 7 + occurrence * 7);
  return `${first.toISOString().slice(0, 10)}T${sourceLocal.slice(11, 16)}`;
}

export type ScheduleTemplate = { id: number; author_id: string; name: string; title: string; details: string | null; location: string | null; training_phase?: string; schedule_type: string; audience: string; program_class: string | null; weekday: number; start_time: string; duration_minutes: number | null; repeat_type: string; repeat_weeks: number };
export type CompetitionApplicant = { id: number; schedule_id: number; user_id: string; events: string; note: string | null; status: string; created_at: string; player_name: string };

export default function CoachScheduleManager({ initialItems, initialTemplates, initialAttendance, competitionApplicants, initialDate, initialEditingId, showScheduleList = true }: { initialItems: ScheduleItem[]; initialTemplates: ScheduleTemplate[]; initialAttendance: Array<{ schedule_id: number; status: string }>; competitionApplicants: CompetitionApplicant[]; initialDate?: string; initialEditingId?: number | null; showScheduleList?: boolean }) {
  const initialEditingItem = initialItems.find((item) => item.id === initialEditingId);
  const initialStart = initialEditingItem ? localValue(initialEditingItem.starts_at) : initialDate ? `${initialDate}T18:00` : "";
  const router = useRouter();
  const [open, setOpen] = useState(Boolean(initialEditingItem || initialDate)); const [saving, setSaving] = useState(false); const [editingId, setEditingId] = useState<number | null>(initialEditingItem?.id ?? null);
  const [copyOpen, setCopyOpen] = useState(false); const [copying, setCopying] = useState(false);
  const [title, setTitle] = useState(initialEditingItem?.title ?? ""); const [details, setDetails] = useState(initialEditingItem?.details ?? ""); const [location, setLocation] = useState(initialEditingItem?.location ?? ""); const [startsAt, setStartsAt] = useState(initialStart); const [endsAt, setEndsAt] = useState(localValue(initialEditingItem?.ends_at)); const [scheduleType, setScheduleType] = useState(initialEditingItem?.schedule_type ?? "practice"); const [audience, setAudience] = useState(initialEditingItem?.audience ?? "all"); const [programClass, setProgramClass] = useState(initialEditingItem?.program_class ?? "ジュニア"); const [repeat, setRepeat] = useState("once"); const [repeatUntil, setRepeatUntil] = useState("");
  const [allDay, setAllDay] = useState(initialEditingItem?.all_day ?? false);
  const [secondSlotHour, setSecondSlotHour] = useState<number | null>(null);
  const [isPersonalSlot, setIsPersonalSlot] = useState(initialEditingItem?.is_personal_slot ?? false);
  const [notifyMembers, setNotifyMembers] = useState(false);
  const [trainingPhase, setTrainingPhase] = useState(initialEditingItem?.training_phase ?? "normal");
  const [registrationEnabled, setRegistrationEnabled] = useState(initialEditingItem?.registration_enabled ?? false); const [registrationOpensAt, setRegistrationOpensAt] = useState(localValue(initialEditingItem?.registration_opens_at)); const [registrationDeadline, setRegistrationDeadline] = useState(localValue(initialEditingItem?.registration_deadline));
  const [selectedTemplate, setSelectedTemplate] = useState(""); const [templateSaving, setTemplateSaving] = useState(false);
  const occurrenceLocals = useMemo(() => {
    if (!startsAt) return [];
    if (repeat === "once" || !repeatUntil) return [startsAt];
    if (repeat === "weekly") {
      const start = dateOnlyUtc(startsAt); const until = dateOnlyUtc(repeatUntil);
      const count = Math.max(0, Math.min(104, Math.floor((until.getTime() - start.getTime()) / (7 * 86400000)) + 1));
      return Array.from({ length: count }, (_, index) => { const date = new Date(start); date.setUTCDate(date.getUTCDate() + index * 7); return `${date.toISOString().slice(0, 10)}T${startsAt.slice(11, 16)}`; });
    }
    return Array.from({ length: 24 }, (_, index) => monthlyOccurrenceLocal(startsAt, index)).filter((value) => value.slice(0, 10) <= repeatUntil);
  }, [repeat, startsAt, repeatUntil]);
  const occurrenceCount = occurrenceLocals.length * (secondSlotHour === null ? 1 : 2);
  const weekday = startsAt ? weekdayLabels[dateOnlyUtc(startsAt).getUTCDay()] : "—";
  function reset() { setOpen(false); setEditingId(null); setSelectedTemplate(""); setTitle(""); setDetails(""); setLocation(""); setStartsAt(""); setEndsAt(""); setAllDay(false); setSecondSlotHour(null); setIsPersonalSlot(false); setNotifyMembers(false); setTrainingPhase("normal"); setScheduleType("practice"); setAudience("all"); setRepeat("once"); setRepeatUntil(""); setRegistrationEnabled(false); setRegistrationOpensAt(""); setRegistrationDeadline(""); }
  function startNew(type: "practice" | "competition" = "practice") { reset(); setScheduleType(type); setOpen(true); }
  function applyQuickProgram(program: (typeof quickPrograms)[number]) {
    reset();
    const start = program.repeat === "monthly" ? nextFirstWeekdayLocal(program.weekday, program.hour, program.minute) : nextWeekdayLocal(program.weekday, program.hour, program.minute);
    const startDate = japanLocalDate(start);
    const end = new Date(startDate.getTime() + program.duration * 60000);
    const until = new Date(dateOnlyUtc(start));
    until.setUTCDate(until.getUTCDate() + (program.weeks - 1) * 7);
    setTitle(program.title); setScheduleType(program.scheduleType); setStartsAt(start); setEndsAt(localValue(end.toISOString())); setRepeat(program.repeat); setRepeatUntil(until.toISOString().slice(0, 10)); setAudience("audience" in program ? program.audience : "all"); setSecondSlotHour("secondHour" in program ? program.secondHour : null); setIsPersonalSlot("secondHour" in program); setOpen(true);
  }
  function edit(item: ScheduleItem) { reset(); setEditingId(item.id); setTitle(item.title); setDetails(item.details ?? ""); setLocation(item.location ?? ""); setStartsAt(localValue(item.starts_at)); setEndsAt(localValue(item.ends_at)); setAllDay(item.all_day ?? false); setIsPersonalSlot(item.is_personal_slot ?? false); setTrainingPhase(item.training_phase ?? "normal"); setScheduleType(item.schedule_type); setAudience(item.audience); setProgramClass(item.program_class ?? "ジュニア"); setRegistrationEnabled(item.registration_enabled ?? false); setRegistrationOpensAt(localValue(item.registration_opens_at)); setRegistrationDeadline(localValue(item.registration_deadline)); setOpen(true); }
  function applyTemplate(id: string) {
    setSelectedTemplate(id); const template = initialTemplates.find((item) => String(item.id) === id); if (!template) return;
    const baseLocal = startsAt || localValue(new Date().toISOString()); const [hours, minutes] = template.start_time.split(":").map(Number); const start = japanLocalDate(`${baseLocal.slice(0, 10)}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
    setTitle(template.title); setDetails(template.details ?? ""); setLocation(template.location ?? ""); setTrainingPhase(template.training_phase ?? "normal"); setScheduleType(template.schedule_type); setAudience(template.audience); setProgramClass(template.program_class ?? "ジュニア"); setStartsAt(localValue(start.toISOString()));
    setEndsAt(template.duration_minutes === null ? "" : localValue(new Date(start.getTime() + template.duration_minutes * 60000).toISOString())); setRepeat(template.repeat_type);
    if (template.repeat_type === "weekly") { const until = new Date(start); until.setDate(start.getDate() + (template.repeat_weeks - 1) * 7); setRepeatUntil(localValue(until.toISOString()).slice(0, 10)); } else setRepeatUntil("");
  }
  async function saveTemplate() {
    if (!title.trim() || !startsAt) { alert("予定名と開始日時を入力してから保存してください。"); return; }
    const name = prompt("テンプレート名", title.trim()); if (!name?.trim()) return;
    setTemplateSaving(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { setTemplateSaving(false); return; }
    const start = japanLocalDate(startsAt); const end = endsAt ? japanLocalDate(endsAt) : null; const repeatWeeks = repeat === "weekly" && repeatUntil ? Math.max(1, occurrenceCount) : 1;
    const row = { author_id: user.id, name: name.trim(), title: title.trim(), details: details.trim() || null, location: location.trim() || null, training_phase: trainingPhase, schedule_type: scheduleType, audience, program_class: audience === "class" ? programClass : null, weekday: dateOnlyUtc(startsAt).getUTCDay(), start_time: `${startsAt.slice(11, 16)}:00`, duration_minutes: end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : null, repeat_type: repeat === "monthly" ? "once" : repeat, repeat_weeks: repeatWeeks, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("schedule_templates").upsert(row, { onConflict: "author_id,name" }); setTemplateSaving(false); if (error) { alert(error.message); return; } router.refresh();
  }
  async function removeTemplate() {
    if (!selectedTemplate) return; const template = initialTemplates.find((item) => String(item.id) === selectedTemplate); if (!template || !confirm(`テンプレート「${template.name}」を削除しますか？`)) return;
    const { error } = await createClient().from("schedule_templates").delete().eq("id", template.id); if (error) { alert(error.message); return; } setSelectedTemplate(""); router.refresh();
  }
  async function copyMonth(sourceOffset: -1 | 0) {
    const currentMonth = japanMonthKey(); const sourceMonth = addMonthsToMonthKey(currentMonth, sourceOffset); const targetMonth = addMonthsToMonthKey(sourceMonth, 1); const followingMonth = addMonthsToMonthKey(targetMonth, 1);
    const sourceStart = japanMonthStartIso(sourceMonth); const sourceEnd = japanMonthStartIso(targetMonth); const targetStart = japanMonthStartIso(targetMonth); const targetEnd = japanMonthStartIso(followingMonth);
    const sourceLabel = `${sourceMonth.slice(0, 4)}年${Number(sourceMonth.slice(5))}月`; const targetLabel = `${targetMonth.slice(0, 4)}年${Number(targetMonth.slice(5))}月`;
    if (!confirm(`${sourceLabel}の予定を、曜日を保ったまま${targetLabel}へ複製しますか？\nすでに同じ予定がある場合は登録しません。`)) return;
    setCopying(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) { setCopying(false); return; }
    const [{ data: sourceItems, error: sourceError }, { data: targetItems, error: targetError }, { data: competitionItems, error: competitionError }] = await Promise.all([
      supabase.from("schedules").select("*").eq("author_id", user.id).gte("starts_at", sourceStart).lt("starts_at", sourceEnd).order("starts_at"),
      supabase.from("schedules").select("title, starts_at, audience, program_class").eq("author_id", user.id).gte("starts_at", targetStart).lt("starts_at", targetEnd),
      supabase.from("schedules").select("starts_at, ends_at").eq("schedule_type", "competition"),
    ]);
    if (sourceError || targetError || competitionError) { setCopying(false); alert(sourceError?.message ?? targetError?.message ?? competitionError?.message); return; }
    if (!sourceItems?.length) { setCopying(false); alert(`${sourceLabel}に複製できる予定がありません。`); return; }
    const existing = new Set((targetItems ?? []).map((item) => scheduleKey(item.title, new Date(item.starts_at), item.audience, item.program_class)));
    const competitionDates = new Set((competitionItems ?? []).flatMap((item) => scheduleDateKeys(item.starts_at, item.ends_at)));
    let skippedCompetitionCount = 0;
    const rows = sourceItems.flatMap((item) => { const sourceDate = new Date(item.starts_at); const copiedStart = sameWeekdayOccurrence(item.starts_at, targetMonth); if (!copiedStart) return []; const key = scheduleKey(item.title, copiedStart, item.audience, item.program_class); if (existing.has(key)) return []; existing.add(key); if (competitionDates.has(japanDateKey(copiedStart))) { skippedCompetitionCount += 1; return []; } const duration = item.ends_at ? new Date(item.ends_at).getTime() - sourceDate.getTime() : null; return [{ author_id: user.id, title: item.title, details: item.details, location: item.location, all_day: item.all_day ?? false, training_phase: item.training_phase ?? "normal", schedule_type: item.schedule_type, audience: item.audience, program_class: item.program_class, starts_at: copiedStart.toISOString(), ends_at: duration === null ? null : new Date(copiedStart.getTime() + duration).toISOString(), updated_at: new Date().toISOString() }]; });
    if (!rows.length) { setCopying(false); alert(skippedCompetitionCount ? "対象日はすべて大会日と重なるため、予定を複製しませんでした。" : "対象月には同じ予定がすでに登録されています。"); return; }
    const { error } = await supabase.from("schedules").insert(rows); if (error) { setCopying(false); alert(error.message); return; }
    setCopying(false); setCopyOpen(false); alert(`${targetLabel}へ${rows.length}件の予定を複製しました。${skippedCompetitionCount ? ` 大会日の${skippedCompetitionCount}件は除外しました。` : ""}`); router.refresh();
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (repeat !== "once" && occurrenceCount < 1) { alert("繰り返し終了日は開始日以降にしてください。"); return; }
    setSaving(true); const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const start = japanLocalDate(startsAt); const end = endsAt ? japanLocalDate(endsAt) : null;
    if (end && end < start) { setSaving(false); alert("終了日時は開始日時より後にしてください。"); return; }
    if (scheduleType === "competition" && registrationEnabled && registrationOpensAt && registrationDeadline && japanLocalDate(registrationDeadline) < japanLocalDate(registrationOpensAt)) { setSaving(false); alert("申込締切は申込開始日時より後にしてください。"); return; }
    const duration = end ? end.getTime() - start.getTime() : null;
    const base = { author_id: user.id, title: title.trim(), details: details.trim() || null, location: location.trim() || null, all_day: allDay, training_phase: trainingPhase, schedule_type: scheduleType, audience, program_class: audience === "class" ? programClass : null, is_personal_slot: isPersonalSlot, registration_enabled: scheduleType === "competition" && registrationEnabled, registration_opens_at: scheduleType === "competition" && registrationEnabled && registrationOpensAt ? japanLocalDate(registrationOpensAt).toISOString() : null, registration_deadline: scheduleType === "competition" && registrationEnabled && registrationDeadline ? japanLocalDate(registrationDeadline).toISOString() : null, updated_at: new Date().toISOString() };
    let result; let savedOccurrenceCount = occurrenceCount; let skippedCompetitionCount = 0;
    if (editingId) {
      result = await supabase.from("schedules").update({ ...base, starts_at: start.toISOString(), ends_at: end?.toISOString() ?? null }).eq("id", editingId);
    } else if (repeat !== "once") {
      const { data: existingItems, error: competitionError } = await supabase.from("schedules").select("starts_at, ends_at, schedule_type");
      if (competitionError) { setSaving(false); alert(competitionError.message); return; }
      const competitionDates = new Set((existingItems ?? []).filter((item) => item.schedule_type === "competition").flatMap((item) => scheduleDateKeys(item.starts_at, item.ends_at)));
      const registrationLocals = occurrenceLocals.flatMap((occurrenceLocal) => secondSlotHour === null ? [occurrenceLocal] : [occurrenceLocal, `${occurrenceLocal.slice(0, 10)}T${String(secondSlotHour).padStart(2, "0")}:00`]);
      const candidates = registrationLocals.map((occurrenceLocal) => { const occurrenceStart = japanLocalDate(occurrenceLocal); return { ...base, starts_at: occurrenceStart.toISOString(), ends_at: duration === null ? null : new Date(occurrenceStart.getTime() + duration).toISOString() }; });
      const rows = candidates.filter((row) => !competitionDates.has(japanDateKey(row.starts_at)) && (!isPersonalSlot || !(existingItems ?? []).some((item) => new Date(item.starts_at) < new Date(row.ends_at ?? row.starts_at) && new Date(item.ends_at ?? item.starts_at) > new Date(row.starts_at))));
      skippedCompetitionCount = candidates.length - rows.length; savedOccurrenceCount = rows.length;
      if (!rows.length) { setSaving(false); alert(isPersonalSlot ? "対象枠は大会日または既存予定と重なるため、登録しませんでした。" : "対象日はすべて大会日と重なるため、予定を登録しませんでした。"); return; }
      result = await supabase.from("schedules").insert(rows);
    } else {
      result = await supabase.from("schedules").insert({ ...base, starts_at: start.toISOString(), ends_at: end?.toISOString() ?? null });
    }
    if (result.error) { setSaving(false); alert(result.error.message); return; }
    const summary = repeat !== "once" && !editingId ? `${startsAt.slice(0, 10).replaceAll("-", "/")}から${repeatUntil.replaceAll("-", "/")}まで、${repeat === "monthly" ? `毎月第${Math.floor((dateOnlyUtc(startsAt).getUTCDate() - 1) / 7) + 1}${weekday}曜日` : `毎週${weekday}曜日`} ${startsAt.slice(11, 16)}（全${savedOccurrenceCount}回）` : `${formatJapan(start)} ${location || "場所未定"}`;
    if (notifyMembers) {
      await supabase.from("announcements").insert({ author_id: user.id, title: `${editingId ? "予定変更" : "新しい予定"}：${title}`, body: summary, audience, program_class: audience === "class" ? programClass : null, priority: editingId ? "important" : "normal" });
      fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "schedule", title: `${editingId ? "予定変更" : "新しい予定"}：${title}`, body: summary, audience, programClass: audience === "class" ? programClass : null }) }).catch(() => undefined);
    }
    setSaving(false); reset(); if (skippedCompetitionCount) alert(`${savedOccurrenceCount}件を登録しました。${isPersonalSlot ? "大会日または既存予定と重なる" : "大会日の"}${skippedCompetitionCount}件は除外しました。`); router.refresh();
  }
  async function remove(item: ScheduleItem) { if (!confirm(`「${item.title}」を削除しますか？`)) return; const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { error } = await supabase.from("schedules").delete().eq("id", item.id); if (error) { alert(error.message); return; } const body = `${formatJapan(item.starts_at)}の予定は中止になりました。`; await supabase.from("announcements").insert({ author_id: user.id, title: `予定中止：${item.title}`, body, audience: item.audience, program_class: item.program_class, priority: "important" }); fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "schedule", title: `予定中止：${item.title}`, body, audience: item.audience, programClass: item.program_class }) }).catch(() => undefined); router.refresh(); }
  async function removeMany(items: ScheduleItem[]) { const first = items[0]; if (!confirm(`「${first.title}」の繰り返し予定 ${items.length}件をすべて削除しますか？`)) return; const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { error } = await supabase.from("schedules").delete().in("id", items.map((item) => item.id)); if (error) { alert(error.message); return; } const body = `${shortRange(items)}の繰り返し予定は中止になりました。`; await supabase.from("announcements").insert({ author_id: user.id, title: `予定中止：${first.title}`, body, audience: first.audience, program_class: first.program_class, priority: "important" }); fetch("/api/push/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "schedule", title: `予定中止：${first.title}`, body, audience: first.audience, programClass: first.program_class }) }).catch(() => undefined); router.refresh(); }
  return <section className="mt-8 rounded-2xl border border-white/10 bg-[#111] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-black">スケジュール管理</h2><p className="mt-1 text-xs text-white/40">練習・試合・測定予定を登録できます。</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setCopyOpen((current) => !current)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-sm font-bold text-white/75"><Copy size={16} />月の予定をコピー</button><button type="button" onClick={() => startNew("competition")} className="inline-flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm font-black text-red-300"><Trophy size={17} />試合を追加</button><button type="button" onClick={() => startNew()} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black"><CalendarPlus size={17} />予定を追加</button></div></div>
    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/[.045] p-4"><div className="flex items-center gap-2"><CalendarClock size={17} className="text-emerald-300"/><div><strong className="block text-sm">定期プログラムを設定</strong><span className="text-[11px] text-white/40">選ぶと曜日・時間・約3か月分を自動入力します</span></div></div><div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">{quickPrograms.map((program) => { const Icon = program.icon; return <button key={program.key} type="button" onClick={() => applyQuickProgram(program)} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-left transition hover:border-emerald-400/35"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300"><Icon size={17}/></span><span><strong className="block text-xs">{program.label}</strong><span className="mt-1 block text-[10px] text-white/35">{program.description}</span></span></button>; })}</div></div>
    {copyOpen && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4"><strong className="block text-sm">どの月をコピーしますか？</strong><p className="mt-1 text-xs text-white/40">同じ第○曜日と時刻を保って複製します。重複する予定は自動で除外されます。</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" disabled={copying} onClick={() => copyMonth(-1)} className="rounded-lg border border-orange-500/35 bg-orange-500/[0.07] px-4 py-3 text-sm font-bold text-orange-300 disabled:opacity-40">先月の予定を今月へコピー</button><button type="button" disabled={copying} onClick={() => copyMonth(0)} className="rounded-lg border border-orange-500/35 bg-orange-500/[0.07] px-4 py-3 text-sm font-bold text-orange-300 disabled:opacity-40">今月分を来月へまとめて複製</button></div>{copying && <p className="mt-3 text-center text-xs text-orange-300">予定を確認して複製しています…</p>}</div>}
    {open && <form onSubmit={submit} className="mt-5 border-t border-white/10 pt-5"><div className="mb-4 rounded-xl border border-orange-500/20 bg-orange-500/[0.05] p-3"><span className="mb-2 block text-xs font-bold text-orange-300">予定テンプレート</span><div className="flex flex-wrap gap-2"><select value={selectedTemplate} onChange={(e) => applyTemplate(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#111] px-3 py-2.5 text-sm"><option value="">テンプレートを選択</option>{initialTemplates.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={saveTemplate} disabled={templateSaving} className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 px-3 py-2 text-xs font-bold text-orange-300 disabled:opacity-40"><BookmarkPlus size={15} />{templateSaving ? "保存中" : "現在の内容を保存"}</button>{selectedTemplate && <button type="button" onClick={removeTemplate} aria-label="選択中のテンプレートを削除" className="rounded-lg border border-red-500/30 p-2.5 text-red-400"><Trash2 size={16} /></button>}</div><p className="mt-2 text-[11px] text-white/35">内容と時刻だけを反映します。日付は選択中の日付を維持し、未選択の場合は今日になります。</p></div>{scheduleType === "competition" && <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/25 bg-red-500/[0.07] p-3 text-sm font-bold text-red-200"><Trophy size={18}/>試合・大会予定を登録します</div>}<div className="grid gap-3 sm:grid-cols-2"><input required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={scheduleType === "competition" ? "大会名・試合名" : "予定名"} className="rounded-lg border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-orange-500 sm:col-span-2" /><label className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-bold sm:col-span-2"><input type="checkbox" checked={allDay} onChange={(event) => setAllDay(event.target.checked)} className="h-4 w-4 accent-orange-500"/>時刻を指定せず終日予定にする</label><label><span className="mb-1 block text-[11px] text-white/45">{allDay ? "開始日" : "開始日時"}</span><input required type={allDay ? "date" : "datetime-local"} value={allDay ? startsAt.slice(0, 10) : startsAt} onChange={(e) => setStartsAt(allDay ? `${e.target.value}T00:00` : e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]" /></label><label><span className="mb-1 block text-[11px] text-white/45">{allDay ? "終了日（任意）" : "終了日時（任意）"}</span><input type={allDay ? "date" : "datetime-local"} value={allDay ? endsAt.slice(0, 10) : endsAt} onChange={(e) => setEndsAt(allDay && e.target.value ? `${e.target.value}T00:00` : e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]" /></label>
      {!editingId && <><label><span className="mb-1 block text-[11px] text-white/45">繰り返し</span><select value={repeat} onChange={(e) => setRepeat(e.target.value)} className="w-full rounded-lg border border-white/15 bg-[#111] px-4 py-3"><option value="once">繰り返さない</option><option value="weekly">毎週</option><option value="monthly">月1回（同じ第○曜日）</option></select></label>{repeat !== "once" && <label><span className="mb-1 block text-[11px] text-white/45">いつまで</span><input required type="date" min={startsAt.slice(0, 10)} value={repeatUntil} onChange={(e) => setRepeatUntil(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-4 py-3 [color-scheme:dark]" /></label>}{repeat !== "once" && startsAt && repeatUntil && <div className="rounded-lg border border-orange-500/25 bg-orange-500/[0.07] px-4 py-3 text-sm text-orange-200 sm:col-span-2">{repeat === "monthly" ? `毎月第${Math.floor((dateOnlyUtc(startsAt).getUTCDate() - 1) / 7) + 1}${weekday}曜日` : `毎週${weekday}曜日`}・{startsAt.slice(11, 16)}に固定して、全{occurrenceCount}回を一括登録します。</div>}</>}
      <input maxLength={200} value={location} onChange={(e) => setLocation(e.target.value)} placeholder={scheduleType === "competition" ? "競技場・会場" : "場所"} className="rounded-lg border border-white/15 bg-black/30 px-4 py-3" /><select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} className="rounded-lg border border-white/15 bg-[#111] px-4 py-3"><option value="practice">練習</option><option value="competition">試合・大会</option><option value="measurement">測定</option><option value="other">その他</option></select><select value={audience} onChange={(e) => setAudience(e.target.value)} className="rounded-lg border border-white/15 bg-[#111] px-4 py-3"><option value="all">全会員</option><option value="class">クラス指定</option></select>{audience === "class" && <select value={programClass} onChange={(e) => setProgramClass(e.target.value)} className="rounded-lg border border-white/15 bg-[#111] px-4 py-3">{programClasses.map((item) => <option key={item}>{item}</option>)}</select>}<textarea maxLength={2000} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder={scheduleType === "competition" ? "集合時間・出場種目・持ち物・申込情報など" : "詳細・持ち物"} className="resize-none rounded-lg border border-white/15 bg-black/30 px-4 py-3 sm:col-span-2" />{scheduleType === "competition" ? <div className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-4 sm:col-span-2"><label className="flex items-center gap-2 text-sm font-black text-red-200"><input type="checkbox" checked={registrationEnabled} onChange={(event) => setRegistrationEnabled(event.target.checked)} className="h-4 w-4 accent-red-500"/>会員マイページからの申込を受け付ける</label>{registrationEnabled ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-[11px] text-white/45">申込開始（空欄なら公開直後から）</span><input type="datetime-local" value={registrationOpensAt} onChange={(event) => setRegistrationOpensAt(event.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 [color-scheme:dark]"/></label><label><span className="mb-1 block text-[11px] text-white/45">申込締切</span><input required type="datetime-local" value={registrationDeadline} onChange={(event) => setRegistrationDeadline(event.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 [color-scheme:dark]"/></label></div> : null}</div> : null}</div><label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-xl border p-4 ${notifyMembers ? "border-orange-500/40 bg-orange-500/[0.08]" : "border-white/10 bg-black/20"}`}><input type="checkbox" checked={notifyMembers} onChange={(event) => setNotifyMembers(event.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-500"/><span><strong className="block text-sm">会員へ通知する</strong><span className="mt-1 block text-xs leading-5 text-white/40">{notifyMembers ? "保存後、お知らせとスマホ通知を1回送ります。" : "初期設定は通知なし。予定だけをカレンダーへ保存します。"}</span></span></label><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={reset} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/60">キャンセル</button><button disabled={saving || (repeat !== "once" && occurrenceCount < 1)} className={`rounded-lg px-4 py-2 text-sm font-black disabled:opacity-40 ${scheduleType === "competition" ? "bg-red-500 text-white" : "bg-orange-500"}`}>{saving ? "保存中" : editingId ? "変更を保存" : repeat !== "once" ? `${occurrenceCount}件を一括登録` : scheduleType === "competition" ? "試合予定を公開" : "予定を公開"}</button></div></form>}
    {showScheduleList && initialItems.length > 0 && <details className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.03] p-4"><summary className="cursor-pointer text-sm font-black text-red-200">登録済み予定の確認・一括削除（{initialItems.length}件）</summary><p className="mt-2 text-xs leading-5 text-white/40">対象クラスを開き、繰り返し予定の「全○件削除」からまとめて削除できます。</p><RecurringScheduleList items={initialItems} attendance={initialAttendance} onEdit={edit} onRemove={remove} onRemoveMany={removeMany} /></details>}
    {competitionApplicants.length > 0 ? <div className="mt-6 border-t border-white/10 pt-5"><h3 className="font-black">試合申込者</h3><div className="mt-3 space-y-3">{initialItems.filter((item) => item.schedule_type === "competition" && competitionApplicants.some((applicant) => applicant.schedule_id === item.id && applicant.status === "submitted")).map((item) => { const applicants = competitionApplicants.filter((applicant) => applicant.schedule_id === item.id && applicant.status === "submitted"); return <details key={item.id} className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4"><summary className="cursor-pointer font-bold text-red-200">{item.title}（{applicants.length}名）</summary><div className="mt-3 divide-y divide-white/10">{applicants.map((applicant) => <div key={applicant.id} className="py-3 text-sm"><strong>{applicant.player_name}</strong><p className="mt-1 text-white/65">出場種目：{applicant.events}</p>{applicant.note ? <p className="mt-1 text-white/40">{applicant.note}</p> : null}</div>)}</div></details>; })}</div></div> : null}
  </section>;
}

function shortRange(items: ScheduleItem[]) { const sorted = [...items].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()); return `${formatJapan(sorted[0].starts_at, { year: "numeric", month: "numeric", day: "numeric" })}〜${formatJapan(sorted.at(-1)!.starts_at, { year: "numeric", month: "numeric", day: "numeric" })}`; }
function sameWeekdayOccurrence(sourceValue: string, targetMonth: string) { const sourceLocal = localValue(sourceValue); const sourceDay = Number(sourceLocal.slice(8, 10)); const occurrence = Math.floor((sourceDay - 1) / 7); const sourceWeekday = dateOnlyUtc(sourceLocal).getUTCDay(); const first = dateOnlyUtc(`${targetMonth}-01`); const day = 1 + (sourceWeekday - first.getUTCDay() + 7) % 7 + occurrence * 7; first.setUTCDate(day); if (first.toISOString().slice(0, 7) !== targetMonth) return null; return japanLocalDate(`${first.toISOString().slice(0, 10)}T${sourceLocal.slice(11, 16)}`); }
function scheduleKey(title: string, startsAt: Date, audience: string, programClass: string | null) { return [title, startsAt.toISOString(), audience, programClass ?? ""].join("|"); }
