"use client";

import { useState } from "react";
import type { Profile, Task } from "@/lib/inventaire/types";
import { createTask } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { TaskCard } from "@/components/inventaire/TaskCard";

function NewTaskForm({ propertyId, profiles }: { propertyId: string; profiles: Profile[] }) {
  return (
    <ActionForm className="card space-y-3 p-5" resetOnSuccess action={createTask}>
      {({ pending, error, success }) => (
        <>
          <h2 className="text-sm font-semibold text-[#1d1d1f]">+ Nouvelle tâche</h2>
          <input type="hidden" name="propertyId" value={propertyId} />
          <div>
            <label className="field-label" htmlFor="text">
              Tâche
            </label>
            <textarea
              id="text"
              name="text"
              required
              rows={2}
              placeholder="ex. Doubler clé puis remettre dans la Keybox et Keynest"
              className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="assignedTo">
              Assigner à (optionnel)
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              defaultValue=""
              className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
            >
              <option value="">Non assigné</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between">
            {error && <span className="text-sm text-red-600">{error}</span>}
            {success && <span className="text-sm text-emerald-600">Tâche ajoutée ✓</span>}
            <button type="submit" disabled={pending} className="btn-primary ml-auto">
              {pending ? "…" : "Ajouter"}
            </button>
          </div>
        </>
      )}
    </ActionForm>
  );
}

export function TasksTab({
  propertyId,
  tasks,
  profiles,
}: {
  propertyId: string;
  tasks: Task[];
  profiles: Profile[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-4 pb-20">
      {showForm ? (
        <NewTaskForm propertyId={propertyId} profiles={profiles} />
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1 rounded-full border-2 border-[#0071e3] px-3.5 py-1.5 text-sm font-semibold text-[#0071e3] transition hover:bg-[#0071e3]/10"
        >
          + Nouvelle tâche
        </button>
      )}

      {tasks.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/15 p-6 text-[15px] text-[#6e6e73]">
          Aucune tâche pour ce bien.
        </p>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} propertyId={propertyId} task={task} profiles={profiles} />
          ))}
        </div>
      )}
    </div>
  );
}
