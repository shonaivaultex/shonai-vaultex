import ControlTestScanForm from "@/app/components/ControlTestScanForm";
import { createClient } from "@/lib/supabase-server";

type Setting = {
  test_code: string;
  implement_weight_kg: number | null;
  alternate_distance_m: number | null;
  gender: string | null;
  alternate_test_name: string | null;
  protocol_overrides: Record<string, number | string> | null;
};

export default async function NewControlTestScanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <ControlTestScanForm />;

  const { data: player } = await supabase
    .from("players")
    .select("program_class, gender")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!player?.program_class) return <ControlTestScanForm />;

  const { data } = await supabase
    .from("control_test_class_settings")
    .select("test_code, implement_weight_kg, alternate_distance_m, gender, alternate_test_name, protocol_overrides")
    .eq("program_class", player.program_class)
    .eq("enabled", true);
  const settings = (data ?? []) as Setting[];
  const pick = (code: string) => settings.find((item) => item.test_code === code && item.gender === player.gender)
    ?? settings.find((item) => item.test_code === code && item.gender === null);

  const classDistance = ["ジュニア", "マスターズ"].includes(player.program_class) ? 150 : 300;
  const officialThrowWeight = player.program_class === "ジュニア" ? 2 : player.gender === "female" ? 3 : player.gender === "male" ? 4 : undefined;
  return <ControlTestScanForm programClass={player.program_class} initialSettings={{
    shot_front_throw_weight: pick("shot_front_throw")?.implement_weight_kg ?? officialThrowWeight,
    shot_back_throw_weight: pick("shot_back_throw")?.implement_weight_kg ?? officialThrowWeight,
    speed_endurance_distance_m: pick("speed_endurance_300m")?.alternate_distance_m ?? classDistance,
    standing_bound_jump_count: Number(pick("standing_five_bound")?.protocol_overrides?.jump_count ?? (player.program_class === "ジュニア" ? 3 : 5)),
    rj_jump_count: Number(pick("rebound_jump")?.protocol_overrides?.default_jump_count ?? 5),
  }} />;
}
