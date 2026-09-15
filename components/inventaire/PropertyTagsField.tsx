"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Champ "Tags" sous forme de puces retirables + saisie libre (Entrée ou
 * virgule pour valider). L'input caché qui porte la valeur envoyée au
 * serveur ("tag1,tag2") est piloté par React (`value`, pas `defaultValue`) :
 * le fixer nous-mêmes juste après un `setState` ne suffit pas, un re-render
 * intermédiaire (ex. plusieurs frappes clavier avant l'ajout) peut
 * réinitialiser la valeur posée à la main avant que React n'ait rendu
 * l'état à jour. On déclenche l'événement "input" (pour que l'auto-save de
 * ActionForm le détecte) dans un effect, une fois le DOM effectivement à
 * jour. */
export function PropertyTagsField({
  defaultTags,
  existingTags,
}: {
  defaultTags: string[];
  /** Tags déjà utilisés sur d'autres biens, proposés en suggestion à la saisie. */
  existingTags: string[];
}) {
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const isFirstRender = useRef(true);

  const suggestions = useMemo(() => {
    const draftLower = draft.trim().toLowerCase();
    return existingTags
      .filter((t) => !tags.some((existing) => existing.toLowerCase() === t.toLowerCase()))
      .filter((t) => !draftLower || t.toLowerCase().includes(draftLower))
      .slice(0, 6);
  }, [existingTags, tags, draft]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    hiddenRef.current?.dispatchEvent(new Event("input", { bubbles: true }));
  }, [tags]);

  function addTag(raw: string) {
    const value = raw.trim();
    setDraft("");
    if (!value) return;
    setTags((prev) => (prev.some((t) => t.toLowerCase() === value.toLowerCase()) ? prev : [...prev, value]));
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  return (
    <div className="relative">
      <label className="field-label">Tags</label>
      <input ref={hiddenRef} type="hidden" name="tags" value={tags.join(",")} readOnly />
      <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-[10px] border border-black/10 bg-white px-2.5 py-2 focus-within:border-[#0071e3] focus-within:ring-[3px] focus-within:ring-[#0071e3]/15">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-black/[0.06] px-2.5 py-1 text-[13px] text-[#1d1d1f]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Retirer le tag ${tag}`}
              className="text-black/40 transition hover:text-black/70"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag(draft);
            } else if (e.key === "Backspace" && !draft && tags.length > 0) {
              removeTag(tags[tags.length - 1]);
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            addTag(draft);
            setFocused(false);
          }}
          placeholder={tags.length === 0 ? "Ajouter un tag…" : ""}
          className="min-w-[100px] flex-1 border-none bg-transparent text-[15px] text-[#1d1d1f] outline-none placeholder:text-black/30"
        />
      </div>
      {focused && suggestions.length > 0 && (
        <ul className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-[10px] border border-black/10 bg-white py-1 shadow-lg">
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
  );
}
