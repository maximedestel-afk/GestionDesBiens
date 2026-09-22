"use client";

import { updateUserAllowedTabs } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { MultiSelectDropdown } from "@/components/inventaire/MultiSelectDropdown";
import { SELECTABLE_SECTIONS } from "@/lib/inventaire/tabs";

/** Éditeur des onglets de bien et items du menu du haut autorisés pour un
 * utilisateur (tout rôle sauf admin, qui voit toujours tout, et prestataire,
 * qui a son propre éditeur avec en plus la liste des biens accessibles).
 * Aucune sélection = comportement inchangé, tout est visible. */
export function TabAccessEditor({ userId, allowedTabs }: { userId: string; allowedTabs: string[] }) {
  return (
    <ActionForm
      className="flex flex-wrap items-center gap-2"
      autoSave
      action={(formData) => updateUserAllowedTabs(userId, formData.getAll("allowedTabs").map(String))}
    >
      {({ pending, error, success }) => (
        <>
          <MultiSelectDropdown
            name="allowedTabs"
            placeholder="Tout autoriser (par défaut)…"
            defaultValues={allowedTabs}
            options={SELECTABLE_SECTIONS.map((t) => ({ value: t.key, label: t.label }))}
          />
          <SaveStatus pending={pending} error={error} success={success} />
        </>
      )}
    </ActionForm>
  );
}
