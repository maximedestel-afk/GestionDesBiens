"use client";

import { useState } from "react";

/** Copie le lien de l'espace propriétaire (self-service) : à envoyer au
 * propriétaire par le canal habituel (email, SMS...) — l'accès se fait
 * ensuite avec son adresse email, pas besoin de compte. */
export function OwnerPortalLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = `${window.location.origin}/inventaire/proprietaire`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Presse-papiers indisponible — ignoré silencieusement.
    }
  }

  return (
    <button type="button" onClick={handleClick} className="btn-secondary btn-sm">
      {copied ? "Lien copié ✓" : "🔗 Copier le lien pour le propriétaire"}
    </button>
  );
}
