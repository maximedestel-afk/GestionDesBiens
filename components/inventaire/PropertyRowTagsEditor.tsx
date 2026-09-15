"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { updatePropertyTags } from "@/lib/inventaire/actions";

/** Tags d'un bien, affichés et modifiables directement sur une ligne de la
 * liste des biens (ajout/suppression sans ouvrir la fiche). Sauvegarde via
 * une action dédiée (updatePropertyTags), indépendante du formulaire
 * "Modifier le bien". */
export function PropertyRowTagsEditor({
  propertyId,
  initialTags,
  existingTags,
  readOnly = false,
}: {
  propertyId: string;
  initialTags: string[];
  /** Tags déjà utilisés sur d'autres biens, proposés en suggestion à la saisie. */
  existingTags: string[];
  /** Rôle "prestataire" (lecture seule) : n'affiche que les tags existants, sans contrôles d'ajout/suppression. */
  readOnly?: boolean;
}) {
  const [tags, setTags] = useState(initialTags);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  const suggestions = useMemo(() => {
    const draftLower = draft.trim().toLowerCase();
    return existingTags
      .filter((t) => !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()))
      .filter((t) => !draftLower || t.toLowerCase().includes(draftLower))
      .slice(0, 6);
  }, [existingTags, tags, draft]);

  function save(previous: string[], next: string[]) {
    setError(false);
    setTags(next);
    const formData = new FormData();
    formData.set("tags", next.join(","));
    startTransition(async () => {
      try {
        await updatePropertyTags(propertyId, formData);
      } catch {
        // En cas d'échec, on revient à l'état d'avant CETTE modification (pas à
        // initialTags, qui écraserait aussi d'autres modifications déjà
        // enregistrées) et on le signale : sans ça, le tag semble juste
        // disparaître sans explication.
        setTags(previous);
        setError(true);
      }
    });
  }

  function addTag(value: string) {
    const trimmed = value.trim();
    setDraft("");
    setAdding(false);
    if (!trimmed) return;
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return;
    save(tags, [...tags, trimmed]);
  }

  function removeTag(tag: string) {
    save(tags, tags.filter((t) => t !== tag));
  }

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="group inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[13px] font-medium text-sky-700"
        >
          {tag}
          {!readOnly && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Retirer le tag ${tag}`}
              className="text-sky-400 transition hover:text-sky-700"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!readOnly && (adding ? (
        <div className="relative">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(draft);
              } else if (e.key === "Escape") {
                setDraft("");
                setAdding(false);
              }
            }}
            onBlur={() => addTag(draft)}
            placeholder="Nouveau tag…"
            className="w-28 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[13px] text-[#1d1d1f] outline-none focus:border-[#0071e3]"
          />
          {suggestions.length > 0 && (
            <ul className="absolute left-0 top-[calc(100%+4px)] z-10 w-40 overflow-hidden rounded-[10px] border border-black/10 bg-white py-1 shadow-lg">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(s);
                    }}
                    className="block w-full truncate px-3 py-1.5 text-left text-[13px] text-[#1d1d1f] hover:bg-black/[0.05]"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          aria-label="Ajouter un tag"
          className="inline-flex items-center rounded-full border border-dashed border-black/15 px-2.5 py-1 text-[13px] text-black/40 transition hover:border-black/30 hover:text-black/60"
        >
          + tag
        </button>
      ))}
      {error && (
        <span className="text-[13px] font-medium text-red-600">
          Échec de l&apos;enregistrement, réessayez.
        </span>
      )}
    </div>
  );
}
