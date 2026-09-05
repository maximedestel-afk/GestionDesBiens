"use client";

import { useRef, useState, useTransition } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "effacer", "0", "⌫"] as const;

export function NumericKeypadButton({
  value,
  label,
  onConfirm,
  displayClassName = "",
  suffix,
}: {
  value: number;
  label: string;
  onConfirm: (value: number) => Promise<void>;
  displayClassName?: string;
  suffix?: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState("0");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setDraft(String(value));
    setError(null);
    dialogRef.current?.showModal();
  }

  function pressKey(key: (typeof KEYS)[number]) {
    if (key === "effacer") {
      setDraft("0");
      return;
    }
    if (key === "⌫") {
      setDraft((d) => (d.length > 1 ? d.slice(0, -1) : "0"));
      return;
    }
    setDraft((d) => {
      const next = d === "0" ? key : d + key;
      return next.replace(/^0+(?=\d)/, "").slice(0, 4);
    });
  }

  function confirm() {
    const parsed = Number.parseInt(draft, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setError("Valeur invalide.");
      return;
    }
    startTransition(async () => {
      try {
        await onConfirm(parsed);
        dialogRef.current?.close();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={`min-w-[2.5rem] rounded border border-slate-300 bg-white px-2 py-1 text-center font-mono text-base tabular-nums hover:bg-slate-50 ${displayClassName}`}
      >
        {value}
        {suffix}
      </button>
      <dialog
        ref={dialogRef}
        className="w-72 max-w-[90vw] rounded-xl p-0 backdrop:bg-black/40"
      >
        <div className="p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
          <div className="mb-3 rounded-lg bg-slate-100 px-4 py-3 text-center font-mono text-3xl tabular-nums">
            {draft}
          </div>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => pressKey(key)}
                className={`rounded-lg py-4 text-lg font-semibold active:bg-slate-200 ${
                  key === "effacer" || key === "⌫"
                    ? "bg-slate-100 text-slate-600"
                    : "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={confirm}
              className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {pending ? "…" : "Valider"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
