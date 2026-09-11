"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Recherche de biens en direct (débounce) : met à jour l'URL (?q=) au fur
 * et à mesure de la saisie, sans attendre une validation — la liste se
 * met donc à jour automatiquement, y compris en revenant à la liste
 * complète dès que le champ est vidé. */
export function PropertySearchInput({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const term = value.trim();
      router.replace(term ? `${pathname}?q=${encodeURIComponent(term)}` : pathname, { scroll: false });
    }, 300);
    return () => clearTimeout(timeout);
  }, [value, pathname, router]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Rechercher par référence, nom ou propriétaire…"
      className="field-input max-w-md"
    />
  );
}
