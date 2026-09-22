"use client";

import { updateRoleAllowedTabs } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { MultiSelectDropdown } from "@/components/inventaire/MultiSelectDropdown";
import { SELECTABLE_SECTIONS } from "@/lib/inventaire/tabs";
import type { UserRole } from "@/lib/inventaire/types";

/** Onglets de bien et items du menu du haut autorisés pour un rôle —
 * partagés par tous les utilisateurs de ce rôle. Vide = rien de restreint. */
export function RolePermissionsEditor({ role, allowedTabs }: { role: UserRole; allowedTabs: string[] }) {
  return (
    <ActionForm
      className="flex flex-wrap items-center gap-2"
      autoSave
      action={(formData) => updateRoleAllowedTabs(role, formData.getAll("allowedTabs").map(String))}
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
