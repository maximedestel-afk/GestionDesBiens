// Intégration VRPlatform (onglet Finances) : revenu réel et taux de
// remplissage mois par mois, à partir des réservations VRPlatform d'un
// listing. Appelle directement l'API VRPlatform (https://api.vrplatform.app)
// avec une clé d'API "Team or partner backend" (x-api-key + x-team-id) —
// jamais depuis le client, ces identifiants ne doivent jamais être exposés
// au navigateur.

const API_BASE_URL = "https://api.vrplatform.app";
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isVrPlatformConfigured(): boolean {
  return !!process.env.VRPLATFORM_API_KEY && !!process.env.VRPLATFORM_TEAM_ID;
}

async function vrPlatformFetch<T>(path: string, query: Record<string, string>): Promise<T> {
  const apiKey = process.env.VRPLATFORM_API_KEY;
  const teamId = process.env.VRPLATFORM_TEAM_ID;
  if (!apiKey || !teamId) {
    throw new Error("VRPlatform n'est pas configuré (VRPLATFORM_API_KEY / VRPLATFORM_TEAM_ID manquants).");
  }

  const url = new URL(path, API_BASE_URL);
  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

  const response = await fetch(url, {
    headers: { "x-api-key": apiKey, "x-team-id": teamId },
    // Toujours réinterroger VRPlatform : le revenu/taux de remplissage doit
    // refléter les réservations les plus récentes, pas une réponse mise en
    // cache par Next.js.
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`VRPlatform a répondu ${response.status} sur ${path}.`);
  }
  return response.json() as Promise<T>;
}

interface VrPlatformListingOption {
  id: string;
  name: string;
  address: string | null;
}

interface VrPlatformListingsResponse {
  data: {
    id: string;
    name: string | null;
    title: string | null;
    address: { full?: string | null } | null;
  }[];
  pagination: { page: number; totalPage: number };
}

/** Tous les listings actifs de l'équipe VRPlatform — pour retrouver celui
 * dont le nom correspond à la référence d'un bien (voir
 * findVrPlatformListingIdByReference). */
async function listVrPlatformListingOptions(): Promise<VrPlatformListingOption[]> {
  const options: VrPlatformListingOption[] = [];
  let page = 1;
  for (;;) {
    const res = await vrPlatformFetch<VrPlatformListingsResponse>("/listings", {
      status: "active",
      limit: "250",
      page: String(page),
    });
    for (const listing of res.data) {
      options.push({
        id: listing.id,
        name: listing.title || listing.name || listing.id,
        address: listing.address?.full ?? null,
      });
    }
    if (page >= res.pagination.totalPage) break;
    page++;
  }
  return options.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Trouve le listing VRPlatform dont le nom correspond exactement à la
 * référence du bien (ex. bien "097STHON" ↔ listing VRPlatform "097STHON") —
 * les deux systèmes utilisent la même référence, donc aucune association
 * manuelle n'est nécessaire. */
export async function findVrPlatformListingIdByReference(reference: string): Promise<string | null> {
  const normalized = reference.trim().toLowerCase();
  const listings = await listVrPlatformListingOptions();
  const match = listings.find((listing) => listing.name.trim().toLowerCase() === normalized);
  return match?.id ?? null;
}

interface VrPlatformReservation {
  checkIn: string | null;
  checkOut: string | null;
  nights: number | null;
  status: "booked" | "canceled" | "inactive";
  ownersCentTotal: number | null;
}

interface VrPlatformReservationsResponse {
  data: VrPlatformReservation[];
  pagination: { page: number; totalPage: number };
}

export interface MonthlyFinance {
  /** 1 (janvier) à 12 (décembre). */
  month: number;
  revenueCents: number;
  nightsBooked: number;
  daysInMonth: number;
  fillRate: number;
}

function daysInMonth(year: number, month: number): number {
  // Jour 0 du mois suivant = dernier jour du mois courant.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Nuits de recouvrement entre un séjour [checkIn, checkOut) et un mois
 * civil [1er, 1er du mois suivant) — pour répartir une réservation qui
 * chevauche deux mois (ex. du 27 décembre au 2 janvier). */
function overlapNights(checkIn: string, checkOut: string, year: number, month: number): number {
  const checkInMs = Date.parse(`${checkIn}T00:00:00Z`);
  const checkOutMs = Date.parse(`${checkOut}T00:00:00Z`);
  const monthStartMs = Date.UTC(year, month - 1, 1);
  const monthEndMs = Date.UTC(year, month, 1);
  const overlapStart = Math.max(checkInMs, monthStartMs);
  const overlapEnd = Math.min(checkOutMs, monthEndMs);
  return Math.max(0, (overlapEnd - overlapStart) / MS_PER_DAY);
}

/** Revenu (net reversé au propriétaire) et taux de remplissage de chaque
 * mois d'une année pour un listing VRPlatform. Une réservation à cheval sur
 * deux mois est répartie au prorata des nuits de chaque mois. Les
 * réservations annulées ne comptent pas. */
export async function getListingMonthlyFinancials(listingId: string, year: number): Promise<MonthlyFinance[]> {
  const months: MonthlyFinance[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenueCents: 0,
    nightsBooked: 0,
    daysInMonth: daysInMonth(year, i + 1),
    fillRate: 0,
  }));

  let page = 1;
  for (;;) {
    const res = await vrPlatformFetch<VrPlatformReservationsResponse>("/reservations", {
      listingId,
      date: String(year),
      dateField: "intersection",
      status: "booked",
      limit: "250",
      page: String(page),
    });

    for (const reservation of res.data) {
      if (!reservation.checkIn || !reservation.checkOut) continue;
      const totalNights = reservation.nights ?? 0;
      const totalRevenue = reservation.ownersCentTotal ?? 0;
      if (totalNights <= 0) continue;

      for (const entry of months) {
        const nights = overlapNights(reservation.checkIn, reservation.checkOut, year, entry.month);
        if (nights <= 0) continue;
        entry.nightsBooked += nights;
        entry.revenueCents += Math.round((totalRevenue * nights) / totalNights);
      }
    }

    if (page >= res.pagination.totalPage) break;
    page++;
  }

  for (const entry of months) {
    entry.fillRate = entry.daysInMonth > 0 ? entry.nightsBooked / entry.daysInMonth : 0;
  }
  return months;
}
