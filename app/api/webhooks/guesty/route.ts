import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGuestyCleaningRate } from "@/lib/inventaire/guesty";

/** Reçoit les notifications Guesty (listing.updated) pour synchroniser
 * property_data.cleaning_rate quand le champ personnalisé "cleaning_rate"
 * est modifié directement dans Guesty. Vérifié par un secret partagé dans
 * l'URL (GUESTY_WEBHOOK_SECRET) plutôt qu'une signature Guesty — plus
 * simple et fonctionne quel que soit le mécanisme de signature exact de
 * Guesty (non vérifié en conditions réelles au moment du développement).
 *
 * Ne fait pas confiance au contenu exact du payload webhook pour la
 * valeur du champ personnalisé (forme non garantie) : une fois l'annonce
 * identifiée, la valeur est relue directement depuis Guesty (GET
 * /listings/:id/custom-fields), plus fiable. */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.GUESTY_WEBHOOK_SECRET;
  if (!secret || url.searchParams.get("secret") !== secret) {
    return Response.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const listingId = extractListingId(body);
  if (!listingId) {
    return Response.json({ ok: true, note: "Aucun listingId trouvé dans le payload — ignoré." });
  }

  const supabase = createAdminClient();
  const { data: propertyData } = await supabase
    .from("property_data")
    .select("property_id")
    .eq("guesty_listing_id", listingId)
    .maybeSingle();

  if (!propertyData) {
    return Response.json({ ok: true, note: `Aucun bien associé à l'annonce Guesty ${listingId} — ignoré.` });
  }

  try {
    const cleaningRate = await getGuestyCleaningRate(listingId);
    await supabase
      .from("property_data")
      .update({
        cleaning_rate: cleaningRate,
        guesty_last_synced_at: new Date().toISOString(),
        guesty_last_sync_error: null,
      })
      .eq("property_id", propertyData.property_id);

    revalidatePath(`/inventaire/biens/${propertyData.property_id}`);

    return Response.json({ ok: true, propertyId: propertyData.property_id, cleaningRate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur de synchronisation Guesty.";
    await supabase.from("property_data").update({ guesty_last_sync_error: message }).eq("property_id", propertyData.property_id);
    return Response.json({ error: message }, { status: 502 });
  }
}

function extractListingId(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const obj = body as Record<string, unknown>;
  const candidates = [obj.listingId, obj._id, (obj.listing as Record<string, unknown> | undefined)?._id, obj.id];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return null;
}
