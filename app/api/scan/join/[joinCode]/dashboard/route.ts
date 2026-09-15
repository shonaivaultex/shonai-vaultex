import { createAdminClient } from "@/lib/supabase-admin";
import { hashParticipantSecret } from "@/lib/scan-participant-auth";
import { controlTestByCode } from "@/lib/control-test";

export async function POST(request: Request, { params }: { params: Promise<{ joinCode: string }> }) {
  const { joinCode } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.token !== "string" || !body.token || typeof body.athleteId !== "string") return Response.json({ error: "名前と暗証番号で入り直してください。" }, { status: 401 });
  const db = createAdminClient();
  const { data: session } = await db.from("scan_team_sessions").select("id,team_id").eq("join_code", joinCode).maybeSingle();
  if (!session) return Response.json({ error: "測定会が見つかりません。" }, { status: 404 });
  const { data: access } = await db.from("scan_session_participants").select("athlete_id").eq("session_id", session.id).eq("athlete_id", body.athleteId).eq("access_token_hash", hashParticipantSecret(body.token)).maybeSingle();
  if (!access) return Response.json({ error: "名前と暗証番号で入り直してください。" }, { status: 401 });
  const [{ data: athlete, error: ae }, { data: records, error: re }, { data: sessions, error: se }, { data: participants, error: pe }] = await Promise.all([
    db.from("scan_team_athletes").select("id,name,gender").eq("id", access.athlete_id).eq("team_id", session.team_id).eq("active", true).maybeSingle(),
    db.from("scan_team_measurements").select("session_id,test_code,primary_value,attempts").eq("team_id", session.team_id).eq("athlete_id", access.athlete_id),
    db.from("scan_team_sessions").select("id,title,measured_on,status").eq("team_id", session.team_id).order("measured_on", { ascending: false }),
    db.from("scan_session_participants").select("session_id,status").eq("team_id", session.team_id).eq("athlete_id", access.athlete_id),
  ]);
  if (ae || re || se || pe) return Response.json({ error: "記録を取得できませんでした。再度お試しください。" }, { status: 500 });
  if (!athlete) return Response.json({ error: "名簿登録を確認してください。" }, { status: 403 });
  const history = (sessions ?? []).flatMap(s => {
    const own = (records ?? []).filter(r => r.session_id === s.id);
    const participation = participants?.find(p => p.session_id === s.id);
    if (!own.length && !participation) return [];
    return [{ ...s, submitted: participation?.status === "submitted" || s.status === "complete", records: own.map(r => ({ code: r.test_code, label: controlTestByCode[r.test_code]?.category ?? r.test_code, unit: controlTestByCode[r.test_code]?.unit ?? "", value: Number(r.primary_value), lower: controlTestByCode[r.test_code]?.betterDirection === "lower", attempts: r.attempts })) }];
  });
  const [{ data: peers, error: ge }, { data: entries, error: ee }, { data: submissions, error: ue }] = await Promise.all([
    db.from("scan_team_athletes").select("id,gender").eq("team_id", session.team_id).eq("active", true),
    db.from("scan_team_measurements").select("session_id,athlete_id,test_code,primary_value").eq("team_id", session.team_id),
    db.from("scan_session_participants").select("session_id,athlete_id,status").eq("team_id", session.team_id),
  ]);
  if (ge || ee || ue) return Response.json({ error: "順位を取得できませんでした。" }, { status: 500 });
  const published = new Set((sessions ?? []).filter(s => s.status === "complete" || ((peers?.length ?? 0) > 0 && peers!.every(p => submissions?.some(u => u.session_id === s.id && u.athlete_id === p.id && u.status === "submitted")))).map(s => s.id));
  const sameGender = new Set((peers ?? []).filter(p => p.gender === athlete.gender && p.gender).map(p => p.id));
  const rankedHistory = history.map(h => ({ ...h, rankingReady: published.has(h.id), records: h.records.map(r => {
    if (!published.has(h.id) || !athlete.gender) return { ...r, rank: null, total: null };
    const values = (entries ?? []).filter(e => e.session_id === h.id && e.test_code === r.code && sameGender.has(e.athlete_id)).map(e => Number(e.primary_value));
    return { ...r, rank: 1 + values.filter(v => r.lower ? v < r.value : v > r.value).length, total: values.length };
  }) }));
  return Response.json({ name: athlete.name, history: rankedHistory }, { headers: { "Cache-Control": "private, no-store" } });
}
