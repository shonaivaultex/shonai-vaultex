import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "ログインが必要です" }, { status: 401 });
  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = 10;
  const status = params.get("status") === "answered" ? "answered" : "pending";
  const programClass = params.get("class");
  const priority = params.get("priority");
  const sort = params.get("sort") === "newest" ? "newest" : "oldest";
  const { data, error } = await supabase.rpc("coach_feedback_queue", {
    p_status: status,
    p_program_class: programClass && programClass !== "all" ? programClass : null,
    p_priority: priority && priority !== "all" ? priority : null,
    p_sort: sort,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const rows = data ?? [];
  return Response.json({
    items: rows.map(mapQueueRow),
    totalCount: Number(rows[0]?.total_count ?? 0),
  }, { headers: { "Cache-Control": "private, max-age=15" } });
}

function mapQueueRow(row: Record<string, unknown>) {
  const video = row.source === "video";
  return {
    id: Number(row.request_id), recordId: video ? null : Number(row.record_id),
    videoRequestId: video ? Number(row.request_id) : null,
    athleteId: String(row.athlete_id), athleteName: String(row.athlete_name),
    programClass: row.program_class ? String(row.program_class) : null,
    category: String(row.category), value: String(row.record_value ?? ""),
    requestType: String(row.request_type), message: row.message ? String(row.message) : null,
    priority: String(row.priority), status: String(row.status),
    createdAt: String(row.created_at), answeredAt: row.answered_at ? String(row.answered_at) : null,
  };
}
