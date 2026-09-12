"use client";

import { useState, type ReactNode } from "react";

const NOTE_TEXTAREA_CLASS =
  "mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15";

/** Champ note optionnel : tant qu'aucune note n'existe, affiche un simple
 * bouton "+ Ajouter une note" plutôt qu'une case vide qui prend de la place.
 * Cliquer révèle la zone de texte (qui reste alors affichée, même vidée,
 * pour ne pas faire disparaître le champ pendant la saisie). */
export function NoteField({
  name,
  label,
  defaultValue,
  placeholder = "Note",
  rows = 2,
  addLabel = "+ Ajouter une note",
  className,
  labelExtra,
}: {
  name: string;
  label?: string;
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
  addLabel?: string;
  className?: string;
  labelExtra?: ReactNode;
}) {
  const [visible, setVisible] = useState(!!defaultValue);

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="text-[13px] text-sky-600 hover:underline"
      >
        {addLabel}
      </button>
    );
  }

  return (
    <div>
      {label && (
        <label className="field-label flex items-center" htmlFor={name}>
          {label}
          {labelExtra}
        </label>
      )}
      <textarea
        id={label ? name : undefined}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        rows={rows}
        autoFocus
        className={className ?? `${label ? "mt-1 " : ""}${NOTE_TEXTAREA_CLASS}`}
      />
    </div>
  );
}
