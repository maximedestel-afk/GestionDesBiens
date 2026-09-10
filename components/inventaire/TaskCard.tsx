"use client";

import { useTransition } from "react";
import type { Profile, Task } from "@/lib/inventaire/types";
import { addTaskComment, deleteTask, toggleTaskDone } from "@/lib/inventaire/actions";
import { ActionForm } from "./ActionForm";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
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

export function TaskCard({ propertyId, task, profiles }: { propertyId: string; task: Task; profiles: Profile[] }) {
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
