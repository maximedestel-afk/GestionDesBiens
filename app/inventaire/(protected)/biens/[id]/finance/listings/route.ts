import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/inventaire/queries";
import { isVrPlatformConfigured, listVrPlatformListingOptions } from "@/lib/inventaire/vrplatform";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  if (profile.role !== "admin") return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });

  if (!isVrPlatformConfigured()) {
    return NextResponse.json({ error: "VRPlatform n'est pas configuré sur ce déploiement." }, { status: 500 });
  }

  try {
    const listings = await listVrPlatformListingOptions();
    return NextResponse.json({ listings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur VRPlatform inconnue." },
      { status: 502 }
    );
  }
}
