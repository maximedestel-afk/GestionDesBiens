const UNITS = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const TEENS = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "", "quatre-vingt", ""];
const SCALES = ["", "mille", "million", "milliard"];

function twoDigitsToWords(n: number, isFinalGroup: boolean): string {
  if (n < 10) return UNITS[n];
  if (n < 20) return TEENS[n - 10];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  if (tens === 7 || tens === 9) {
    const base = tens === 7 ? "soixante" : "quatre-vingt";
    if (unit === 1 && tens === 7) return `${base} et onze`;
    return `${base}-${TEENS[unit]}`;
  }
  if (tens === 8) {
    if (unit === 0) return isFinalGroup ? "quatre-vingts" : "quatre-vingt";
    return `quatre-vingt-${UNITS[unit]}`;
  }
  if (unit === 0) return TENS[tens];
  if (unit === 1) return `${TENS[tens]} et un`;
  return `${TENS[tens]}-${UNITS[unit]}`;
}

function threeDigitsToWords(n: number, isFinalGroup: boolean): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let out = "";
  if (hundreds > 0) {
    out += hundreds === 1 ? "cent" : `${UNITS[hundreds]} cent`;
    if (rest === 0 && hundreds > 1 && isFinalGroup) out += "s";
    if (rest > 0) out += " ";
  }
  if (rest > 0) out += twoDigitsToWords(rest, isFinalGroup);
  return out;
}

/** Convertit un entier positif en toutes lettres françaises (ex. 1500 →
 * "mille cinq cents"). Utilisé pour les montants du bail (loyer, charges,
 * total) qui doivent apparaître en toutes lettres dans le contrat. */
export function numberToFrenchWords(value: number): string {
  const n = Math.round(value);
  if (n === 0) return "zéro";
  if (n < 0) return `moins ${numberToFrenchWords(-n)}`;

  const groups: number[] = [];
  let rem = n;
  while (rem > 0) {
    groups.push(rem % 1000);
    rem = Math.floor(rem / 1000);
  }

  const parts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    if (i === 1 && g === 1) {
      parts.push("mille");
      continue;
    }
    const isFinalGroup = i === 0;
    let groupWords = threeDigitsToWords(g, isFinalGroup);
    if (i > 0) {
      const scale = SCALES[i];
      groupWords += ` ${i >= 2 && g > 1 ? `${scale}s` : scale}`;
    }
    parts.push(groupWords);
  }
  return parts.join(" ").trim();
}
