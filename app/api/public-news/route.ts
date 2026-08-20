import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, priority, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("public-news error", error);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data ?? []);
}
