"use client";

import { useState } from "react";
import type { Attachment, Profile, Property, Task } from "@/lib/inventaire/types";
import { PlanningAgenda } from "./PlanningAgenda";
import { PlanningCalendar } from "./PlanningCalendar";

/** Bascule entre la vue Agenda (chronologique, par défaut — le détail
 * d'une tâche) et la vue Calendrier (grille mensuelle — la charge par
 * jour, référence du bien + sujet de la tâche). */
export function PlanningViews({
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
  const [view, setView] = useState<"agenda" | "calendar">("agenda");

  return (
    <div>
      <div className="mt-4 inline-flex rounded-full border border-black/10 bg-white p-0.5 text-[13px] font-medium">
        <button
          type="button"
          onClick={() => setView("agenda")}
          className={`rounded-full px-3.5 py-1.5 transition ${
            view === "agenda" ? "bg-[#1d1d1f] text-white" : "text-[#6e6e73] hover:text-[#1d1d1f]"
          }`}
        >
          Agenda
        </button>
        <button
          type="button"
          onClick={() => setView("calendar")}
          className={`rounded-full px-3.5 py-1.5 transition ${
            view === "calendar" ? "bg-[#1d1d1f] text-white" : "text-[#6e6e73] hover:text-[#1d1d1f]"
          }`}
        >
          Calendrier
        </button>
      </div>

      {view === "agenda" ? (
        <PlanningAgenda properties={properties} tasks={tasks} profiles={profiles} attachments={attachments} />
      ) : (
        <div className="mt-6">
          <PlanningCalendar properties={properties} tasks={tasks} profiles={profiles} />
        </div>
      )}
    </div>
  );
}
