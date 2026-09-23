import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/inventaire/queries";
import { isGuestyConfigured, listGuestyListingOptions } from "@/lib/inventaire/guesty";

/** Liste des annonces Guesty (menu déroulant "ID Listing Guesty", onglet
 * DATA) — chargée à la demande depuis le client plutôt qu'à chaque
 * chargement de page (comme FinanceTab pour VRPlatform), pour ne pas
 * appeler l'API Guesty sur des onglets qui n'en ont pas besoin. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  if (!isGuestyConfigured()) {
    return NextResponse.json({ error: "Guesty n'est pas configuré sur ce déploiement." }, { status: 500 });
  }

  try {
    const listings = await listGuestyListingOptions();
    return NextResponse.json({ data: listings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur Guesty." }, { status: 502 });
  }
}
