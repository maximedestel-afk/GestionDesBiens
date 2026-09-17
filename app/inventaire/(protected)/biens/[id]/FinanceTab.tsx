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
  revenueCents: number;
  nightsBooked: number;
  daysInMonth: number;
  fillRate: number;
}

interface VrPlatformListingOption {
  id: string;
  name: string;
  address: string | null;
}

function formatEuros(value: number): string {
  return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} %`;
}

export function FinanceTab({
  propertyId,
  financeSettings,
  owner,
}: {
  propertyId: string;
  financeSettings: PropertyFinanceSettings | null;
  owner: PropertyOwner | null;
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [months, setMonths] = useState<MonthlyFinance[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [listingOptions, setListingOptions] = useState<VrPlatformListingOption[] | null>(null);
  const [listingsError, setListingsError] = useState<string | null>(null);

  const listingId = financeSettings?.vrplatformListingId ?? null;
  const isFixedRent = owner?.rentType === "fixe";
  const fixedRentAmount = owner?.rentAmount ?? null;

  useEffect(() => {
    fetch(`/inventaire/biens/${propertyId}/finance/listings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setListingsError(data.error);
        else setListingOptions(data.listings);
      })
      .catch(() => setListingsError("Impossible de charger les listings VRPlatform."));
  }, [propertyId]);

  useEffect(() => {
    if (!listingId) return;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/inventaire/biens/${propertyId}/finance?year=${year}`);
        const data = await res.json();
        if (data.error) {
          setLoadError(data.error);
          setMonths(null);
        } else {
          setMonths(data.months);
        }
      } catch {
        setLoadError("Impossible de charger les données VRPlatform.");
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, listingId, year]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Listing VRPlatform</h2>
        <p className="text-[13px] text-[#6e6e73]">
          Associez ce bien à son listing VRPlatform pour calculer le revenu réel et le taux de remplissage à partir
          des réservations.
        </p>
        <ActionForm className="flex flex-wrap items-end gap-3" action={(formData) => savePropertyFinanceSettings(propertyId, formData)}>
          {({ pending, error, success }) => (
            <>
              <div>
                <label className="field-label" htmlFor="vrplatformListingId">
                  Listing
                </label>
                <select
                  id="vrplatformListingId"
                  name="vrplatformListingId"
                  defaultValue={listingId ?? ""}
                  disabled={!listingOptions}
                  className="mt-1 w-full min-w-[280px] rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                >
                  <option value="">Aucun</option>
                  {listingOptions?.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                      {option.address ? ` — ${option.address}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-secondary btn-sm">
                Enregistrer
              </button>
              <SaveStatus pending={pending} error={error || listingsError} success={success} />
            </>
          )}
        </ActionForm>
      </div>

      {listingId && (
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

          {months && !loading && !loadError && (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-black/10 text-left text-[12px] uppercase tracking-wide text-[#6e6e73]">
                    <th className="py-2 pr-3">Mois</th>
                    <th className="py-2 pr-3">Revenu</th>
                    <th className="py-2 pr-3">Taux de remplissage</th>
                    {isFixedRent && <th className="py-2 pr-3">Loyer fixe</th>}
                    {isFixedRent && <th className="py-2 pr-3">Écart</th>}
                  </tr>
                </thead>
                <tbody>
                  {months.map((m) => {
                    const revenueEuros = m.revenueCents / 100;
                    const diff = fixedRentAmount != null ? revenueEuros - fixedRentAmount : null;
                    return (
                      <tr key={m.month} className="border-b border-black/5">
                        <td className="py-2 pr-3 text-[#1d1d1f]">{MONTH_LABELS[m.month - 1]}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{formatEuros(revenueEuros)}</td>
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
      )}
    </div>
  );
}
