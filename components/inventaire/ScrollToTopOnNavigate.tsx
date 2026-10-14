"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Remonte systématiquement en haut de page à chaque changement de page
 * (nouveau chemin — pas un simple changement de paramètre d'URL, ex. un
 * onglet de bien, qui gère son propre scroll). Filet de sécurité : sur
 * mobile, le scroll-to-top par défaut de Next.js peut ne pas s'appliquer
 * correctement après une navigation depuis le tiroir de menu (dont la page
 * derrière reste parfois scrollée) — la page suivante s'ouvrait alors au
 * milieu plutôt qu'en haut. */
export function ScrollToTopOnNavigate() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
