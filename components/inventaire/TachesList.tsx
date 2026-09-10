"use client";

import { useState } from "react";
import Link from "next/link";
import type { Profile, Property, Task } from "@/lib/inventaire/types";
import { TaskCard } from "./TaskCard";

export function TachesList({
  properties,
  tasksByProperty,
  profiles,
}: {
  properties: Property[];
  tasksByProperty: Record<string, Task[]>;
  profiles: Profile[];
}) {
  const [showDone, setShowDone] = useState(false);

  const doneCount = properties.reduce(
    (sum, p) => sum + (tasksByProperty[p.id] ?? []).filter((t) => t.done).length,
    0
  );

  const propertiesWithVisibleTasks = properties
    .map((p) => ({
      property: p,
      tasks: (tasksByProperty[p.id] ?? []).filter((t) => showDone || !t.done),
    }))
    .filter(({ tasks }) => tasks.length > 0);

  return (
    <>
      {doneCount > 0 && (
        <button
          type="button"
          onClick={() => setShowDone((v) => !v)}
          className="mt-4 inline-flex items-center gap-1 rounded-full border-2 border-black/10 px-3.5 py-1.5 text-sm font-semibold text-[#1d1d1f] transition hover:bg-black/[0.03]"
        >
          {showDone ? "Masquer les tâches terminées" : `Afficher les tâches terminées (${doneCount})`}
        </button>
      )}

      {propertiesWithVisibleTasks.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-black/15 p-6 text-[15px] text-[#6e6e73]">
          {showDone ? "Aucune tâche pour le moment." : "Aucune tâche en cours."}
        </p>
      ) : (
        <div className="mt-6 space-y-8">
          {propertiesWithVisibleTasks.map(({ property, tasks }) => (
            <div key={property.id}>
              <Link
                href={`/inventaire/biens/${property.id}?tab=taches`}
                className="text-[15px] font-semibold text-[#1d1d1f] hover:text-[#0071e3]"
              >
                {property.reference}
                {property.name && <span className="ml-2 font-normal text-[#6e6e73]">{property.name}</span>}
              </Link>
              <div className="mt-3 space-y-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} propertyId={property.id} task={task} profiles={profiles} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
