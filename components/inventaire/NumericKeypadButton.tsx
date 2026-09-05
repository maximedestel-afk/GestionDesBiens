"use client";

import { useRef, useState, useTransition } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "effacer", "0", "⌫"] as const;
const AUTO_SAVE_DEBOUNCE_MS = 500;

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draft, setDraft] = useState("0");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function open() {
    setDraft(String(value));
    setError(null);
    setSaved(false);
    dialogRef.current?.showModal();
  }

  function save(draftValue: string) {
    const parsed = Number.parseInt(draftValue, 10);
    if (!Number.isInteger(parsed) || parsed < 0) {
      setError("Valeur invalide.");
      return;
    }
    startTransition(async () => {
      try {
        await onConfirm(parsed);
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      }
    });
  }

  function scheduleSave(nextDraft: string) {
    setError(null);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(nextDraft), AUTO_SAVE_DEBOUNCE_MS);
  }

  function pressKey(key: (typeof KEYS)[number]) {
    setDraft((d) => {
      let next: string;
      if (key === "effacer") {
        next = "0";
      } else if (key === "⌫") {
        next = d.length > 1 ? d.slice(0, -1) : "0";
      } else {
        next = (d === "0" ? key : d + key).replace(/^0+(?=\d)/, "").slice(0, 4);
      }
      scheduleSave(next);
      return next;
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
        onClose={() => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
        }}
        className="w-72 max-w-[90vw] rounded-xl p-0 backdrop:bg-black/40"
      >
        <div className="p-4">
          <p className="mb-2 text-sm font-medium text-slate-700">{label}</p>
          <div className="mb-1 rounded-lg bg-slate-100 px-4 py-3 text-center font-mono text-3xl tabular-nums">
            {draft}
          </div>
          <div className="mb-2 h-4 text-center text-xs">
            {pending && <span className="text-slate-400">Enregistrement…</span>}
            {!pending && saved && <span className="text-emerald-600">Enregistré ✓</span>}
            {!pending && error && <span className="text-red-600">{error}</span>}
          </div>
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
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Fermer
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
