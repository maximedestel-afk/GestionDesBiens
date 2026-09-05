"use client";

import type { ReactNode } from "react";
import type { Attachment, PropertyDetails } from "@/lib/inventaire/types";
import { savePropertyDetails } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={rows}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="card p-5">
      <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">{title}</legend>
      <div className="mt-2 space-y-3">{children}</div>
    </fieldset>
  );
}

export function DetailsTab({
  propertyId,
  details,
  attachments,
}: {
  propertyId: string;
  details: PropertyDetails | null;
  attachments: Attachment[];
}) {
  const byKind = (kind: Attachment["kind"]) => attachments.filter((a) => a.kind === kind);

  return (
    <ActionForm
      className="space-y-6"
      autoSave
      action={(formData) => savePropertyDetails(propertyId, formData)}
    >
      {({ pending, error, success }) => (
        <>
          <div className="flex justify-end">
            <SaveStatus pending={pending} error={error} success={success} />
          </div>

          <Section title="Appartement">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Étage" name="floor" defaultValue={details?.floor} />
              <div>
                <label className="field-label" htmlFor="hasElevator">
                  Ascenseur
                </label>
                <select
                  id="hasElevator"
                  name="hasElevator"
                  defaultValue={
                    details?.hasElevator === true ? "true" : details?.hasElevator === false ? "false" : ""
                  }
                  className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                >
                  <option value="">Non renseigné</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">
                Vidéo / photos d&apos;accès (comment entrer dans l&apos;immeuble/appartement)
              </p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("access_video")} />
                <FileUploadButtons
                  accept="image/*,video/*"
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "access_video" }}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field
                label="Code & accès — Client"
                name="accessCodeClient"
                defaultValue={details?.accessCodeClient}
                textarea
                rows={6}
              />
              <Field
                label="Code & accès — Ménage/maintenance"
                name="accessCodeCleaning"
                defaultValue={details?.accessCodeCleaning}
                textarea
                rows={6}
              />
              <Field
                label="Code & accès — Back up"
                name="accessCodeBackup"
                defaultValue={details?.accessCodeBackup}
                textarea
                rows={6}
              />
            </div>
          </Section>

          <Section title="Wifi">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Réseau" name="wifiNetwork" defaultValue={details?.wifiNetwork} />
              <Field label="Code" name="wifiCode" defaultValue={details?.wifiCode} />
            </div>
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">Contrat internet</p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("wifi_contract")} />
                <FileUploadButtons
                  accept=".pdf,.doc,.docx,image/*"
                  showCamera={false}
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "wifi_contract" }}
                />
              </div>
            </div>
          </Section>

          <Section title="Électricité (EDF)">
            <Field label="Numéro PRM" name="edfPrm" defaultValue={details?.edfPrm} />
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">Contrat EDF</p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("edf_contract")} />
                <FileUploadButtons
                  accept=".pdf,.doc,.docx,image/*"
                  showCamera={false}
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "edf_contract" }}
                />
              </div>
            </div>
          </Section>

          <Section title="Syndic">
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Nom" name="syndicName" defaultValue={details?.syndicName} />
              <Field label="Téléphone" name="syndicPhone" defaultValue={details?.syndicPhone} />
              <Field label="Email" name="syndicEmail" defaultValue={details?.syndicEmail} />
            </div>
            <Field label="Notes" name="syndicNotes" defaultValue={details?.syndicNotes} textarea />
          </Section>

          <Section title="Commentaire">
            <Field
              label="Commentaire (nom du voisin, du gardien, etc.)"
              name="comment"
              defaultValue={details?.comment}
              textarea
              rows={4}
            />
          </Section>
        </>
      )}
    </ActionForm>
  );
}
