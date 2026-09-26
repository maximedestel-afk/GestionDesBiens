import { NextResponse } from "next/server";
import { getAllowedSectionsForRole, getCurrentProfile, getProperty, getPropertyFinanceSettings } from "@/lib/inventaire/queries";
import { canAccessSection } from "@/lib/inventaire/tabs";
import { findVrPlatformListingIdByReference, getReservationsInRange, isVrPlatformConfigured } from "@/lib/inventaire/vrplatform";
import { findGuestyListingIdByReference, getGuestyCalendar, isGuestyConfigured } from "@/lib/inventaire/guesty";

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Premier jour (lundi) de la grille calendrier d'un mois — peut être dans
 * le mois précédent si le 1er n'est pas un lundi. */
function startOfGrid(year: number, month: number): Date {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const mondayIndexed = (firstOfMonth.getUTCDay() + 6) % 7; // dimanche=6, lundi=0
  const start = new Date(firstOfMonth);
  start.setUTCDate(start.getUTCDate() - mondayIndexed);
  return start;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const allowedSections = await getAllowedSectionsForRole(profile.role);
  if (!canAccessSection(profile.role, allowedSections, "calendrier")) {
    return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  }

  if (!isVrPlatformConfigured()) {
    return NextResponse.json({ error: "VRPlatform n'est pas configuré sur ce déploiement." }, { status: 500 });
  }

  const searchParams = new URL(request.url).searchParams;
  const year = Number.parseInt(searchParams.get("year") ?? "", 10);
  const month = Number.parseInt(searchParams.get("month") ?? "", 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Mois ou année invalide." }, { status: 400 });
  }

  const [property, financeSettings] = await Promise.all([getProperty(id), getPropertyFinanceSettings(id)]);
  if (!property) return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });

  const references = [property.reference, ...(financeSettings?.extraVrplatformReferences ?? [])];

  try {
    const resolved = await Promise.all(
      references.map(async (reference) => ({ reference, listingId: await findVrPlatformListingIdByReference(reference) }))
    );
    const listingIds = resolved.filter((r) => r.listingId).map((r) => r.listingId as string);
    const notFound = resolved.filter((r) => !r.listingId).map((r) => r.reference);

    if (listingIds.length === 0) {
      return NextResponse.json(
        { error: `Aucun listing VRPlatform trouvé pour la référence « ${property.reference} ».` },
        { status: 404 }
      );
    }

    // Grille de 6 semaines (42 jours) à partir du lundi contenant le 1er du
    // mois : couvre toujours le mois entier, même quand il commence en fin
    // de semaine (ex. un vendredi) et déborde sur une 6e semaine.
    const gridStart = startOfGrid(year, month);
    const gridEnd = new Date(gridStart);
    gridEnd.setUTCDate(gridEnd.getUTCDate() + 42);

    const reservations = await getReservationsInRange(listingIds, formatDateInput(gridStart), formatDateInput(gridEnd));

    // Prix par nuit (calendrier de tarification Guesty) : à part de la
    // résolution VRPlatform ci-dessus, un échec ici (non configuré, annonce
    // introuvable, erreur Guesty) ne doit jamais empêcher d'afficher le
    // calendrier des réservations — seul le prix manque, en warning.
    let nightlyPrices: Record<string, number> = {};
    let guestyWarning: string | null = null;
    if (isGuestyConfigured()) {
      try {
        const guestyListingId = await findGuestyListingIdByReference(property.reference);
        if (guestyListingId) {
          const calendarDays = await getGuestyCalendar(
            guestyListingId,
            formatDateInput(gridStart),
            formatDateInput(gridEnd)
          );
          nightlyPrices = Object.fromEntries(
            calendarDays.filter((d) => d.price != null).map((d) => [d.date, d.price as number])
          );
        } else {
          guestyWarning = `Annonce Guesty introuvable pour la référence « ${property.reference} » — prix par nuit indisponibles.`;
        }
      } catch (err) {
        guestyWarning = `Guesty (prix par nuit) : ${err instanceof Error ? err.message : "erreur inconnue"}.`;
      }
    }

    const vrPlatformWarning =
      notFound.length > 0 ? `Référence VRPlatform introuvable : « ${notFound.join(", ")} ».` : null;

    return NextResponse.json({
      year,
      month,
      gridStart: formatDateInput(gridStart),
      reservations,
      nightlyPrices,
      warning: [vrPlatformWarning, guestyWarning].filter(Boolean).join(" ") || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur VRPlatform inconnue." },
      { status: 502 }
    );
  }
}
