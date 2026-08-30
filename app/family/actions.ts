"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shonai-vaultex.vercel.app";

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return { supabase, userId: data?.claims.sub ?? null };
}

async function canManageAthlete(userId: string, athleteId: string) {
  const admin = createAdminClient();
  const [{ data: player }, { data: role }, { data: primary }] = await Promise.all([
    admin.from("players").select("program_class").eq("user_id", athleteId).maybeSingle(),
    admin.from("coach_class_assignments").select("coach_id").eq("coach_id", userId),
    admin.from("guardian_athlete_links").select("guardian_id").eq("guardian_id", userId).eq("athlete_id", athleteId).eq("guardian_role", "primary_guardian").eq("status", "active").maybeSingle(),
  ]);
  if (primary) return true;
  if (!player) return false;
  const { data: assignment } = await admin.from("coach_class_assignments").select("coach_id").eq("coach_id", userId).eq("program_class", player.program_class).maybeSingle();
  return Boolean(role?.length && assignment);
}

export async function createFamilyInvitation(formData: FormData) {
  const { userId } = await currentUserId();
  if (!userId) redirect("/login?next=/coach/family");
  const athleteId = String(formData.get("athlete_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const guardianName = String(formData.get("guardian_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "guardian");
  const guardianRole = String(formData.get("guardian_role") ?? "family_member");
  if (!/^[0-9a-f-]{36}$/i.test(athleteId) || !email.includes("@") || !guardianName || !["father","mother","guardian","other"].includes(relationship) || !["primary_guardian","family_member"].includes(guardianRole)) throw new Error("入力内容を確認してください。");
  if (!(await canManageAthlete(userId, athleteId))) throw new Error("この選手へ保護者を招待する権限がありません。");

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const admin = createAdminClient();
  const { error } = await admin.from("family_invitations").insert({ athlete_id: athleteId, invited_by: userId, email, guardian_name: guardianName, phone: phone || null, relationship, guardian_role: guardianRole, token_hash: tokenHash, expires_at: expiresAt });
  if (error) throw error;

  const acceptPath = `/family/accept?token=${encodeURIComponent(token)}`;
  const callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(acceptPath)}`;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: callbackUrl, data: { portal: "family" } });
  const directUrl = `${siteUrl}${acceptPath}`;
  redirect(`/coach/family?created=1&emailSent=${inviteError ? "0" : "1"}&invite=${encodeURIComponent(directUrl)}`);
}

export async function updateFamilyAttendance(formData: FormData) {
  const { userId } = await currentUserId();
  if (!userId) redirect("/login?next=/family/schedule");
  const athleteId = String(formData.get("athlete_id") ?? "");
  const scheduleId = Number(formData.get("schedule_id"));
  const status = String(formData.get("status") ?? "");
  if (!Number.isInteger(scheduleId) || !["attending","absent","undecided"].includes(status)) throw new Error("出欠内容が正しくありません。");
  const admin = createAdminClient();
  const { data: link } = await admin.from("guardian_athlete_links").select("guardian_role").eq("guardian_id", userId).eq("athlete_id", athleteId).eq("status", "active").maybeSingle();
  if (!link || link.guardian_role !== "primary_guardian") throw new Error("出欠を変更できるのはPRIMARY GUARDIANのみです。");
  const { data: schedule } = await admin.from("schedules").select("id,audience,program_class").eq("id", scheduleId).maybeSingle();
  const { data: player } = await admin.from("players").select("program_class").eq("user_id", athleteId).maybeSingle();
  if (!schedule || !player || (schedule.audience !== "all" && schedule.program_class !== player.program_class)) throw new Error("対象外の予定です。");
  const { error } = await admin.from("schedule_attendance").upsert({ schedule_id: scheduleId, user_id: athleteId, status, updated_at: new Date().toISOString() }, { onConflict: "schedule_id,user_id" });
  if (error) throw error;
  revalidatePath("/family"); revalidatePath("/family/schedule");
}

export async function saveFamilyMonthlyReport(formData: FormData) {
  const { userId } = await currentUserId();
  if (!userId) redirect("/login?next=/coach/family");
  const athleteId = String(formData.get("athlete_id") ?? "");
  const reportMonth = String(formData.get("report_month") ?? "");
  const coachMessage = String(formData.get("coach_message") ?? "").trim();
  const nextMonth = String(formData.get("next_month") ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(reportMonth) || coachMessage.length > 1000 || nextMonth.length > 500 || !(await canManageAthlete(userId, athleteId))) throw new Error("入力内容または権限を確認してください。");
  const admin = createAdminClient();
  const { error } = await admin.from("family_monthly_reports").upsert({ athlete_id: athleteId, report_month: `${reportMonth}-01`, coach_id: userId, coach_message: coachMessage || null, next_month: nextMonth || null, published: true, updated_at: new Date().toISOString() }, { onConflict: "athlete_id,report_month" });
  if (error) throw error;
  revalidatePath("/coach/family"); revalidatePath("/family"); revalidatePath("/family/growth");
  redirect(`/coach/family?athlete=${athleteId}&saved=1`);
}

export async function revokeFamilyLink(formData: FormData) {
  const { userId } = await currentUserId();
  if (!userId) redirect("/login?next=/family/settings");
  const athleteId = String(formData.get("athlete_id") ?? "");
  const guardianId = String(formData.get("guardian_id") ?? "");
  const admin = createAdminClient();
  const { data: ownLink } = await admin.from("guardian_athlete_links").select("guardian_role").eq("guardian_id", userId).eq("athlete_id", athleteId).eq("status", "active").maybeSingle();
  if (ownLink?.guardian_role !== "primary_guardian" || guardianId === userId) throw new Error("この家族リンクは解除できません。");
  await admin.from("guardian_athlete_links").update({ status: "revoked", updated_at: new Date().toISOString() }).eq("guardian_id", guardianId).eq("athlete_id", athleteId);
  revalidatePath("/family/settings");
}
