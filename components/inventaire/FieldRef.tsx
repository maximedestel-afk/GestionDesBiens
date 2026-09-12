"use client";

import { useState } from "react";
import { CSV_FIELDS, type CsvFieldKey } from "@/lib/inventaire/csvFields";

/** Petit badge à côté d'un champ : au survol, affiche le nom de colonne à
 * utiliser dans un fichier Excel/CSV pour importer ce champ ; au clic, le
 * copie dans le presse-papiers. Voir la page /inventaire/import. */
export function FieldRef({ csvKey }: { csvKey: CsvFieldKey }) {
  const [copied, setCopied] = useState(false);
  const header = CSV_FIELDS[csvKey]?.header;
  if (!header) return null;

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(header as string);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) — ignoré silencieusement.
    }
  }

  return (
    <span className="group/ref relative ml-1 inline-flex">
      <button
        type="button"
        onClick={handleClick}
        className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium leading-none text-black/25 transition hover:bg-black/[0.06] hover:text-[#6e6e73]"
      >
        #
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-max max-w-[220px] -translate-x-1/2 rounded-md bg-[#1d1d1f] px-2 py-1 text-center text-[11px] leading-snug text-white shadow-lg group-hover/ref:block"
      >
        {copied ? "Copié ✓" : `Colonne Excel : « ${header} » — clic pour copier`}
      </span>
    </span>
  );
}
