"use client";

import { useEffect, useState } from "react";
import type { PropertyFinanceSettings, PropertyOwner } from "@/lib/inventaire/types";
import { savePropertyFinanceSettings } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

interface MonthlyFinance {
  month: number;
  rentsCents: number;
  channelFeesCents: number;
  netRevenueCents: number;
  nightsBooked: number;
  daysInMonth: number;
  fillRate: number;
}

function formatEuros(value: number): string {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`;
}

export function FinanceTab({
  propertyId,
  owner,
  financeSettings,
}: {
  propertyId: string;
  owner: PropertyOwner | null;
  financeSettings: PropertyFinanceSettings | null;
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [months, setMonths] = useState<MonthlyFinance[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [extraReferences, setExtraReferences] = useState<string[]>(
    financeSettings?.extraVrplatformReferences ?? []
  );

  const isFixedRent = owner?.rentType === "fixe";
  // Loyer fixe total (comme le "Total" de l'onglet Propriétaire) : loyer +
  // charges + autre montant — pas seulement le loyer nu.
  const fixedRentAmount =
    owner?.rentAmount != null ? owner.rentAmount + (owner.chargesAmount ?? 0) + (owner.otherAmount ?? 0) : null;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      setLoadWarning(null);
      try {
        const res = await fetch(`/inventaire/biens/${propertyId}/finance?year=${year}`);
        const data = await res.json();
        if (data.error) {
          setLoadError(data.error);
          setMonths(null);
        } else {
          setMonths(data.months);
          setLoadWarning(data.warning ?? null);
        }
      } catch {
        setLoadError("Impossible de charger les données VRPlatform.");
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, year, refreshKey]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Regroupement VRPlatform</h2>
        <p className="text-[13px] text-[#6e6e73]">
          Certains biens correspondent à plusieurs listings VRPlatform distincts (ex. « 14ECO », « 14ECO 1 »,
          « 14ECO 2 ») — ajoutez ici leurs références pour les additionner au tableau ci-dessous.
        </p>
        <ActionForm
          className="space-y-3"
          action={async (formData) => {
            await savePropertyFinanceSettings(propertyId, formData);
            setRefreshKey((k) => k + 1);
          }}
        >
          {({ pending, error, success }) => (
            <>
              <div className="space-y-2">
                {extraReferences.length === 0 && (
                  <p className="text-[13px] text-[#6e6e73]">Aucune référence supplémentaire.</p>
                )}
                {extraReferences.map((reference, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      name="extraVrplatformReferences"
                      type="text"
                      value={reference}
                      onChange={(e) =>
                        setExtraReferences((refs) => refs.map((r, i) => (i === index ? e.target.value : r)))
                      }
                      placeholder="ex. 14ECO 1"
                      className="w-full min-w-[220px] rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setExtraReferences((refs) => refs.filter((_, i) => i !== index))}
                      aria-label="Supprimer cette référence"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-black/10 text-[#6e6e73] transition hover:bg-black/[0.04]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setExtraReferences((refs) => [...refs, ""])}
                  className="btn-secondary btn-sm"
                >
                  + Ajouter une référence
                </button>
                <button type="submit" className="btn-secondary btn-sm">
                  Enregistrer
                </button>
                <SaveStatus pending={pending} error={error} success={success} />
              </div>
            </>
          )}
        </ActionForm>
      </div>

      <div className="card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Finances</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number.parseInt(e.target.value, 10))}
            className="rounded-[10px] border border-black/10 bg-white px-3 py-1.5 text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {loading && <p className="text-[13px] text-[#6e6e73]">Chargement des données VRPlatform…</p>}
        {loadError && <p className="text-[13px] text-red-600">{loadError}</p>}
        {loadWarning && !loadError && <p className="text-[13px] text-amber-600">{loadWarning}</p>}

        {months && !loading && !loadError && (
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-black/10 text-left text-[12px] uppercase tracking-wide text-[#6e6e73]">
                  <th className="py-2 pr-3">Mois</th>
                  <th className="py-2 pr-3">Rents</th>
                  <th className="py-2 pr-3">Channel Fees</th>
                  <th className="py-2 pr-3">Net Commissionable Revenue</th>
                  <th className="py-2 pr-3">Taux de remplissage</th>
                  {isFixedRent && <th className="py-2 pr-3">Loyer fixe</th>}
                  {isFixedRent && <th className="py-2 pr-3">Écart</th>}
                </tr>
              </thead>
              <tbody>
                {months.map((m) => {
                  const netRevenueEuros = m.netRevenueCents / 100;
                  const diff = fixedRentAmount != null ? netRevenueEuros - fixedRentAmount : null;
                  return (
                    <tr key={m.month} className="border-b border-black/5">
                      <td className="py-2 pr-3 text-[#1d1d1f]">{MONTH_LABELS[m.month - 1]}</td>
                      <td className="py-2 pr-3 text-[#1d1d1f]">{formatEuros(m.rentsCents / 100)}</td>
                      <td className="py-2 pr-3 text-[#1d1d1f]">{formatEuros(m.channelFeesCents / 100)}</td>
                      <td className="py-2 pr-3 font-semibold text-[#1d1d1f]">{formatEuros(netRevenueEuros)}</td>
                      <td className="py-2 pr-3 text-[#1d1d1f]">{formatPercent(m.fillRate)}</td>
                      {isFixedRent && (
                        <td className="py-2 pr-3 text-[#1d1d1f]">
                          {fixedRentAmount != null ? formatEuros(fixedRentAmount) : "—"}
                        </td>
                      )}
                      {isFixedRent && (
                        <td
                          className={`py-2 pr-3 font-semibold ${
                            diff == null ? "text-[#6e6e73]" : diff >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {diff != null ? `${diff >= 0 ? "+" : ""}${formatEuros(diff)}` : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
