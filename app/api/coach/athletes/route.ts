import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { programClasses } from "@/lib/program-classes";

export async function GET(request: NextRequest) {
  const programClass = request.nextUrl.searchParams.get("class");
  if (!programClass || !programClasses.some((item) => item === programClass)) return Response.json({ error: "クラスが不正です" }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "ログインが必要です" }, { status: 401 });
  const { data, error } = await supabase.from("players").select("user_id, name, grade, event, program_class").eq("program_class", programClass).eq("member_status", "active").order("name");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ athletes: data ?? [] }, { headers: { "Cache-Control": "private, max-age=30" } });
}
