"use client";

import { updatePrestataireAccess } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { MultiSelectDropdown } from "@/components/inventaire/MultiSelectDropdown";
import { PRESTATAIRE_SELECTABLE_TABS } from "@/lib/inventaire/tabs";

export function PrestataireAccessEditor({
  userId,
  properties,
  propertyIds,
  allowedTabs,
}: {
  userId: string;
  properties: { id: string; reference: string; name: string | null }[];
  propertyIds: string[];
  allowedTabs: string[];
}) {
  return (
    <ActionForm
      className="flex flex-wrap items-center gap-2"
      autoSave
      action={(formData) =>
        updatePrestataireAccess(
          userId,
          formData.getAll("propertyIds").map(String),
          formData.getAll("allowedTabs").map(String)
        )
      }
    >
      {({ pending, error, success }) => (
        <>
          <MultiSelectDropdown
            name="propertyIds"
            placeholder="Choisir les biens…"
            defaultValues={propertyIds}
            options={properties.map((p) => ({
              value: p.id,
              label: p.name ? `${p.reference} — ${p.name}` : p.reference,
            }))}
          />
          <MultiSelectDropdown
            name="allowedTabs"
            placeholder="Choisir les onglets…"
            defaultValues={allowedTabs}
            options={PRESTATAIRE_SELECTABLE_TABS.map((t) => ({ value: t.key, label: t.label }))}
          />
          <SaveStatus pending={pending} error={error} success={success} />
        </>
      )}
    </ActionForm>
  );
}
