"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { useUserRole } from "./UserRoleContext";

export function ConfirmDeleteButton({
  label = "Supprimer",
  confirmText,
  action,
  className = "text-[13px] font-medium text-red-600 transition hover:text-red-700",
  allowOperationsWhenEmpty = false,
  isEmpty = false,
  allowManager = false,
}: {
  label?: string;
  confirmText: string;
  action: () => Promise<void>;
  className?: string;
  /** Les rôles Operations et Manager n'ont normalement pas le droit de
   * suppression : ne passer ce flag à true que pour les suppressions où
   * c'est explicitement autorisé (ex. équipements), combiné à `isEmpty` pour
   * n'autoriser que les éléments sans aucune donnée renseignée. */
  allowOperationsWhenEmpty?: boolean;
  isEmpty?: boolean;
  /** Manager peut en plus supprimer librement les photos/documents (pièces
   * jointes), sans la restriction "uniquement si vide" — ex. galerie de fichiers. */
  allowManager?: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const role = useUserRole();

  const canDelete =
    role === "admin" ||
    (allowManager && role === "manager") ||
    ((role === "operations" || role === "manager") && allowOperationsWhenEmpty && isEmpty);
  if (!canDelete) return null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={(event) => {
          event.stopPropagation();
          setError(null);
          dialogRef.current?.showModal();
        }}
      >
        {label}
      </button>
      <dialog
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
        className="card w-80 max-w-[90vw] p-0 backdrop:bg-black/30 backdrop:backdrop-blur-sm"
      >
        <div className="p-5">
          <p className="text-[15px] text-[#1d1d1f]">{confirmText}</p>
          {error && <p className="mt-2 text-[13px] text-red-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn-secondary btn-sm">
              Annuler
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await action();
                    dialogRef.current?.close();
                  } catch (e) {
                    unstable_rethrow(e);
                    setError(e instanceof Error ? e.message : "Une erreur est survenue.");
                  }
                });
              }}
              className="btn-danger btn-sm"
            >
              {pending ? "Suppression…" : "Confirmer la suppression"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
