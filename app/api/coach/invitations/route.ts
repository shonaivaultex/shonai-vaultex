import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createStandaloneClient } from "@supabase/supabase-js";
import { createAdminClient, hasAdminKey } from "@/lib/supabase-admin";
import { programClasses } from "@/lib/program-classes";

export const dynamic = "force-dynamic";

type InviteInput = {
  email?: unknown;
  name?: unknown;
  programClass?: unknown;
};

async function requireCoach() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "coach").maybeSingle();
  return role ? user : null;
}

function normalize(input: InviteInput) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const programClass = typeof input.programClass === "string" ? input.programClass.trim() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error(`${email || "メールアドレス"}が正しくありません。`);
  if (!name) throw new Error(`${email}の氏名を入力してください。`);
  if (!programClasses.includes(programClass as (typeof programClasses)[number])) throw new Error(`${email}のクラスを確認してください。`);
  return { email, name, programClass };
}

export async function GET() {
  if (!await requireCoach()) return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  if (!hasAdminKey()) return NextResponse.json({ invitations: [] });
  try {
    const admin = createAdminClient();
    const users = [];
    for (let page = 1; page <= 20; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      users.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const ids = users.map((user) => user.id);
    const { data: profiles, error: profileError } = ids.length
      ? await admin.from("players").select("user_id, name, program_class").in("user_id", ids)
      : { data: [], error: null };
    if (profileError) throw profileError;
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    const invitations = users.map((user) => {
      const profile = profileMap.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        name: profile?.name ?? (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "未設定"),
        programClass: profile?.program_class ?? (typeof user.user_metadata?.program_class === "string" ? user.user_metadata.program_class : null),
        status: user.email_confirmed_at ? "registered" : "pending",
        invitedAt: user.invited_at ?? user.created_at,
        registeredAt: user.email_confirmed_at,
      };
    }).filter((item) => item.email).sort((a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime());
    return NextResponse.json({ invitations });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "登録状況を取得できませんでした。" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await requireCoach()) return NextResponse.json({ error: "権限がありません。" }, { status: 403 });
  try {
    const body = await request.json() as { invitations?: InviteInput[] };
    if (!Array.isArray(body.invitations) || body.invitations.length === 0) return NextResponse.json({ error: "招待する会員を入力してください。" }, { status: 400 });
    if (body.invitations.length > 100) return NextResponse.json({ error: "一度に招待できるのは100名までです。" }, { status: 400 });
    const invitations = body.invitations.map(normalize);
    const emails = new Set<string>();
    for (const item of invitations) {
      if (emails.has(item.email)) return NextResponse.json({ error: `${item.email}が重複しています。` }, { status: 400 });
      emails.add(item.email);
    }
    const results: Array<{ email: string; ok: boolean; message: string }> = [];
    const admin = hasAdminKey() ? createAdminClient() : null;
    const signupClient = admin ? null : createStandaloneClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
    );
    for (const item of invitations) {
      const { data, error } = admin
        ? await admin.auth.admin.inviteUserByEmail(item.email, {
            data: { name: item.name, program_class: item.programClass },
            redirectTo: `${new URL(request.url).origin}/activate`,
          })
        : await signupClient!.auth.signUp({
            email: item.email,
            password: `${crypto.randomUUID()}Aa1!`,
            options: {
              data: { name: item.name, program_class: item.programClass },
              emailRedirectTo: `${new URL(request.url).origin}/activate`,
            },
          });
      if (error || !data.user) {
        results.push({ email: item.email, ok: false, message: error?.message ?? "招待できませんでした。" });
        continue;
      }
      results.push({ email: item.email, ok: true, message: "招待メールを送信しました。" });
    }
    return NextResponse.json({ results }, { status: results.some((item) => item.ok) ? 200 : 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "招待を送信できませんでした。" }, { status: 500 });
  }
}
