import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseServiceRoleKey } from "@/lib/supabase/env";

// Session "propriétaire" légère et séparée de l'authentification staff
// (Supabase Auth) : un propriétaire n'a pas de compte, il s'identifie avec
// l'email déjà enregistré sur sa fiche. Le cookie porte un jeton signé
// (HMAC avec la clé de service Supabase, jamais exposée au client) plutôt
// que de dépendre d'une table de sessions.
const COOKIE_NAME = "owner_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 jours

function sign(payloadB64: string): string {
  return createHmac("sha256", supabaseServiceRoleKey()).update(payloadB64).digest("base64url");
}

export async function createOwnerSession(email: string) {
  const payload = JSON.stringify({ email: email.trim().toLowerCase(), exp: Date.now() + MAX_AGE_SECONDS * 1000 });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const token = `${payloadB64}.${sign(payloadB64)}`;

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/inventaire/proprietaire",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearOwnerSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Email vérifié de la session en cours, ou null si absente/invalide/expirée. */
export async function getOwnerSessionEmail(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (typeof payload.email !== "string" || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload.email;
  } catch {
    return null;
  }
}
