// Intégration Guesty (onglet DATA > Coût du ménage) : lecture seule —
// property_data.cleaning_rate est un miroir du champ personnalisé Guesty
// "cleaning_rate" (annonce retrouvée par référence du bien). MGB ne
// modifie jamais rien côté Guesty. Authentification OAuth2 (client
// credentials) — jamais depuis le client, ces identifiants ne doivent
// jamais être exposés au navigateur.
//
// Attention : l'API Guesty n'a pas pu être testée en direct pendant le
// développement (accès réseau à guesty.com bloqué depuis cet
// environnement) — ce module s'appuie sur la documentation publique de
// l'Open API Guesty. Utiliser "Tester la connexion" (page DATA) après
// déploiement pour vérifier/ajuster si besoin.

import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_URL = "https://open-api.guesty.com/oauth2/token";
const API_BASE_URL = "https://open-api.guesty.com/v1";
const TOKEN_CACHE_ROW_ID = "default";
export const CLEANING_RATE_FIELD_KEY = "cleaning_rate";

export function isGuestyConfigured(): boolean {
  return !!process.env.GUESTY_CLIENT_ID && !!process.env.GUESTY_CLIENT_SECRET;
}

// Cache mémoire (rapide, mais perdu à chaque nouvelle instance serverless
// Vercel — "cold start") + cache persistant en base (guesty_token_cache,
// partagé entre toutes les instances) : sans ce second niveau, chaque
// invocation redemande un jeton à Guesty, jusqu'à se faire limiter (429
// "Too many requests"), constaté en production.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GUESTY_CLIENT_ID;
  const clientSecret = process.env.GUESTY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Guesty n'est pas configuré (GUESTY_CLIENT_ID / GUESTY_CLIENT_SECRET manquants).");
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const supabase = createAdminClient();

  const { data: persisted, error: persistedError } = await supabase
    .from("guesty_token_cache")
    .select("access_token, expires_at")
    .eq("id", TOKEN_CACHE_ROW_ID)
    .maybeSingle();
  // Erreur remontée explicitement (plutôt que silencieusement ignorée) : si
  // la table n'existe pas encore (migration 0072 non exécutée), le cache
  // persistant est inopérant et chaque appel redemande un jeton à Guesty
  // jusqu'à la limite de débit (429) — sans ce garde-fou, ce cas se
  // confondait avec un vrai 429 côté Guesty.
  if (persistedError && persistedError.code === "42P01") {
    throw new Error(
      "La table guesty_token_cache n'existe pas encore : exécutez la migration 0072_guesty_token_cache.sql sur Supabase."
    );
  }
  if (persisted && new Date(persisted.expires_at).getTime() > Date.now() + 30_000) {
    cachedToken = { value: persisted.access_token, expiresAt: new Date(persisted.expires_at).getTime() };
    return persisted.access_token;
  }

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
  const expiresAt = Date.now() + (json.expires_in ?? 3600) * 1000;
  cachedToken = { value: json.access_token, expiresAt };

  await supabase.from("guesty_token_cache").upsert({
    id: TOKEN_CACHE_ROW_ID,
    access_token: json.access_token,
    expires_at: new Date(expiresAt).toISOString(),
  });

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

/** Sort le tableau d'un envelope Guesty {results:[...]} / {data:[...]} —
 * ou renvoie directement le tableau si la réponse en est déjà un (constaté
 * en production pour /listings/{id}/custom-fields, qui renvoie un tableau
 * brut de {fieldId, value} sans enveloppe). */
function unwrapArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const obj = raw as { results?: unknown[]; data?: unknown[] };
    return obj.results ?? obj.data ?? [];
  }
  return [];
}

interface RawCustomFieldValue {
  fieldId?: string;
  _id?: string;
  id?: string;
  value?: unknown;
}

interface RawCustomFieldDefinition {
  fieldId?: string;
  _id?: string;
  id?: string;
  key?: string;
  displayName?: string;
  name?: string;
  fieldName?: string;
  title?: string;
  label?: string;
}

/** accountId Guesty associé aux identifiants configurés — nécessaire pour
 * lister les définitions de champs personnalisés du compte (voir
 * resolveCleaningRateFieldId). Lu depuis n'importe quelle annonce
 * existante : accountId est un champ standard de l'objet listing. */
