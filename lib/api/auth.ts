import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export class ApiAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** Vérifie l'en-tête `Authorization: Bearer <clé>` d'une requête API externe
 * (voir page Utilisateurs > API) contre `api_keys.key_hash`. Utilise le
 * client admin (clé de service, contourne RLS) car un appelant externe n'a
 * pas de session Supabase Auth. */
export async function requireApiKey(request: Request): Promise<{ id: string; name: string }> {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const key = match?.[1]?.trim();
  if (!key) throw new ApiAuthError("En-tête Authorization manquant (format attendu : Bearer <clé>).");

  const supabase = createAdminClient();
  const keyHash = createHash("sha256").update(key).digest("hex");

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.revoked_at) throw new ApiAuthError("Clé API invalide ou révoquée.");

  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);

  return { id: data.id, name: data.name };
}

export function apiErrorResponse(error: unknown) {
  if (error instanceof ApiAuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : "Une erreur est survenue.";
  return Response.json({ error: message }, { status: 400 });
}
