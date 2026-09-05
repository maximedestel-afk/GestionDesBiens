"use client";

import { useState, useTransition } from "react";
import type { Attachment, PropertyElement, PropertyWaterElec } from "@/lib/inventaire/types";
import { loadStandardWaterElecElements, saveWaterElec } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

function LoadStandardButton({ propertyId }: { propertyId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await loadStandardWaterElecElements(propertyId);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erreur.");
            }
          });
        }}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Chargement…" : "Charger les éléments standards"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}

export function WaterElecTab({
  propertyId,
  waterElec,
  elements,
  attachments,
}: {
  propertyId: string;
  waterElec: PropertyWaterElec | null;
  elements: PropertyElement[];
  attachments: Attachment[];
}) {
  return (
    <div className="space-y-6">
      <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
        <legend className="px-1 text-sm font-semibold text-slate-900">Eau / Électricité / Gaz</legend>
        <ActionForm className="mt-2 space-y-3" autoSave action={(formData) => saveWaterElec(propertyId, formData)}>
          {({ pending, error, success }) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="hotWaterProduction">
                    Production eau chaude
                  </label>
                  <select
                    id="hotWaterProduction"
                    name="hotWaterProduction"
                    defaultValue={waterElec?.hotWaterProduction ?? ""}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  >
                    <option value="">Non renseigné</option>
                    <option value="individuelle">Individuelle</option>
                    <option value="collective">Collective</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700" htmlFor="hasGas">
                    Gaz
                  </label>
                  <select
                    id="hasGas"
                    name="hasGas"
                    defaultValue={waterElec?.hasGas === true ? "true" : waterElec?.hasGas === false ? "false" : ""}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  >
                    <option value="">Non renseigné</option>
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </div>
              </div>
              <SaveStatus pending={pending} error={error} success={success} />
            </>
          )}
        </ActionForm>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">
          Éléments (robinet d&apos;arrêt eau, tableau électrique, ballon d&apos;eau chaude…)
        </h2>
        <LoadStandardButton propertyId={propertyId} />
      </div>

      <div className="space-y-3">
        {elements.map((el) => (
          <ElementCard
            key={el.id}
            propertyId={propertyId}
            element={el}
            attachments={attachments.filter((a) => a.entityId === el.id)}
          />
        ))}
      </div>

      <AddElementForm propertyId={propertyId} section="water_elec" label="+ Ajouter un élément (ex. nourrice eau)" />
    </div>
  );
}
