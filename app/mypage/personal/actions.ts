"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export async function bookPersonalSession(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login?next=/mypage/personal");
  const scheduleId = Number(formData.get("schedule_id"));
  const note = String(formData.get("note") ?? "").trim();
  if (!Number.isInteger(scheduleId) || scheduleId < 1) return;
  const { error } = await supabase.from("personal_session_bookings").insert({ schedule_id: scheduleId, user_id: userId, note: note || null });
  if (error) redirect(`/mypage/personal?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/mypage"); revalidatePath("/mypage/personal");
  redirect("/mypage/personal?booked=1");
}

export async function cancelPersonalSession(formData: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login?next=/mypage/personal");
  const scheduleId = Number(formData.get("schedule_id"));
  if (!Number.isInteger(scheduleId) || scheduleId < 1) return;
  await supabase.from("personal_session_bookings").delete().eq("schedule_id", scheduleId).eq("user_id", userId);
  revalidatePath("/mypage"); revalidatePath("/mypage/personal");
  redirect("/mypage/personal?cancelled=1");
}

