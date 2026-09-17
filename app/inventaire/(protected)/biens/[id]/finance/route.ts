import { NextResponse } from "next/server";
import { getCurrentProfile, getProperty } from "@/lib/inventaire/queries";
import { findVrPlatformListingIdByReference, getListingMonthlyFinancials, isVrPlatformConfigured } from "@/lib/inventaire/vrplatform";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (profile.role !== "admin") return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });

  if (!isVrPlatformConfigured()) {
    return NextResponse.json({ error: "VRPlatform n'est pas configuré sur ce déploiement." }, { status: 500 });
  }

  const yearParam = new URL(request.url).searchParams.get("year");
  const year = yearParam ? Number.parseInt(yearParam, 10) : NaN;
  if (!Number.isInteger(year)) {
    return NextResponse.json({ error: "Année invalide." }, { status: 400 });
  }

  const property = await getProperty(id);
  if (!property) return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });

  try {
    const listingId = await findVrPlatformListingIdByReference(property.reference);
    if (!listingId) {
      return NextResponse.json(
        { error: `Aucun listing VRPlatform trouvé pour la référence « ${property.reference} ».` },
        { status: 404 }
      );
    }
    const months = await getListingMonthlyFinancials(listingId, year);
    return NextResponse.json({ year, months });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur VRPlatform inconnue." },
      { status: 502 }
    );
  }
}
