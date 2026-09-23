import { createAdminClient } from "@/lib/supabase/admin";
import { serializeProperty } from "@/lib/inventaire/serialize";
import { apiErrorResponse, requireApiKey } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    await requireApiKey(request);
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("properties").select("*").order("reference", { ascending: true });
    if (error) throw error;
    return Response.json({ data: (data ?? []).map(serializeProperty) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
