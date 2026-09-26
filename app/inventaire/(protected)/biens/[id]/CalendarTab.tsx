"use client";

import { useEffect, useMemo, useState } from "react";

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

const WEEKDAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface CalendarReservation {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number | null;
  guestName: string | null;
  guests: number | null;
  bookingPlatformLabel: string | null;
}

interface PlatformColor {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

const PLATFORM_COLORS: { match: string; color: PlatformColor }[] = [
  { match: "airbnb", color: { bg: "bg-[#FFEDEE]", border: "border-[#FF5A5F]/40", text: "text-[#C7333A]", dot: "#FF5A5F" } },
  { match: "booking", color: { bg: "bg-[#E6EDF7]", border: "border-[#003580]/40", text: "text-[#003580]", dot: "#003580" } },
  { match: "vrbo", color: { bg: "bg-[#E7EEFB]", border: "border-[#245ABC]/40", text: "text-[#245ABC]", dot: "#245ABC" } },
  { match: "expedia", color: { bg: "bg-[#E7EEFB]", border: "border-[#245ABC]/40", text: "text-[#245ABC]", dot: "#245ABC" } },
  { match: "hopper", color: { bg: "bg-[#FDEAEA]", border: "border-[#FF6161]/40", text: "text-[#B23B3B]", dot: "#FF6161" } },
];
const DEFAULT_COLOR: PlatformColor = { bg: "bg-black/[0.05]", border: "border-black/15", text: "text-[#1d1d1f]", dot: "#6e6e73" };

function colorForPlatform(label: string | null): PlatformColor {
  if (!label) return DEFAULT_COLOR;
  const lower = label.toLowerCase();
  return PLATFORM_COLORS.find((p) => lower.includes(p.match))?.color ?? DEFAULT_COLOR;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

/** Lundi de la semaine contenant le 1er du mois — même logique que côté
 * serveur, pour construire la grille de 42 jours (6 semaines) affichée. */
function startOfGrid(year: number, month: number): Date {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const mondayIndexed = (firstOfMonth.getUTCDay() + 6) % 7;
  return addDays(firstOfMonth, -mondayIndexed);
}

function formatDateFr(value: string): string {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatPriceCompact(value: number): string {
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€`;
}

interface DayInfo {
  date: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  occupying: CalendarReservation | null;
  arrivals: CalendarReservation[];
  departures: CalendarReservation[];
  price: number | null;
}

export function CalendarTab({ propertyId }: { propertyId: string }) {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [reservations, setReservations] = useState<CalendarReservation[] | null>(null);
  const [nightlyPrices, setNightlyPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError(null);
      setLoadWarning(null);
      try {
        const res = await fetch(`/inventaire/biens/${propertyId}/calendrier?year=${year}&month=${month}`);
        const data = await res.json();
        if (data.error) {
          setLoadError(data.error);
          setReservations(null);
          setNightlyPrices({});
        } else {
          setReservations(data.reservations ?? []);
          setNightlyPrices(data.nightlyPrices ?? {});
          setLoadWarning(data.warning ?? null);
        }
      } catch {
        setLoadError("Impossible de charger le calendrier VRPlatform.");
      } finally {
        setLoading(false);
      }
    })();
  }, [propertyId, year, month]);

  function goToMonth(delta: number) {
    const base = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(base.getUTCFullYear());
    setMonth(base.getUTCMonth() + 1);
  }

  function goToToday() {
    const today = new Date();
    setYear(today.getUTCFullYear());
    setMonth(today.getUTCMonth() + 1);
  }

  const todayIso = toISODate(now);
  const monthStartIso = toISODate(new Date(Date.UTC(year, month - 1, 1)));
  const monthEndIso = toISODate(new Date(Date.UTC(year, month, 1)));

  const days: DayInfo[] = useMemo(() => {
    const gridStart = startOfGrid(year, month);
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i);
      const iso = toISODate(d);
      const occupying = reservations?.find((r) => r.checkIn <= iso && iso < r.checkOut) ?? null;
      const arrivals = reservations?.filter((r) => r.checkIn === iso) ?? [];
      const departures = reservations?.filter((r) => r.checkOut === iso) ?? [];
      return {
        date: iso,
        dayNumber: d.getUTCDate(),
        inMonth: iso >= monthStartIso && iso < monthEndIso,
        isToday: iso === todayIso,
        occupying,
        arrivals,
        departures,
        price: nightlyPrices[iso] ?? null,
      };
    });
  }, [reservations, nightlyPrices, year, month, monthStartIso, monthEndIso, todayIso]);

  const nightsOccupied = days.filter((d) => d.inMonth && d.occupying).length;
  const daysInMonth = days.filter((d) => d.inMonth).length;
  const fillRate = daysInMonth > 0 ? nightsOccupied / daysInMonth : 0;

  const monthReservations = (reservations ?? [])
    .filter((r) => r.checkOut > monthStartIso && r.checkIn < monthEndIso)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

  const platformsInView = Array.from(
    new Set((reservations ?? []).map((r) => r.bookingPlatformLabel).filter((p): p is string => !!p))
  );

  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-black/[0.04]"
              aria-label="Mois précédent"
            >
              ‹
            </button>
            <h2 className="w-40 text-center text-[15px] font-semibold text-[#1d1d1f]">
              {MONTH_LABELS[month - 1]} {year}
            </h2>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:bg-black/[0.04]"
              aria-label="Mois suivant"
            >
              ›
            </button>
            <button type="button" onClick={goToToday} className="btn-secondary btn-sm ml-1">
              Aujourd&apos;hui
            </button>
          </div>

          {!loading && !loadError && reservations && (
            <div className="text-[13px] text-[#6e6e73]">
              <span className="font-semibold text-[#1d1d1f]">{nightsOccupied}</span> nuits occupées sur {daysInMonth} (
              {(fillRate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} %)
            </div>
          )}
        </div>

        {loading && <p className="text-[13px] text-[#6e6e73]">Chargement du calendrier VRPlatform…</p>}
        {loadError && <p className="text-[13px] text-red-600">{loadError}</p>}
        {loadWarning && !loadError && <p className="text-[13px] text-amber-600">{loadWarning}</p>}

        {!loading && !loadError && reservations && (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-[#6e6e73]">
              {WEEKDAY_LABELS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const color = day.occupying ? colorForPlatform(day.occupying.bookingPlatformLabel) : null;
                const title = day.occupying
                  ? [
                      day.occupying.guestName ?? "Voyageur inconnu",
                      `${formatDateFr(day.occupying.checkIn)} → ${formatDateFr(day.occupying.checkOut)}`,
                      day.occupying.bookingPlatformLabel ?? "Plateforme inconnue",
                      day.occupying.nights ? `${day.occupying.nights} nuits` : null,
                    ]
                      .filter(Boolean)
                      .join(" — ")
                  : day.departures.length > 0
                    ? `Départ : ${day.departures.map((r) => r.guestName ?? "Voyageur").join(", ")}`
                    : undefined;

                return (
                  <div
                    key={day.date}
                    title={title}
                    className={`flex min-h-[64px] flex-col gap-0.5 rounded-[8px] border p-1 text-left ${
                      day.occupying
                        ? `${color?.bg} ${color?.border}`
                        : day.isToday
                          ? "border-[#0071e3]/40 bg-[#0071e3]/[0.04]"
                          : "border-black/[0.06] bg-white"
                    } ${!day.inMonth ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] ${
                          day.isToday ? "flex h-4 w-4 items-center justify-center rounded-full bg-[#0071e3] font-semibold text-white" : "text-[#6e6e73]"
                        }`}
                      >
                        {day.dayNumber}
                      </span>
                      {day.arrivals.length > 0 && (
                        <span className="text-[10px] text-emerald-600" aria-hidden="true">
                          →
                        </span>
                      )}
                      {day.departures.length > 0 && !day.occupying && (
                        <span className="text-[10px] text-[#6e6e73]" aria-hidden="true">
                          ←
                        </span>
                      )}
                    </div>
                    {day.occupying && (
                      <span className={`truncate text-[11px] font-medium ${color?.text}`}>
                        {day.occupying.guestName ?? "Réservé"}
                      </span>
                    )}
                    {day.price != null && (
                      <span className="mt-auto text-[10px] font-semibold text-[#1d1d1f]/70">
                        {formatPriceCompact(day.price)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {platformsInView.length > 0 && (
              <div className="flex flex-wrap items-center gap-3 border-t border-black/[0.06] pt-3 text-[12px] text-[#6e6e73]">
                {platformsInView.map((label) => {
                  const color = colorForPlatform(label);
                  return (
                    <span key={label} className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color.dot }}
                        aria-hidden="true"
                      />
                      {label}
                    </span>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {!loading && !loadError && (
        <div className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold text-[#1d1d1f]">Séjours de {MONTH_LABELS[month - 1].toLowerCase()}</h2>
          {monthReservations.length === 0 ? (
            <p className="text-[13px] text-[#6e6e73]">Aucun séjour ce mois-ci.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-black/10 text-left text-[12px] uppercase tracking-wide text-[#6e6e73]">
                    <th className="py-2 pr-3">Arrivée</th>
                    <th className="py-2 pr-3">Départ</th>
                    <th className="py-2 pr-3">Nuits</th>
                    <th className="py-2 pr-3">Voyageur</th>
                    <th className="py-2 pr-3">Voyageurs</th>
                    <th className="py-2 pr-3">Plateforme</th>
                  </tr>
                </thead>
                <tbody>
                  {monthReservations.map((r) => {
                    const color = colorForPlatform(r.bookingPlatformLabel);
                    return (
                      <tr key={r.id} className="border-b border-black/5">
                        <td className="py-2 pr-3 text-[#1d1d1f]">{formatDateFr(r.checkIn)}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{formatDateFr(r.checkOut)}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{r.nights ?? "—"}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{r.guestName ?? "—"}</td>
                        <td className="py-2 pr-3 text-[#1d1d1f]">{r.guests ?? "—"}</td>
                        <td className="py-2 pr-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] ${color.bg} ${color.text}`}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color.dot }} aria-hidden="true" />
                            {r.bookingPlatformLabel ?? "—"}
                          </span>
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
