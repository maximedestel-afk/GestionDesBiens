import { NextResponse } from "next/server";
import { getCurrentProfile, getPropertyFinanceSettings } from "@/lib/inventaire/queries";
import { getListingMonthlyFinancials, isVrPlatformConfigured } from "@/lib/inventaire/vrplatform";

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

  const settings = await getPropertyFinanceSettings(id);
  if (!settings?.vrplatformListingId) {
    return NextResponse.json({ error: "Aucun listing VRPlatform associé à ce bien." }, { status: 404 });
  }

  try {
    const months = await getListingMonthlyFinancials(settings.vrplatformListingId, year);
    return NextResponse.json({ year, months });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur VRPlatform inconnue." },
      { status: 502 }
    );
  }
}
