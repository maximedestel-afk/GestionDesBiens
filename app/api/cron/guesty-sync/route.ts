import { createAdminClient } from "@/lib/supabase/admin";
import { getGuestyCleaningRate, isGuestyConfigured } from "@/lib/inventaire/guesty";

/** Vérification périodique (Vercel Cron, voir vercel.json) du coût du
 * ménage sur Guesty pour chaque bien avec un ID Guesty renseigné —
 * solution de repli pour la synchronisation Guesty → MGB, le compte
 * Guesty de l'équipe n'ayant pas accès à la création de webhooks (scope
 * "endpoint:Create" indisponible, y compris depuis l'interface native de
 * Guesty). Sécurisé par CRON_SECRET (en-tête Authorization ajouté
 * automatiquement par Vercel Cron). */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (!isGuestyConfigured()) {
    return Response.json({ ok: true, note: "Guesty n'est pas configuré — rien à synchroniser." });
  }

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("property_data")
    .select("property_id, guesty_listing_id, cleaning_rate")
    .not("guesty_listing_id", "is", null);
  if (error) throw error;

  let checked = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows ?? []) {
    checked++;
    try {
      const rate = await getGuestyCleaningRate(row.guesty_listing_id as string);
      if (rate !== row.cleaning_rate) {
        await supabase
          .from("property_data")
          .update({ cleaning_rate: rate, guesty_last_synced_at: new Date().toISOString(), guesty_last_sync_error: null })
          .eq("property_id", row.property_id);
        updated++;
      } else {
        await supabase
          .from("property_data")
          .update({ guesty_last_synced_at: new Date().toISOString(), guesty_last_sync_error: null })
          .eq("property_id", row.property_id);
      }
    } catch (e) {
      failed++;
      const message = e instanceof Error ? e.message : "Erreur de synchronisation Guesty.";
      await supabase.from("property_data").update({ guesty_last_sync_error: message }).eq("property_id", row.property_id);
    }
  }

  return Response.json({ ok: true, checked, updated, failed });
}
