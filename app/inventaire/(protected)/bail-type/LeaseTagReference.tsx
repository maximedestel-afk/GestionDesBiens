"use client";

import { useState } from "react";

/** Liste de balises `[xxx]` à cliquer pour copier — même principe que le
 * badge "#" (colonne Excel) déjà utilisé ailleurs dans l'app, mais pour les
 * balises du modèle de bail Word, qui n'étaient jusque-là visibles nulle
 * part dans l'interface. */
export function LeaseTagReference({ tags }: { tags: string[] }) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(tag: string) {
    try {
      await navigator.clipboard.writeText(`[${tag}]`);
      setCopied(tag);
      window.setTimeout(() => setCopied((c) => (c === tag ? null : c)), 1500);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) — ignoré silencieusement.
    }
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li key={tag}>
          <button
            type="button"
            onClick={() => copy(tag)}
            title="Cliquer pour copier"
            className="rounded-full bg-black/[0.05] px-2.5 py-1 font-mono text-[12px] text-[#1d1d1f] transition hover:bg-black/[0.1]"
          >
            {copied === tag ? "Copié ✓" : `[${tag}]`}
          </button>
        </li>
      ))}
    </ul>
  );
}
