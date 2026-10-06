"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Profile, Property, Task } from "@/lib/inventaire/types";

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

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Lundi de la semaine contenant le 1er du mois — même logique que CAL
 * (onglet Calendrier d'un bien), pour une grille de 42 jours (6 semaines)
 * couvrant toujours le mois entier. */
function startOfGrid(year: number, month: number): Date {
  const firstOfMonth = new Date(year, month - 1, 1);
  const mondayIndexed = (firstOfMonth.getDay() + 6) % 7;
  return addDays(firstOfMonth, -mondayIndexed);
}

interface DayInfo {
  date: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  tasks: (Task & { scheduledDate: string })[];
}

/** Vue calendrier (grille mensuelle) du Planning : chaque jour affiche les
 * tâches planifiées ce jour-là, avec la référence du bien et le sujet de
 * la tâche — pour voir en un coup d'œil la charge par jour, en complément
 * de la vue Agenda (chronologique, meilleure pour le détail d'une tâche). */
export function PlanningCalendar({
  properties,
  tasks,
  profiles,
}: {
  properties: Property[];
  tasks: Task[];
  profiles: Profile[];
}) {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const propertyById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  const scheduledTasks = useMemo(
    () => tasks.filter((t): t is Task & { scheduledDate: string } => t.scheduledDate != null),
    [tasks]
  );

  function goToMonth(delta: number) {
    const base = new Date(year, month - 1 + delta, 1);
    setYear(base.getFullYear());
    setMonth(base.getMonth() + 1);
  }

  function goToToday() {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  }

  const todayIso = toISODate(now);
  const monthStartIso = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 1);
  const monthEndIso = toISODate(monthEndDate);

  const days: DayInfo[] = useMemo(() => {
    const gridStart = startOfGrid(year, month);
    return Array.from({ length: 42 }, (_, i) => {
      const d = addDays(gridStart, i);
      const iso = toISODate(d);
      return {
        date: iso,
        dayNumber: d.getDate(),
        inMonth: iso >= monthStartIso && iso < monthEndIso,
        isToday: iso === todayIso,
        tasks: scheduledTasks
          .filter((t) => t.scheduledDate === iso)
          .sort((a, b) => (a.startTime ?? "").localeCompare(b.startTime ?? "")),
      };
    });
  }, [scheduledTasks, year, month, monthStartIso, monthEndIso, todayIso]);

  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
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

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-[#6e6e73]">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={`flex min-h-[72px] flex-col gap-0.5 rounded-[8px] border p-1 text-left ${
              day.isToday ? "border-[#0071e3]/40 bg-[#0071e3]/[0.04]" : "border-black/[0.06] bg-white"
            } ${!day.inMonth ? "opacity-40" : ""}`}
          >
            <span
              className={`text-[11px] ${
                day.isToday
                  ? "flex h-4 w-4 items-center justify-center rounded-full bg-[#0071e3] font-semibold text-white"
                  : "text-[#6e6e73]"
              }`}
            >
              {day.dayNumber}
            </span>
            <div className="space-y-0.5">
              {day.tasks.map((task) => {
                const property = propertyById.get(task.propertyId);
                const assignee = task.assignedTo ? profileById.get(task.assignedTo) : undefined;
                const title = [
                  property?.reference,
                  task.text,
                  task.startTime ? `${task.startTime}${task.endTime ? `–${task.endTime}` : ""}` : null,
                  assignee ? (assignee.fullName || assignee.email) : null,
                ]
                  .filter(Boolean)
                  .join(" — ");
                return (
                  <Link
                    key={task.id}
                    href={`/inventaire/biens/${task.propertyId}?tab=taches`}
                    title={title}
                    className={`block truncate rounded-[4px] px-1 py-0.5 text-[10px] leading-tight ${
                      task.done
                        ? "bg-black/[0.04] text-[#6e6e73] line-through"
                        : "bg-[#0071e3]/10 text-[#0071e3] hover:bg-[#0071e3]/20"
                    }`}
                  >
                    <span className="font-semibold">{property?.reference ?? "?"}</span> {task.text}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
