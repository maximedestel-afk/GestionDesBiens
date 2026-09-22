"use client";

import { updatePrestataireAccess } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { MultiSelectDropdown } from "@/components/inventaire/MultiSelectDropdown";

/** Biens accessibles à un prestataire — propre à chaque utilisateur
 * (contrairement aux onglets/menu autorisés, configurés par rôle). */
export function PrestataireAccessEditor({
  userId,
  properties,
  propertyIds,
}: {
  userId: string;
  properties: { id: string; reference: string; name: string | null }[];
  propertyIds: string[];
}) {
  return (
    <ActionForm
      className="flex flex-wrap items-center gap-2"
      autoSave
      action={(formData) => updatePrestataireAccess(userId, formData.getAll("propertyIds").map(String))}
    >
      {({ pending, error, success }) => (
        <>
          <MultiSelectDropdown
            name="propertyIds"
            placeholder="Choisir les biens…"
            defaultValues={propertyIds}
            options={properties.map((p) => ({
              value: p.id,
              label: p.reference,
            }))}
          />
          <SaveStatus pending={pending} error={error} success={success} />
        </>
      )}
    </ActionForm>
  );
}
