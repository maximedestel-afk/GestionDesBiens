"use client";

import { useState, useTransition } from "react";
import type { Profile, Task } from "@/lib/inventaire/types";
import { addTaskComment, createTask, deleteTask, toggleTaskDone } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

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

function ReplyForm({ propertyId, taskId }: { propertyId: string; taskId: string }) {
  return (
    <ActionForm
      className="mt-2 flex gap-2"
      resetOnSuccess
      action={(formData) => addTaskComment(propertyId, taskId, formData)}
    >
      {({ pending }) => (
        <>
          <input
            name="text"
            placeholder="Répondre… (ex. RDV le 24 pour refaire les clés)"
            className="flex-1 rounded-[10px] border border-black/10 bg-white px-3.5 py-2 text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
          />
          <button type="submit" disabled={pending} className="btn-secondary btn-sm shrink-0">
            {pending ? "…" : "Répondre"}
          </button>
        </>
      )}
    </ActionForm>
  );
}

function TaskCard({ propertyId, task, profiles }: { propertyId: string; task: Task; profiles: Profile[] }) {
  const [pending, startTransition] = useTransition();
  const assignee = profiles.find((p) => p.id === task.assignedTo);

  return (
    <div className={`card p-5 ${task.done ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={task.done}
            disabled={pending}
            onChange={(e) => {
              const done = e.target.checked;
              startTransition(async () => {
                await toggleTaskDone(propertyId, task.id, done).catch(() => {});
              });
            }}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <div>
            <p className={`text-[15px] text-[#1d1d1f] ${task.done ? "line-through" : ""}`}>{task.text}</p>
            <p className="mt-1 text-[12px] text-[#6e6e73]">
              {task.createdByEmail ?? "?"} · {formatDateTime(task.createdAt)}
              {assignee && <> · Assigné à {assignee.email}</>}
              {task.done && task.doneAt && (
                <>
                  {" "}
                  · Fait le {formatDateTime(task.doneAt)}
                  {task.doneByEmail && ` par ${task.doneByEmail}`}
                </>
              )}
            </p>
          </div>
        </div>
        <ConfirmDeleteButton confirmText="Supprimer cette tâche ?" action={() => deleteTask(propertyId, task.id)} />
      </div>

      {task.comments.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-black/[0.06] pt-3">
          {task.comments.map((c) => (
            <li key={c.id} className="text-[13px] text-[#1d1d1f]">
              {c.text}
              <span className="ml-1.5 text-[11px] text-[#6e6e73]">
                — {c.createdByEmail ?? "?"} · {formatDateTime(c.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <ReplyForm propertyId={propertyId} taskId={task.id} />
    </div>
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
