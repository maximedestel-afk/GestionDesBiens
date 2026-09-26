"use client";

import { useTransition } from "react";
import Link from "next/link";
import type { Attachment, Profile, Task } from "@/lib/inventaire/types";
import { addTaskComment, deleteTask, toggleTaskDone } from "@/lib/inventaire/actions";
import { ActionForm } from "./ActionForm";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { FileUploadButtons } from "./FileUploadButtons";
import { AttachmentGallery } from "./AttachmentGallery";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}

export function formatScheduledDateFr(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function ScheduleBadge({ task }: { task: Task }) {
  if (!task.scheduledDate) return null;
  const time = task.startTime ? `${task.startTime}${task.endTime ? `–${task.endTime}` : ""}` : null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#0071e3]/10 px-2.5 py-1 text-[12px] font-medium text-[#0071e3]">
      📅 {formatScheduledDateFr(task.scheduledDate)}
      {time && ` · ${time}`}
    </span>
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

export function TaskCard({
  propertyId,
  task,
  profiles,
  attachments,
  propertyLabel,
}: {
  propertyId: string;
  task: Task;
  profiles: Profile[];
  /** Photos de la tâche, déjà chargées — omis (undefined) pour ne pas
   * afficher la section photos là où elles ne sont pas chargées en masse
   * (ex. liste "Tâches" globale par bien). */
  attachments?: Attachment[];
  /** Référence du bien (ex. "19BAU") affichée en lien au-dessus de la
   * tâche — pour une liste qui mélange plusieurs biens (ex. Planning),
   * là où le contexte n'est pas déjà donné par un regroupement visuel. */
  propertyLabel?: string;
}) {
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
            {(propertyLabel || task.scheduledDate) && (
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                {propertyLabel && (
                  <Link
                    href={`/inventaire/biens/${propertyId}?tab=taches`}
                    className="text-[13px] font-semibold text-[#1d1d1f] hover:text-[#0071e3]"
                  >
                    {propertyLabel}
                  </Link>
                )}
                <ScheduleBadge task={task} />
              </div>
            )}
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
        <ConfirmDeleteButton
          confirmText="Supprimer cette tâche ?"
          action={() => deleteTask(propertyId, task.id)}
          allowRoleDeletePermission
        />
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

      {attachments !== undefined && (
        <div className="mt-3 space-y-2 border-t border-black/[0.06] pt-3">
          <AttachmentGallery
            propertyId={propertyId}
            attachments={attachments}
            emptyLabel="Aucune photo"
            variant="grid"
            scrollable
          />
          <FileUploadButtons
            accept="image/*"
            showCamera
            target={{ propertyId, entityType: "task", entityId: task.id, kind: "task_photo" }}
          />
        </div>
      )}

      <ReplyForm propertyId={propertyId} taskId={task.id} />
    </div>
  );
}
