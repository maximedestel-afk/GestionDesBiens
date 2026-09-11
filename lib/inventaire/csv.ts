/** Parseur CSV minimal (RFC 4180) : gère les champs entre guillemets
 * contenant des virgules, des guillemets échappés ("") et des retours à la
 * ligne, ainsi que les fins de ligne CRLF ou LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  function pushField() {
    row.push(field);
    field = "";
  }
  function pushRow() {
    pushField();
    rows.push(row);
    row = [];
  }

  while (i < len) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      pushField();
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      pushRow();
      i++;
      continue;
    }
    field += char;
    i++;
  }
  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

/** Insensible aux accents/casse et tolérant à un caractère de remplacement
 * "�" (fichier mal encodé) — pour faire correspondre les en-têtes du CSV
 * quelle que soit leur casse ou leur encodage d'origine. */
export function normalizeHeader(s: string): string {
  return s
    .replace(/�/g, "e")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** Décode un fichier importé en UTF-8 (tolérant, sans planter sur un octet
 * invalide isolé — remplacé par "�"). Si le décodage tolérant contient au
 * moins un octet invalide :
 * - s'il subsiste malgré tout de "vrais" caractères non-ASCII correctement
 *   décodés (pas seulement des "�"), le fichier est globalement en UTF-8
 *   avec quelques octets isolés corrompus (ex. un en-tête mal ressaisi) —
 *   on garde ce décodage tolérant plutôt que de tout casser ;
 * - sinon (aucun caractère accentué n'a pu être décodé, uniquement des
 *   "�"), le fichier est très probablement encodé entièrement en
 *   Windows-1252 (courant pour les exports Excel côté francophone) — on le
 *   redécode entièrement avec cet encodage. */
export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  const lenient = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  if (!lenient.includes("�")) return lenient;

  const hasGenuineNonAscii = /[^\x00-\x7F�]/.test(lenient);
  if (hasGenuineNonAscii) return lenient;

  return new TextDecoder("windows-1252").decode(buffer);
}
