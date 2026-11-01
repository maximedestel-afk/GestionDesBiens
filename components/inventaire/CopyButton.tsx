"use client";

import { useState } from "react";

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="6.5" y="6.5" width="10" height="11" rx="1.5" />
      <path d="M4 13.5V5a1.5 1.5 0 0 1 1.5-1.5H13" />
    </svg>
  );
}

/** Petit bouton "copier" à placer à côté d'un label de champ (même esprit
 * que FieldRef) — copie le texte renvoyé par `getText()`, appelée au clic
 * pour lire la valeur la plus à jour (ex. le contenu actuel d'un champ non
 * contrôlé, même si pas encore enregistré). */
export function CopyButton({
  getText,
  label = "Copier",
}: {
  getText: () => string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    const text = getText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée) — ignoré silencieusement.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-medium leading-none text-black/35 transition hover:bg-black/[0.06] hover:text-[#6e6e73]"
    >
      <CopyIcon />
      {copied ? "Copié ✓" : "Copier"}
    </button>
  );
}
