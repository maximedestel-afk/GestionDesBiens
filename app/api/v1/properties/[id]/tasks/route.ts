import { createAdminClient } from "@/lib/supabase/admin";
import { serializeTask } from "@/lib/inventaire/serialize";
import { apiErrorResponse, requireApiKey } from "@/lib/api/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiKey(request);
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: taskRows, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("property_id", id)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return Response.json({ data: (taskRows ?? []).map((row) => serializeTask(row, [])) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
