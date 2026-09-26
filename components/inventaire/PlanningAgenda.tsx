"use client";

import { useMemo, useState } from "react";
import type { Attachment, Profile, Property, Task } from "@/lib/inventaire/types";
import { TaskCard, formatScheduledDateFr } from "./TaskCard";

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayLabel(iso: string, today: string): string {
  if (iso === today) return "Aujourd'hui";
  if (iso === addDaysIso(today, 1)) return "Demain";
  if (iso === addDaysIso(today, -1)) return "Hier";
  const label = formatScheduledDateFr(iso);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Vue agenda du Planning : les tâches planifiées, groupées par jour et
 * triées chronologiquement (pas une grille mensuelle — avec de nombreuses
 * tâches courtes sur un même jour, une case de calendrier classique
 * n'aurait pas la place de rester lisible). Par défaut, seules les
 * prochaines tâches non terminées sont affichées, pour que ce qui reste à
 * faire saute aux yeux dès l'ouverture de la page. */
export function PlanningAgenda({
  properties,
  tasks,
  profiles,
  attachments,
}: {
  properties: Property[];
  tasks: Task[];
  profiles: Profile[];
  attachments: Attachment[];
}) {
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const today = todayIso();
  const propertyById = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);

  // listScheduledTasks() ne renvoie que des tâches avec scheduledDate
  // renseignée — ce filtre ne fait que le prouver à TypeScript.
  const scheduledTasks = useMemo(
    () => tasks.filter((t): t is Task & { scheduledDate: string } => t.scheduledDate != null),
    [tasks]
  );

  const pastCount = scheduledTasks.filter((t) => t.scheduledDate < today && (showDone || !t.done)).length;
  const doneCount = scheduledTasks.filter((t) => t.done && (showPast || t.scheduledDate >= today)).length;

  const filtered = scheduledTasks.filter((t) => {
    if (!showDone && t.done) return false;
    if (!showPast && t.scheduledDate < today) return false;
    if (assigneeFilter && t.assignedTo !== assigneeFilter) return false;
    return true;
  });

  // Déjà trié par scheduled_date puis start_time côté requête : un Map
  // préserve cet ordre en regroupant par jour.
  const groups = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const list = map.get(t.scheduledDate) ?? [];
      list.push(t);
      map.set(t.scheduledDate, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="rounded-[10px] border border-black/10 bg-white px-3 py-1.5 text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        >
          <option value="">Tous les assignés</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.email}
            </option>
          ))}
        </select>
        {pastCount > 0 && (
          <button type="button" onClick={() => setShowPast((v) => !v)} className="btn-secondary btn-sm">
            {showPast ? "Masquer les tâches passées" : `Afficher les tâches passées (${pastCount})`}
          </button>
        )}
        {doneCount > 0 && (
          <button type="button" onClick={() => setShowDone((v) => !v)} className="btn-secondary btn-sm">
            {showDone ? "Masquer les tâches terminées" : `Afficher les tâches terminées (${doneCount})`}
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-6 text-[15px] text-[#6e6e73]">
          Aucune tâche planifiée à venir.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(([date, dayTasks]) => (
            <div key={date}>
              <h2 className="text-[15px] font-semibold text-[#1d1d1f]">{dayLabel(date, today)}</h2>
              <div className="mt-3 space-y-3">
                {dayTasks.map((task) => {
                  const property = propertyById.get(task.propertyId);
                  return (
                    <TaskCard
                      key={task.id}
                      propertyId={task.propertyId}
                      task={task}
                      profiles={profiles}
                      attachments={attachments.filter((a) => a.entityType === "task" && a.entityId === task.id)}
                      propertyLabel={
                        property ? `${property.reference}${property.address ? ` — ${property.address}` : ""}` : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