async function getGuestyAccountId(): Promise<string> {
  const res = await guestyFetch<unknown>(`/listings?limit=1&fields=accountId`);
  const rows = unwrapArray(res) as { accountId?: string }[];
  const accountId = rows[0]?.accountId;
  if (!accountId) throw new Error("Impossible de retrouver l'identifiant du compte Guesty (accountId).");
  return accountId;
}

// Mis en cache le temps de l'instance serverless (perdu à chaque cold
// start, comme cachedToken) : ce mapping nom → fieldId ne change pas
// d'un appel à l'autre, pas besoin de le résoudre à chaque fois.
let cachedCleaningRateFieldId: string | null = null;

/** Résout l'identifiant interne (ObjectId Guesty) du champ personnalisé
 * "cleaning_rate" à partir de son nom. La réponse Guesty pour les champs
 * personnalisés d'une annonce (/listings/{id}/custom-fields) ne contient
 * que des paires {fieldId, value} sans nom lisible (constaté en
 * production) — il faut donc croiser avec les définitions de champs du
 * compte (/accounts/{accountId}/custom-fields), qui elles associent
 * chaque fieldId à son nom. */
async function resolveCleaningRateFieldId(): Promise<string | null> {
  if (cachedCleaningRateFieldId) return cachedCleaningRateFieldId;

  const accountId = await getGuestyAccountId();
  const raw = await guestyFetch<unknown>(`/accounts/${accountId}/custom-fields`);
  const definitions = unwrapArray(raw) as RawCustomFieldDefinition[];

  const match = definitions.find((def) => {
    // "key" est le nom technique constaté en production (ex. "real_address",
    // "cleaning_rate") — les autres candidats restent en repli défensif au
    // cas où Guesty renverrait une forme différente pour un autre type de
    // champ personnalisé.
    const name = def.key ?? def.displayName ?? def.name ?? def.fieldName ?? def.title ?? def.label;
    return typeof name === "string" && name.trim().toLowerCase() === CLEANING_RATE_FIELD_KEY;
  });
  // "fieldId" est l'identifiant constaté en production sur les définitions
  // de champs (pas "_id"/"id") — c'est aussi le nom utilisé dans les
  // valeurs par annonce (/listings/{id}/custom-fields), donc les deux
  // doivent correspondre pour que getGuestyCleaningRate retrouve la valeur.
  const fieldId = match?.fieldId ?? match?._id ?? match?.id ?? null;
  if (fieldId) cachedCleaningRateFieldId = fieldId;
  return fieldId;
}

/** Valeur actuelle du champ personnalisé "cleaning_rate" d'une annonce
 * Guesty (null si l'annonce n'a pas ce champ renseigné, ou si le champ
 * n'existe pas sur le compte). */
export async function getGuestyCleaningRate(listingId: string): Promise<number | null> {
  const fieldId = await resolveCleaningRateFieldId();
  if (!fieldId) return null;

  const raw = await guestyFetch<unknown>(`/listings/${listingId}/custom-fields`);
  const values = unwrapArray(raw) as RawCustomFieldValue[];
  const match = values.find((v) => (v.fieldId ?? v._id ?? v.id) === fieldId);
  if (!match || match.value === null || match.value === undefined) return null;
  const num = Number(match.value);
  return Number.isFinite(num) ? num : null;
}

/** Diagnostic : réponse brute de Guesty pour les définitions de champs
 * personnalisés du compte — utilisé quand "cleaning_rate" n'est pas
 * retrouvé par resolveCleaningRateFieldId, pour voir la forme réelle de
 * la réponse (jamais vérifiée en conditions réelles) et ajuster
 * l'extraction si besoin. */
export async function getGuestyRawCustomFieldDefinitions(): Promise<unknown> {
  const accountId = await getGuestyAccountId();
  return guestyFetch<unknown>(`/accounts/${accountId}/custom-fields`);
}

/** Crée l'abonnement webhook Guesty → MGB (voir page API, section Guesty).
 * Nécessite le scope "endpoint:Create" sur l'application Guesty. */
export async function createGuestyWebhook(targetUrl: string, events: string[]): Promise<void> {
  await guestyFetch(`/webhooks`, {
    method: "POST",
    body: JSON.stringify({ url: targetUrl, events }),
  });
}
