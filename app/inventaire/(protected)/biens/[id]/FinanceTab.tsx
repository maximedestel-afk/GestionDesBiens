"use client";

import { useEffect, useState } from "react";
import type { PropertyOwner } from "@/lib/inventaire/types";

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

interface UpcomingReservation {
  id: string;
  checkIn: string;
  checkOut: string;
  bookedAt: string | null;
  nights: number | null;
  guestName: string | null;
  guests: number | null;
  bookingPlatformLabel: string | null;
  rentsCents: number;
  netRevenueCents: number;
}

function formatDateFr(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
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
}: {
  propertyId: string;
  owner: PropertyOwner | null;
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [months, setMonths] = useState<MonthlyFinance[] | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingReservation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);

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
          setUpcoming(null);
        } else {
          setMonths(data.months);
          setUpcoming(data.upcoming ?? null);
          setLoadWarning(data.warning ?? null);
        }
      } catch {
        setLoadError("Impossible de charger les données VRPlatform.");
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, year]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 3 + i);

  return (
    <div className="space-y-4">
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

      {!loading && !loadError && (
        <div className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Dernières réservations</h2>
          {!upcoming || upcoming.length === 0 ? (
            <p className="text-[13px] text-[#6e6e73]">Aucune réservation à venir.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-black/10 text-left text-[12px] uppercase tracking-wide text-[#6e6e73]">
                    <th className="py-2 pr-3">Date de réservation</th>
                    <th className="py-2 pr-3">Arrivée</th>
                    <th className="py-2 pr-3">Départ</th>
                    <th className="py-2 pr-3">Nuits</th>
                    <th className="py-2 pr-3">Voyageur</th>
                    <th className="py-2 pr-3">Voyageurs</th>
                    <th className="py-2 pr-3">Plateforme</th>
                    <th className="py-2 pr-3">Prix / nuit (brut)</th>
                    <th className="py-2 pr-3">Net Commissionable Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((r) => {
                    const grossNightlyRate = r.nights && r.nights > 0 ? r.rentsCents / 100 / r.nights : null;
                    return (
                      <tr key={r.id} className="border-b border-black/5">
                        <td className="py-2 pr-3 text-[#1d1d1f]">
                          {r.bookedAt ? formatDateFr(r.bookedAt.slice(0, 10)) : "—"}
                        </td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{formatDateFr(r.checkIn)}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{formatDateFr(r.checkOut)}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{r.nights ?? "—"}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{r.guestName ?? "—"}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{r.guests ?? "—"}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{r.bookingPlatformLabel ?? "—"}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">
                          {grossNightlyRate != null ? formatEuros(grossNightlyRate) : "—"}
                        </td>
                        <td className="py-2 pr-3 font-semibold text-[#1d1d1f]">
                          {formatEuros(r.netRevenueCents / 100)}
                        </td>
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
