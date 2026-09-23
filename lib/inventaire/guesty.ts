// Intégration Guesty (onglet DATA > Coût du ménage) : synchronisation
// bidirectionnelle du champ personnalisé Guesty "cleaning_rate" avec
// property_data.cleaning_rate. Authentification OAuth2 (client
// credentials) — jamais depuis le client, ces identifiants ne doivent
// jamais être exposés au navigateur.
//
// Attention : l'API Guesty n'a pas pu être testée en direct pendant le
// développement (accès réseau à guesty.com bloqué depuis cet
// environnement) — ce module s'appuie sur la documentation publique de
// l'Open API Guesty. Utiliser "Tester la connexion" (page DATA) après
// déploiement pour vérifier/ajuster si besoin.

const TOKEN_URL = "https://open-api.guesty.com/oauth2/token";
const API_BASE_URL = "https://open-api.guesty.com/v1";
export const CLEANING_RATE_FIELD_KEY = "cleaning_rate";

export function isGuestyConfigured(): boolean {
  return !!process.env.GUESTY_CLIENT_ID && !!process.env.GUESTY_CLIENT_SECRET;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GUESTY_CLIENT_ID;
  const clientSecret = process.env.GUESTY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Guesty n'est pas configuré (GUESTY_CLIENT_ID / GUESTY_CLIENT_SECRET manquants).");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "open-api",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Authentification Guesty échouée (${response.status}) : ${await response.text()}`);
  }
  const json = (await response.json()) as { access_token: string; expires_in?: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return json.access_token;
}

async function guestyFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  // Concaténation simple plutôt que `new URL(path, API_BASE_URL)` : avec un
  // `path` commençant par "/", la résolution WHATWG ignore le "/v1" de la
  // base (elle repart de la racine du domaine) — bug réel constaté en
  // production (404 "no Route matched").
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Guesty a répondu ${response.status} sur ${path} : ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

interface GuestyListingOption {
  id: string;
  name: string;
}

/** Toutes les annonces Guesty (nickname ou titre), pour retrouver celle
 * dont le nom correspond à la référence d'un bien — voir
 * findGuestyListingIdByReference. Format de réponse Guesty (`results` +
 * `count`) déduit de la documentation publique, pas encore vérifié en
 * conditions réelles. */
async function listGuestyListingOptions(): Promise<GuestyListingOption[]> {
  const options: GuestyListingOption[] = [];
  let skip = 0;
  const limit = 100;
  for (;;) {
    const query = new URLSearchParams({
      limit: String(limit),
      skip: String(skip),
      fields: "_id nickname title",
    });
    const res = await guestyFetch<{ results?: unknown[]; data?: unknown[]; count?: number }>(`/listings?${query}`);
    const rows = (res.results ?? res.data ?? []) as { _id: string; nickname?: string; title?: string }[];
    for (const row of rows) {
      options.push({ id: row._id, name: row.nickname || row.title || row._id });
    }
    skip += limit;
    if (rows.length < limit || (res.count !== undefined && skip >= res.count)) break;
  }
  return options.sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

/** Trouve l'annonce Guesty dont le nom (nickname) correspond exactement à
 * la référence du bien (ex. bien "097STHON" ↔ annonce Guesty "097STHON") —
 * même logique que findVrPlatformListingIdByReference. */
export async function findGuestyListingIdByReference(reference: string): Promise<string | null> {
  const normalized = reference.trim().toLowerCase();
  const listings = await listGuestyListingOptions();
  const match = listings.find((listing) => listing.name.trim().toLowerCase() === normalized);
  return match?.id ?? null;
}

interface RawCustomField {
  fieldId?: string;
  _id?: string;
  id?: string;
  name?: string;
  key?: string;
  value?: unknown;
}

/** La réponse Guesty pour les champs personnalisés d'une annonce peut être
 * un tableau d'objets {fieldId, name, value} ou un objet {clé: valeur} —
 * gère les deux formes plutôt que de supposer une forme précise. */
function extractCustomField(raw: unknown, fieldKey: string): { id: string | null; value: unknown } | null {
  if (Array.isArray(raw)) {
    const match = (raw as RawCustomField[]).find(
      (f) => f.name === fieldKey || f.key === fieldKey || f.fieldId === fieldKey
    );
    if (!match) return null;
    return { id: match.fieldId ?? match._id ?? match.id ?? null, value: match.value };
  }
  if (raw && typeof raw === "object" && fieldKey in (raw as Record<string, unknown>)) {
    return { id: fieldKey, value: (raw as Record<string, unknown>)[fieldKey] };
  }
  return null;
}

/** Valeur actuelle du champ personnalisé "cleaning_rate" d'une annonce
 * Guesty (null si l'annonce n'a pas ce champ renseigné). */
export async function getGuestyCleaningRate(listingId: string): Promise<number | null> {
  const raw = await guestyFetch<unknown>(`/listings/${listingId}/custom-fields`);
  const field = extractCustomField(raw, CLEANING_RATE_FIELD_KEY);
  if (!field || field.value === null || field.value === undefined) return null;
  const num = Number(field.value);
  return Number.isFinite(num) ? num : null;
}

/** Pousse la nouvelle valeur du coût du ménage sur l'annonce Guesty
 * correspondante — résout d'abord l'identifiant interne du champ
 * personnalisé (fieldId), sinon retente avec la clé elle-même. */
export async function setGuestyCleaningRate(listingId: string, value: number | null): Promise<void> {
  const raw = await guestyFetch<unknown>(`/listings/${listingId}/custom-fields`);
  const field = extractCustomField(raw, CLEANING_RATE_FIELD_KEY);
  const fieldId = field?.id ?? CLEANING_RATE_FIELD_KEY;

  await guestyFetch(`/listings/${listingId}/custom-fields`, {
    method: "PUT",
    body: JSON.stringify({ customFields: [{ fieldId, value }] }),
  });
}

/** Crée l'abonnement webhook Guesty → MGB (voir page API, section Guesty).
 * Nécessite le scope "endpoint:Create" sur l'application Guesty. */
export async function createGuestyWebhook(targetUrl: string, events: string[]): Promise<void> {
  await guestyFetch(`/webhooks`, {
    method: "POST",
    body: JSON.stringify({ url: targetUrl, events }),
  });
}
