import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { evaluateAthleteScan, type AthleteMeasurement, type AthleteStandard, type TypeSettings } from "@/lib/athlete-scan";
import { unitMap } from "@/lib/performance-events";
import { addMonthsToMonthKey, japanMonthKey, japanMonthStartIso } from "@/lib/japan-time";

export type FamilyAthlete = {
  id: string;
  name: string;
  grade: string | null;
  event: string | null;
  programClass: string | null;
  gender: string | null;
  guardianRole: "primary_guardian" | "family_member";
  relationship: string;
};

export type FamilyContext = {
  guardianId: string;
  guardianName: string;
  athletes: FamilyAthlete[];
  athlete: FamilyAthlete;
};

export async function requireFamilyContext(requestedAthleteId?: string | null): Promise<FamilyContext> {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const guardianId = authData?.claims.sub;
  if (!guardianId) redirect(`/login?next=${encodeURIComponent(requestedAthleteId ? `/family?athlete=${requestedAthleteId}` : "/family")}`);

  const [{ data: links }, { data: guardian }] = await Promise.all([
    supabase.from("guardian_athlete_links").select("athlete_id,guardian_role,relationship").eq("guardian_id", guardianId).eq("status", "active"),
    supabase.from("family_guardians").select("name").eq("user_id", guardianId).maybeSingle(),
  ]);
  if (!links?.length) redirect("/family/welcome");

  const admin = createAdminClient();
  const athleteIds = links.map((link) => link.athlete_id);
  const { data: players } = await admin.from("players").select("user_id,name,grade,event,program_class,gender,member_status").in("user_id", athleteIds);
  const linkByAthlete = new Map(links.map((link) => [link.athlete_id, link]));
  const athletes = (players ?? []).filter((player) => player.member_status !== "withdrawn").map((player) => {
    const link = linkByAthlete.get(player.user_id)!;
    return {
      id: player.user_id,
      name: player.name || "選手",
      grade: player.grade,
      event: player.event,
      programClass: player.program_class,
      gender: player.gender,
      guardianRole: link.guardian_role as FamilyAthlete["guardianRole"],
      relationship: link.relationship,
    };
  });
  const athlete = athletes.find((item) => item.id === requestedAthleteId) ?? athletes[0];
  if (!athlete) redirect("/family/welcome");
  return { guardianId, guardianName: guardian?.name || "保護者", athletes, athlete };
}

type SafeRecord = { id: number; date: string; category: string; value: number; record_kind: string };
type FamilySchedule = { id: number; title: string; location: string | null; starts_at: string; ends_at: string | null; all_day: boolean; schedule_type: string; audience: string; program_class: string | null };

const round = (value: number) => Math.round(value * 10) / 10;

