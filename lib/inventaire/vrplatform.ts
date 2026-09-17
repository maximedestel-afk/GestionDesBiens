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

interface VrPlatformReservationLine {
  type: string | null;
  amount: number | null;
}

interface VrPlatformReservation {
  checkIn: string | null;
  checkOut: string | null;
  nights: number | null;
  status: "booked" | "canceled" | "inactive";
  lines: VrPlatformReservationLine[] | null;
}

interface VrPlatformReservationsResponse {
  data: VrPlatformReservation[];
  pagination: { page: number; totalPage: number };
}

interface VrPlatformLineMappingsResponse {
  data: { type: string; account: { name: string } | null }[];
  pagination: { page: number; totalPage: number };
}

// Comptes de la comptabilité VRPlatform (page "Reservation Line Mappings"
// de l'équipe) vers lesquels sont classées les lignes des réservations —
// "Rents" pour le tarif du séjour, deux comptes de commission de canal
// selon la plateforme d'origine (Airbnb / Booking.com).
const RENTS_ACCOUNT = "Rents";
const CHANNEL_COMMISSION_ACCOUNTS = new Set(["Channel Commissions - Airbnb", "Channel Commissions (Reference Account)"]);

/** Table "type de ligne de réservation" → nom du compte comptable,
 * configurée côté VRPlatform (Réglages > Reservation Line Mappings) —
 * relue à chaque calcul pour rester synchronisée si l'équipe modifie ce
 * mapping dans VRPlatform. */
async function getReservationLineAccountMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;
  for (;;) {
    const res = await vrPlatformFetch<VrPlatformLineMappingsResponse>("/reservations/line-mappings", {
      limit: "250",
      page: String(page),
    });
    for (const mapping of res.data) {
      if (mapping.account) map.set(mapping.type, mapping.account.name);
    }
    if (page >= res.pagination.totalPage) break;
    page++;
  }
  return map;
}

/** Somme des lignes "Rents" et des lignes de commission de canal d'une
 * réservation, d'après le mapping comptable VRPlatform de l'équipe. */
function classifyReservationLines(
  lines: VrPlatformReservationLine[] | null,
  accountByLineType: Map<string, string>
): { rentsCents: number; channelFeesCents: number } {
  let rentsCents = 0;
  let channelFeesCents = 0;
  if (!lines) return { rentsCents, channelFeesCents };
  for (const line of lines) {
    if (!line.type) continue;
    const account = accountByLineType.get(line.type);
    if (account === RENTS_ACCOUNT) rentsCents += line.amount ?? 0;
    else if (account && CHANNEL_COMMISSION_ACCOUNTS.has(account)) channelFeesCents += Math.abs(line.amount ?? 0);
  }
  return { rentsCents, channelFeesCents };
}

export interface MonthlyFinance {
  /** 1 (janvier) à 12 (décembre). */
  month: number;
  rentsCents: number;
  /** Toujours positif : montant de la commission de canal (déjà déduite du tarif pour obtenir netRevenueCents). */
  channelFeesCents: number;
  /** rentsCents - channelFeesCents : Net Commissionable Revenue. */
  netRevenueCents: number;
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

/** Rents, commission de canal, Net Commissionable Revenue (Rents - Channel
 * Fees) et taux de remplissage de chaque mois d'une année pour un listing
 * VRPlatform — d'après le mapping comptable VRPlatform de l'équipe.
 *
 * Deux logiques d'attribution différentes, volontairement découplées :
 * - Occupation (nuits, taux de remplissage) : répartie au prorata des
 *   nuits réellement passées dans chaque mois — une réservation à cheval
 *   sur deux mois compte des nuits dans chacun.
 * - Revenu (Rents, Channel Fees) : attribué en entier au mois de la date
 *   de départ (checkOut), sans prorata — c'est ainsi que VRPlatform
 *   reconnaît ce revenu (vérifié : la réservation du 27/12 au 02/01 compte
 *   entièrement en janvier, pas en décembre). Les réservations annulées
 *   ne comptent pas. */
export async function getListingMonthlyFinancials(listingId: string, year: number): Promise<MonthlyFinance[]> {
  const months: MonthlyFinance[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    rentsCents: 0,
    channelFeesCents: 0,
    netRevenueCents: 0,
    nightsBooked: 0,
    daysInMonth: daysInMonth(year, i + 1),
    fillRate: 0,
  }));

  const accountByLineType = await getReservationLineAccountMap();

  let page = 1;
  for (;;) {
    const res = await vrPlatformFetch<VrPlatformReservationsResponse>("/reservations", {
      listingId,
      date: String(year),
      dateField: "intersection",
      status: "booked",
      limit: "250",
      page: String(page),
      includeLines: "true",
    });

    for (const reservation of res.data) {
      if (!reservation.checkIn || !reservation.checkOut) continue;

      for (const entry of months) {
        const nights = overlapNights(reservation.checkIn, reservation.checkOut, year, entry.month);
        if (nights > 0) entry.nightsBooked += nights;
      }

      const checkOutDate = new Date(`${reservation.checkOut}T00:00:00Z`);
      if (checkOutDate.getUTCFullYear() === year) {
        const { rentsCents, channelFeesCents } = classifyReservationLines(reservation.lines, accountByLineType);
        const entry = months[checkOutDate.getUTCMonth()];
        entry.rentsCents += rentsCents;
        entry.channelFeesCents += channelFeesCents;
      }
    }

    if (page >= res.pagination.totalPage) break;
    page++;
  }

  for (const entry of months) {
    entry.netRevenueCents = entry.rentsCents - entry.channelFeesCents;
    entry.fillRate = entry.daysInMonth > 0 ? entry.nightsBooked / entry.daysInMonth : 0;
  }
  return months;
}
