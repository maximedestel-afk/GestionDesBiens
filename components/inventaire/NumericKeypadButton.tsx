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
        className={`min-w-[2.5rem] rounded-[10px] border border-black/10 bg-white px-2.5 py-1.5 text-center font-mono text-base tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-black/[0.03] ${displayClassName}`}
      >
        {value}
        {suffix}
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
        }}
        className="card w-72 max-w-[90vw] p-0 backdrop:bg-black/30 backdrop:backdrop-blur-sm"
      >
        <div className="p-4">
          <p className="mb-2 text-[13px] font-medium text-[#6e6e73]">{label}</p>
          <div className="mb-1 rounded-2xl bg-black/[0.04] px-4 py-3 text-center font-mono text-3xl tabular-nums text-[#1d1d1f]">
            {draft}
          </div>
          <div className="mb-2 h-4 text-center text-[13px]">
            {pending && <span className="text-black/40">Enregistrement…</span>}
            {!pending && saved && <span className="text-emerald-600">Enregistré ✓</span>}
            {!pending && error && <span className="text-red-600">{error}</span>}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => pressKey(key)}
                className={`rounded-2xl py-4 text-lg font-semibold transition active:scale-95 ${
                  key === "effacer" || key === "⌫"
                    ? "bg-black/[0.04] text-[#6e6e73]"
                    : "bg-white text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/5"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn-secondary btn-sm">
              Fermer
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
