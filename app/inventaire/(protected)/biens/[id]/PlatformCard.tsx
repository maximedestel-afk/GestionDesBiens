"use client";

import { useState } from "react";
import type { PropertyPlatform } from "@/lib/inventaire/types";
import { deletePropertyPlatform, updatePropertyPlatform } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";
import { PLATFORM_LABELS, PlatformLogo } from "@/components/inventaire/PlatformLogo";
import { NoteField } from "@/components/inventaire/NoteField";
import { FieldRef } from "@/components/inventaire/FieldRef";
import type { CsvFieldKey } from "@/lib/inventaire/csvFields";

const inputClass =
  "mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15";

// "autre" n'a pas d'équivalent CSV (plusieurs lignes possibles par bien —
// ne tient pas dans une seule colonne) : pas d'entrée pour ce type.
const PLATFORM_CSV_KEYS: Partial<
  Record<string, { url: CsvFieldKey; reference: CsvFieldKey; listingName: CsvFieldKey; notes: CsvFieldKey }>
> = {
  airbnb: { url: "airbnbUrl", reference: "airbnbReference", listingName: "airbnbListingName", notes: "airbnbNotes" },
  booking: { url: "bookingUrl", reference: "bookingReference", listingName: "bookingListingName", notes: "bookingNotes" },
  vrbo: { url: "vrboUrl", reference: "vrboReference", listingName: "vrboListingName", notes: "vrboNotes" },
  hopper: { url: "hopperUrl", reference: "hopperReference", listingName: "hopperListingName", notes: "hopperNotes" },
};

export function PlatformCard({
  propertyId,
  platform,
}: {
  propertyId: string;
  platform: PropertyPlatform;
}) {
  const [detail, setDetail] = useState(platform.platformTypeDetail ?? "");
  const title =
    platform.platformType === "autre" ? detail.trim() || "Autre" : PLATFORM_LABELS[platform.platformType];
  const isEmpty = !platform.listingName && !platform.reference && !platform.url && !platform.notes;
  const missingReference = !isEmpty && (platform.listingName || platform.url) && !platform.reference;
  const csvKeys = PLATFORM_CSV_KEYS[platform.platformType];

  return (
    <div id={`missing-check-platform-reference-${platform.id}`} className="card p-5">
      <ActionForm autoSave action={(formData) => updatePropertyPlatform(propertyId, platform.id, formData)}>
        {({ pending, error, success }) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                <PlatformLogo platformType={platform.platformType} title={title} />
                {title}
                {isEmpty && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    ⚠️ Données manquantes
                  </span>
                )}
                {missingReference && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    ⚠️ Référence manquante
                  </span>
                )}
              </h3>
              <ConfirmDeleteButton
                confirmText={`Supprimer « ${title} » ?`}
                action={() => deletePropertyPlatform(propertyId, platform.id)}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {platform.platformType === "autre" && (
                <div className="sm:col-span-2">
                  <label className="block text-[12px] font-medium text-[#6e6e73]">Nom de la plateforme</label>
                  <input
                    name="platformTypeDetail"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Ex. Abritel, Leboncoin…"
                    className={inputClass}
                  />
                </div>
              )}
              <div>
                <label className="flex items-center text-[12px] font-medium text-[#6e6e73]">
                  Nom sur la plateforme
                  {csvKeys && <FieldRef csvKey={csvKeys.listingName} />}
                </label>
                <input name="listingName" defaultValue={platform.listingName ?? ""} className={inputClass} />
              </div>
              <div>
                <label className="flex items-center text-[12px] font-medium text-[#6e6e73]">
                  Référence
                  {csvKeys && <FieldRef csvKey={csvKeys.reference} />}
                </label>
                <input name="reference" defaultValue={platform.reference ?? ""} className={inputClass} />
              </div>
              <div>
                <label className="flex items-center text-[12px] font-medium text-[#6e6e73]">
                  Lien de l&apos;annonce
                  {csvKeys && <FieldRef csvKey={csvKeys.url} />}
                </label>
                <input
                  name="url"
                  type="url"
                  defaultValue={platform.url ?? ""}
                  placeholder="https://…"
                  className={inputClass}
                />
                {platform.url && (
                  <a
                    href={platform.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[13px] text-sky-600 hover:underline"
                  >
                    Ouvrir l&apos;annonce
                  </a>
                )}
              </div>
              <div className="sm:col-span-2">
                <NoteField
                  label="Note"
                  name="notes"
                  defaultValue={platform.notes}
                  rows={3}
                  labelExtra={csvKeys && <FieldRef csvKey={csvKeys.notes} />}
                />
              </div>
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-1 flex justify-end">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>
    </div>
  );
}
