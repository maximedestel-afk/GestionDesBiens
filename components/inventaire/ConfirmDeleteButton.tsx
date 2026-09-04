"use client";

import { useRef, useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";

export function ConfirmDeleteButton({
  label = "Supprimer",
  confirmText,
  action,
  className = "text-sm font-medium text-red-600 hover:text-red-700",
}: {
  label?: string;
  confirmText: string;
  action: () => Promise<void>;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
        className="w-80 max-w-[90vw] rounded-lg p-0 backdrop:bg-black/40"
      >
        <div className="p-5">
          <p className="text-sm text-slate-700">{confirmText}</p>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
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
              className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {pending ? "Suppression…" : "Confirmer la suppression"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