export async function loadFamilyData(context: FamilyContext, reportMonth?: string | null) {
  const admin = createAdminClient();
  const now = new Date();
  const selectedMonth = /^\d{4}-\d{2}$/.test(reportMonth ?? "") ? reportMonth! : japanMonthKey(now);
  const monthStart = `${selectedMonth}-01`;
  const nextMonth = `${addMonthsToMonthKey(selectedMonth, 1)}-01`;
  const historyMonth = addMonthsToMonthKey(selectedMonth, -11);
  const historyStartDate = `${historyMonth}-01`;
  const historyStartIso = japanMonthStartIso(historyMonth);

  const [recordsResult, schedulesResult, attendanceResult, reportsResult, announcementsResult, scansResult, currentStandardResult] = await Promise.all([
    admin.from("performance_records").select("id,date,category,value,record_kind").eq("user_id", context.athlete.id).gte("date", historyStartDate).order("date"),
    admin.from("schedules").select("id,title,location,starts_at,ends_at,all_day,schedule_type,audience,program_class").gte("starts_at", historyStartIso).order("starts_at"),
    admin.from("schedule_attendance").select("schedule_id,status").eq("user_id", context.athlete.id),
    admin.from("family_monthly_reports").select("id,report_month,coach_message,next_month,published,updated_at").eq("athlete_id", context.athlete.id).eq("published", true).order("report_month", { ascending: false }),
    admin.from("announcements").select("id,title,body,priority,created_at,audience,program_class").order("created_at", { ascending: false }).limit(20),
    admin.from("control_test_scans").select("id,scan_number,measured_on,athlete_standard_version,contact_profile_snapshot,control_test_measurements(test_code,primary_value,metrics,implement_weight_kg,implement_name,equipment,distance_m,jump_count)").eq("user_id", context.athlete.id).eq("status", "complete").order("scan_number"),
    admin.from("athlete_scan_standard_sets").select("version").eq("is_current", true).maybeSingle(),
  ]);

  const records = (recordsResult.data ?? []) as SafeRecord[];
  const schedules = (schedulesResult.data ?? []).filter((item) => item.audience === "all" || item.program_class === context.athlete.programClass) as FamilySchedule[];
  const attendance = new Map((attendanceResult.data ?? []).map((item) => [item.schedule_id, item.status]));
  const monthSchedules = schedules.filter((item) => japanMonthKey(item.starts_at) === selectedMonth && attendance.get(item.id) === "attending");
  const nextSession = schedules.find((item) => new Date(item.ends_at ?? item.starts_at) >= now) ?? null;

  const monthRecords = records.filter((record) => record.date >= monthStart && record.date < nextMonth);
  const previousRecords = records.filter((record) => record.date < monthStart);
  const pbUpdates = [...new Set(monthRecords.map((record) => record.category))].filter((category) => {
    const currentValues = monthRecords.filter((record) => record.category === category).map((record) => Number(record.value));
    const previousValues = previousRecords.filter((record) => record.category === category).map((record) => Number(record.value));
    if (!previousValues.length || !currentValues.length) return false;
    const lower = unitMap[category] === "秒" || unitMap[category] === "分";
    return lower ? Math.min(...currentValues) < Math.min(...previousValues) : Math.max(...currentValues) > Math.max(...previousValues);
  });
  const recordChanges = [...new Set(records.map((record) => record.category))].flatMap((category) => {
    const categoryRows = records.filter((record) => record.category === category);
    if (categoryRows.length < 2) return [];
    const first = Number(categoryRows[0].value);
    const latest = Number(categoryRows.at(-1)!.value);
    return [{ category, first, latest, unit: unitMap[category] ?? "" }];
  }).slice(0, 4);

  const rawScans = scansResult.data ?? [];
  const version = rawScans.at(-1)?.athlete_standard_version ?? currentStandardResult.data?.version ?? null;
  let scans: Array<{ id: string; measuredOn: string; axes: Record<"SPEED" | "POWER" | "REACTIVE", number | null>; typeName: string | null; contactProfile: string | null }> = [];
  if (version && context.athlete.gender && rawScans.length) {
    const [{ data: standards }, { data: settings }] = await Promise.all([
      admin.from("athlete_scan_standards").select("standard_version,gender,test_code,equipment,weight_kg,distance_m,jump_count,score_100_value,score_0_value,higher_is_better,status,notes").eq("standard_version", version).eq("gender", context.athlete.gender),
      admin.from("athlete_scan_type_settings").select("balanced_max_spread,composite_max_gap,type_descriptions").eq("standard_version", version).maybeSingle(),
    ]);
    if (settings) scans = rawScans.map((scan) => {
      const evaluation = evaluateAthleteScan((scan.control_test_measurements ?? []) as AthleteMeasurement[], (standards ?? []) as AthleteStandard[], settings as TypeSettings);
      const contact = scan.contact_profile_snapshot as Record<string, unknown> | null;
      return { id: scan.id, measuredOn: scan.measured_on, axes: evaluation.axes, typeName: evaluation.typeNameJa, contactProfile: String(contact?.labelJa ?? contact?.nameJa ?? contact?.code ?? "") || null };
    });
  }
  const latestScan = scans.at(-1) ?? null;
  const previousScan = scans.length > 1 ? scans.at(-2)! : null;
  const firstScan = scans.length > 1 ? scans[0] : null;
  const growth = (["SPEED", "POWER", "REACTIVE"] as const).map((axis) => ({
    axis,
    current: latestScan?.axes[axis] ?? null,
    previous: previousScan?.axes[axis] ?? null,
    first: firstScan?.axes[axis] ?? null,
    delta: latestScan?.axes[axis] != null && previousScan?.axes[axis] != null ? round(latestScan.axes[axis]! - previousScan.axes[axis]!) : null,
  }));
  const biggestGrowth = [...growth].filter((item) => item.delta != null).sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999))[0] ?? null;
  const report = (reportsResult.data ?? []).find((item) => item.report_month.slice(0, 7) === selectedMonth) ?? null;
  const announcements = (announcementsResult.data ?? []).filter((item) => item.audience === "all" || item.program_class === context.athlete.programClass);

  return {
    selectedMonth,
    activity: {
      sessions: monthSchedules.filter((item) => item.schedule_type === "practice" && !item.title.toLowerCase().includes("class")).length,
      classes: monthSchedules.filter((item) => item.title.toLowerCase().includes("class") || item.schedule_type === "other").length,
      controlTests: monthSchedules.filter((item) => item.schedule_type === "measurement").length,
      pbUpdates: pbUpdates.length,
    },
    growth, biggestGrowth, latestScan, previousScan, firstScan,
    nextSession: nextSession ? { ...nextSession, attendance: attendance.get(nextSession.id) ?? "unanswered" } : null,
    schedules: schedules.filter((item) => new Date(item.ends_at ?? item.starts_at) >= now).slice(0, 30).map((item) => ({ ...item, attendance: attendance.get(item.id) ?? "unanswered" })),
    report,
    reports: reportsResult.data ?? [],
    recordChanges,
    announcements,
    scanCount: rawScans.length,
  };
}
