import { createAdminClient } from "@/lib/supabase/admin";
import { isGuestyConfigured, syncAllGuestyCleaningRates } from "@/lib/inventaire/guesty";

/** Synchronisation quotidienne (Vercel Cron, voir vercel.json) du coût du
 * ménage depuis Guesty pour tous les biens — retrouve l'annonce Guesty
 * correspondante par référence à chaque passage (pas seulement pour les
 * biens déjà liés manuellement), pour que le champ soit renseigné sans
 * action de l'utilisateur. Solution de repli pour la synchronisation
 * Guesty → MGB, le compte Guesty de l'équipe n'ayant pas accès à la
 * création de webhooks (scope "endpoint:Create" indisponible, y compris
 * depuis l'interface native de Guesty). Sécurisé par CRON_SECRET (en-tête
 * Authorization ajouté automatiquement par Vercel Cron). */
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
  const { data: properties, error } = await supabase.from("properties").select("id, reference");
  if (error) throw error;

  let updated = 0;
  let failed = 0;
  let skipped = 0;
  const now = new Date().toISOString();

  let results;
  try {
    results = await syncAllGuestyCleaningRates(properties ?? []);
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Erreur de synchronisation Guesty." },
      { status: 500 }
    );
  }

  for (const { propertyId, listingId, rate, error: syncError } of results) {
    if (!listingId) {
      skipped++;
      continue;
    }
    if (syncError) {
      failed++;
      await supabase.from("property_data").update({ guesty_last_sync_error: syncError }).eq("property_id", propertyId);
      continue;
    }
    await supabase.from("property_data").upsert(
      {
        property_id: propertyId,
        cleaning_rate: rate,
        guesty_listing_id: listingId,
        guesty_last_synced_at: now,
        guesty_last_sync_error: null,
      },
      { onConflict: "property_id" }
    );
    updated++;
  }

  return Response.json({ ok: true, checked: results.length, updated, failed, skipped });
}
