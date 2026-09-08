"use client";

import type { CompletenessCheck } from "@/lib/inventaire/completeness";

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

  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6e6e73]">
        {checks.length} information{checks.length > 1 ? "s" : ""} manquante{checks.length > 1 ? "s" : ""}. Cliquez
        sur un élément pour y accéder directement.
      </p>
      {[...byTab.entries()].map(([tab, tabChecks]) => (
        <fieldset key={tab} className="card p-5">
          <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">{tab}</legend>
          <ul className="mt-2 space-y-1">
            {tabChecks.map((check) => (
              <li key={check.key}>
                <button
                  type="button"
                  onClick={() => onNavigate(check)}
                  className="flex w-full items-center justify-between gap-2 rounded-[10px] px-3.5 py-2.5 text-left text-[15px] text-[#1d1d1f] transition hover:bg-amber-50"
                >
                  <span className="flex items-center gap-2">
                    <span>⚠️</span>
                    {check.label}
                  </span>
                  <span className="text-[13px] text-sky-600">Accéder →</span>
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
    </div>
  );
}
