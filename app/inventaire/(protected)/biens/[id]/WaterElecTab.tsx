"use client";

import { useEffect, useState } from "react";
import type { Attachment, HeatingProduction, PropertyElement, PropertyWaterElec } from "@/lib/inventaire/types";
import { loadStandardWaterElecElements, saveWaterElec } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FieldRef } from "@/components/inventaire/FieldRef";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

// Charge automatiquement les éléments standards Eau/Élec (idempotent :
// n'ajoute que ceux pas déjà présents) — ainsi tout élément standard jamais
// renseigné apparaît directement dans "Données manquantes" sans action manuelle.
function AutoLoadStandards({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    loadStandardWaterElecElements(propertyId).catch(() => {});
  }, [propertyId]);

  return null;
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
  const [heatingProduction, setHeatingProduction] = useState<HeatingProduction | "">(
    waterElec?.heatingProduction ?? ""
  );

  return (
    <div className="space-y-6">
      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Eau / Électricité / Gaz</legend>
        <ActionForm className="mt-2 space-y-3" autoSave action={(formData) => saveWaterElec(propertyId, formData)}>
          {({ pending, error, success }) => (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label flex items-center" htmlFor="hotWaterProduction">
                    Production eau chaude
                    <FieldRef csvKey="hotWaterProduction" />
                  </label>
                  <select
                    id="hotWaterProduction"
                    name="hotWaterProduction"
                    defaultValue={waterElec?.hotWaterProduction ?? ""}
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  >
                    <option value="">Non renseigné</option>
                    <option value="individuelle">Individuelle</option>
                    <option value="collective">Collective</option>
                  </select>
                </div>
                <div>
                  <label className="field-label flex items-center" htmlFor="hasGas">
                    Gaz
                    <FieldRef csvKey="hasGas" />
                  </label>
                  <select
                    id="hasGas"
                    name="hasGas"
                    defaultValue={waterElec?.hasGas === true ? "true" : waterElec?.hasGas === false ? "false" : ""}
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  >
                    <option value="">Non renseigné</option>
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </div>
                <div>
                  <label className="field-label flex items-center" htmlFor="heatingProduction">
                    Production Chauffage
                    <FieldRef csvKey="heatingProduction" />
                  </label>
                  <select
                    id="heatingProduction"
                    name="heatingProduction"
                    value={heatingProduction}
                    onChange={(e) => setHeatingProduction(e.target.value as HeatingProduction | "")}
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  >
                    <option value="">Non renseigné</option>
                    <option value="individuelle">Individuelle</option>
                    <option value="collective">Collective</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                {heatingProduction === "autre" && (
                  <div className="sm:col-span-2">
                    <label className="field-label flex items-center" htmlFor="heatingProductionNotes">
                      Production Chauffage — précisez
                      <FieldRef csvKey="heatingProductionNotes" />
                    </label>
                    <textarea
                      id="heatingProductionNotes"
                      name="heatingProductionNotes"
                      defaultValue={waterElec?.heatingProductionNotes ?? ""}
                      rows={2}
                      className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                    />
                  </div>
                )}
              </div>
              <SaveStatus pending={pending} error={error} success={success} />
            </>
          )}
        </ActionForm>
      </fieldset>

      <AutoLoadStandards propertyId={propertyId} />

      <h2 className="text-sm font-semibold text-[#1d1d1f]">
        Éléments (robinet d&apos;arrêt eau, tableau électrique, ballon d&apos;eau chaude…)
      </h2>

      <AddElementForm propertyId={propertyId} section="water_elec" label="+ Ajouter un élément (ex. nourrice eau)" />

      <div className="space-y-3">
        {elements.map((el) => (
          <ElementCard
            key={el.id}
            propertyId={propertyId}
            element={el}
            attachments={attachments.filter((a) => a.entityId === el.id)}
            showMissingBadge
          />
        ))}
      </div>
    </div>
  );
}
