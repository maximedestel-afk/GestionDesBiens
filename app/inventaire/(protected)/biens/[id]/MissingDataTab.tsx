"use client";

import type { CompletenessCheck } from "@/lib/inventaire/completeness";
import { PROPERTY_TABS } from "@/lib/inventaire/tabs";

// Ordre d'affichage des groupes = celui de la barre d'onglets (Détails
// appartement, Clés/Serrure, Agencement…), pas l'ordre de définition des
// vérifications dans completeness.ts qui n'a rien à voir.
const TAB_ORDER: Record<string, number> = Object.fromEntries(PROPERTY_TABS.map((t, i) => [t.label, i]));

export function MissingDataTab({
  checks,
  onNavigate,
}: {
  checks: CompletenessCheck[];
  onNavigate: (check: CompletenessCheck) => void;
}) {
  if (checks.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-black/15 p-6 text-[15px] text-[#6e6e73]">
        Aucune donnée manquante — tout est renseigné 🎉
      </p>
    );
  }

  const byTab = new Map<string, CompletenessCheck[]>();
  for (const check of checks) {
    const list = byTab.get(check.tab) ?? [];
    list.push(check);
    byTab.set(check.tab, list);
  }

  const orderedGroups = [...byTab.entries()].sort(
    ([tabA], [tabB]) => (TAB_ORDER[tabA] ?? 999) - (TAB_ORDER[tabB] ?? 999)
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6e6e73]">
        {checks.length} information{checks.length > 1 ? "s" : ""} manquante{checks.length > 1 ? "s" : ""}. Cliquez
        sur un élément pour y accéder directement.
      </p>
      {orderedGroups.map(([tab, tabChecks]) => (
        <fieldset key={tab} className="card p-5">
          <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">{tab}</legend>
          <ul className="mt-2 space-y-1">
            {tabChecks.map((check) => (
              <li key={check.key}>
                {/* Un <div role="button"> plutôt qu'un <button> : cette liste reste
                    cliquable (navigation, pas une écriture) même dans le <fieldset
                    disabled> qui rend le reste de la fiche en lecture seule pour le
                    rôle "prestataire". */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate(check)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onNavigate(check);
                  }}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] px-3.5 py-2.5 text-left text-[15px] text-[#1d1d1f] transition hover:bg-amber-50"
                >
                  <span className="flex items-center gap-2">
                    <span>⚠️</span>
                    {check.label}
                  </span>
                  <span className="text-[13px] text-sky-600">Accéder →</span>
                </div>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}
