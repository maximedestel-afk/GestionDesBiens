import { createAdminClient } from "@/lib/supabase/admin";
import { serializeCleaningProvider } from "@/lib/inventaire/serialize";
import { apiErrorResponse, requireApiKey } from "@/lib/api/auth";

export async function GET(request: Request) {
  try {
    await requireApiKey(request);
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("cleaning_providers").select("*").order("name");
    if (error) throw error;
    return Response.json({ data: (data ?? []).map(serializeCleaningProvider) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
