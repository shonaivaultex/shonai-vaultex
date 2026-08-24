import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type StandardChange = {
  kind: "standard";
  standardId: number;
  score100: number | null;
  score0: number | null;
  status: "active" | "pending" | "retired";
  notes: string | null;
};
type SettingsChange = { kind: "type_settings"; balanced: number; combined: number };
type ContactSettingsChange = { kind: "contact_settings"; quickMs: number; balancedMs: number; juniorDrop: number; otherDrop: number };

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  return role ? user : null;
}

function nextVersion(current: string) {
  const match = current.match(/^v1(?:\.(\d+))?-beta$/);
  const revision = match ? Number(match[1] ?? 0) + 1 : 1;
  return { version: `v1.${revision}-beta`, label: `VAULTEX STANDARD Ver.1.${revision} / BETA` };
}

function numeric(value: unknown, label: string) {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10000) throw new Error(`${label}を確認してください。`);
  return parsed;
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "管理者権限が必要です。" }, { status: 403 });
  if (!hasAdminKey()) return NextResponse.json({ error: "Supabase管理用キーが設定されていません。" }, { status: 503 });

  try {
    const body = await request.json() as { change?: StandardChange | SettingsChange | ContactSettingsChange; reason?: unknown; confirmed?: unknown };
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (reason.length < 3 || reason.length > 1000) return NextResponse.json({ error: "変更理由を3〜1000文字で入力してください。" }, { status: 400 });
    if (body.confirmed !== true || !body.change) return NextResponse.json({ error: "影響確認への同意が必要です。" }, { status: 400 });
    const change = body.change;

    const admin = createAdminClient();
    if(change.kind==="contact_settings"){
      const quick=numeric(change.quickMs,"QUICK上限");const balanced=numeric(change.balancedMs,"BALANCED上限");const junior=numeric(change.juniorDrop,"JUNIOR台高");const other=numeric(change.otherDrop,"その他台高");
      if(quick==null||balanced==null||junior==null||other==null||balanced<=quick)return NextResponse.json({error:"CONTACT PROFILEの境界値・台高を確認してください。"},{status:400});
      const {data:current,error:currentError}=await admin.from("contact_profile_settings").select("*").eq("is_current",true).single();
      if(currentError||!current)throw currentError??new Error("CONTACT PROFILE設定が見つかりません。");
      const revision=Number(String(current.version).match(/contact-v1\.(\d+)-beta/)?.[1]??0)+1;const nextVersion=`contact-v1.${revision}-beta`;
      const {error:offError}=await admin.from("contact_profile_settings").update({is_current:false,updated_at:new Date().toISOString()}).eq("version",current.version);if(offError)throw offError;
      const {error:insertError}=await admin.from("contact_profile_settings").insert({version:nextVersion,quick_upper_ms:quick,balanced_upper_ms:balanced,junior_drop_height_cm:junior,youth_drop_height_cm:other,elite_drop_height_cm:other,masters_drop_height_cm:other,status:"beta",is_current:true,notes:reason});
      if(insertError){await admin.from("contact_profile_settings").update({is_current:true}).eq("version",current.version);throw insertError;}
      return NextResponse.json({ok:true,version:nextVersion,label:"CONTACT PROFILE設定"});
    }
    const { data: currentSet, error: setError } = await admin.from("athlete_scan_standard_sets").select("*").eq("is_current", true).single();
    if (setError || !currentSet) throw setError ?? new Error("現在のSTANDARDが見つかりません。");
    const [{ data: standards, error: standardsError }, { data: settings, error: settingsError }] = await Promise.all([
      admin.from("athlete_scan_standards").select("*").eq("standard_version", currentSet.version).order("id"),
      admin.from("athlete_scan_type_settings").select("*").eq("standard_version", currentSet.version).single(),
    ]);
    if (standardsError || settingsError || !standards || !settings) throw standardsError ?? settingsError ?? new Error("STANDARDを取得できませんでした。");

    const target = change.kind === "standard" ? standards.find((item) => item.id === Number(change.standardId)) : null;
    if (change.kind === "standard" && !target) return NextResponse.json({ error: "変更対象が見つかりません。" }, { status: 400 });
    const next = nextVersion(currentSet.version);
    const duplicate = await admin.from("athlete_scan_standard_sets").select("version").eq("version", next.version).maybeSingle();
    if (duplicate.data) return NextResponse.json({ error: "同じバージョンが既に存在します。画面を更新してください。" }, { status: 409 });

    let created = false;
    try {
      const { error: uncurrentError } = await admin.from("athlete_scan_standard_sets").update({ is_current: false, updated_at: new Date().toISOString() }).eq("version", currentSet.version);
      if (uncurrentError) throw uncurrentError;
      const { error: createError } = await admin.from("athlete_scan_standard_sets").insert({ version: next.version, label: next.label, status: "beta", is_current: true, notes: reason });
      if (createError) throw createError;
      created = true;

      const cloned = standards.map(({ id: _id, ...source }) => {
        const { created_at, updated_at, ...row } = source;
        void created_at; void updated_at;
        const nextRow = { ...row, standard_version: next.version, updated_at: new Date().toISOString() };
        if (change.kind === "standard" && Number(_id) === Number(change.standardId)) {
          nextRow.score_100_value = numeric(change.score100, "100 STANDARD");
          nextRow.score_0_value = numeric(change.score0, "0 STANDARD");
          nextRow.status = change.status;
          nextRow.notes = change.notes?.trim() || null;
        }
        return nextRow;
      });
      const { error: cloneError } = await admin.from("athlete_scan_standards").insert(cloned);
      if (cloneError) throw cloneError;

      const nextSettings = {
        standard_version: next.version,
        balanced_max_spread: change.kind === "type_settings" ? numeric(change.balanced, "BALANCED threshold") : settings.balanced_max_spread,
        composite_max_gap: change.kind === "type_settings" ? numeric(change.combined, "Combined Type threshold") : settings.composite_max_gap,
        type_descriptions: settings.type_descriptions,
        notes: reason,
        updated_at: new Date().toISOString(),
      };
      const { error: settingsInsertError } = await admin.from("athlete_scan_type_settings").insert(nextSettings);
      if (settingsInsertError) throw settingsInsertError;

      const historyRows = change.kind === "standard"
        ? (["score_100_value", "score_0_value", "status", "notes"] as const).filter((field) => {
            const newValues = { score_100_value: change.score100, score_0_value: change.score0, status: change.status, notes: change.notes };
            return JSON.stringify(target?.[field] ?? null) !== JSON.stringify(newValues[field] ?? null);
          }).map((field) => ({ from_version: currentSet.version, to_version: next.version, change_kind: "standard", standard_id: target!.id, gender: target!.gender, test_code: target!.test_code, field_name: field, old_value: target![field] ?? null, new_value: field === "score_100_value" ? change.score100 : field === "score_0_value" ? change.score0 : field === "status" ? change.status : change.notes, reason, changed_by: user.id }))
        : ([
            { field: "balanced_max_spread", old: settings.balanced_max_spread, value: change.balanced },
            { field: "composite_max_gap", old: settings.composite_max_gap, value: change.combined },
          ].filter((item) => Number(item.old) !== Number(item.value)).map((item) => ({ from_version: currentSet.version, to_version: next.version, change_kind: "type_settings", standard_id: null, gender: null, test_code: null, field_name: item.field, old_value: item.old, new_value: item.value, reason, changed_by: user.id })));
      if (!historyRows.length) throw new Error("変更内容がありません。");
      const { error: historyError } = await admin.from("athlete_scan_standard_history").insert(historyRows as never[]);
      if (historyError) throw historyError;
      return NextResponse.json({ ok: true, version: next.version, label: next.label });
    } catch (error) {
      if (created) await admin.from("athlete_scan_standard_sets").delete().eq("version", next.version);
      await admin.from("athlete_scan_standard_sets").update({ is_current: true, updated_at: new Date().toISOString() }).eq("version", currentSet.version);
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "STANDARDを保存できませんでした。" }, { status: 500 });
  }
}
