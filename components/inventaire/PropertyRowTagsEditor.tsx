"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { updatePropertyTags } from "@/lib/inventaire/actions";

/** Tags d'un bien, affichés et modifiables directement sur une ligne de la
 * liste des biens (ajout/suppression sans ouvrir la fiche). Sauvegarde via
 * une action dédiée (updatePropertyTags), indépendante du formulaire
 * "Modifier le bien". */
export function PropertyRowTagsEditor({
  propertyId,
  initialTags,
  readOnly = false,
}: {
  propertyId: string;
  initialTags: string[];
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

  function commitDraft() {
    const value = draft.trim();
    setDraft("");
    setAdding(false);
    if (!value) return;
    if (tags.some((t) => t.toLowerCase() === value.toLowerCase())) return;
    save(tags, [...tags, value]);
  }

  function removeTag(tag: string) {
    save(tags, tags.filter((t) => t !== tag));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
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
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitDraft();
            } else if (e.key === "Escape") {
              setDraft("");
              setAdding(false);
            }
          }}
          onBlur={commitDraft}
          placeholder="Nouveau tag…"
          className="w-28 rounded-full border border-black/10 bg-white px-2.5 py-1 text-[13px] text-[#1d1d1f] outline-none focus:border-[#0071e3]"
        />
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
