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
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 bg-white p-4">
      <legend className="px-1 text-sm font-semibold text-slate-900">{title}</legend>
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
                <label className="block text-sm font-medium text-slate-700" htmlFor="hasElevator">
                  Ascenseur
                </label>
                <select
                  id="hasElevator"
                  name="hasElevator"
                  defaultValue={
                    details?.hasElevator === true ? "true" : details?.hasElevator === false ? "false" : ""
                  }
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                >
                  <option value="">Non renseigné</option>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                Vidéo d&apos;accès (comment entrer dans l&apos;immeuble/appartement)
              </p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("access_video")} />
                <FileUploadButtons
                  accept="video/*"
                  showCamera={false}
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "access_video" }}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Code & accès — Client" name="accessCodeClient" defaultValue={details?.accessCodeClient} />
              <Field
                label="Code & accès — Ménage/maintenance"
                name="accessCodeCleaning"
                defaultValue={details?.accessCodeCleaning}
              />
              <Field label="Code & accès — Back up" name="accessCodeBackup" defaultValue={details?.accessCodeBackup} />
            </div>
          </Section>

          <Section title="Wifi">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Réseau" name="wifiNetwork" defaultValue={details?.wifiNetwork} />
              <Field label="Code" name="wifiCode" defaultValue={details?.wifiCode} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Contrat internet</p>
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
              <p className="text-sm font-medium text-slate-700">Contrat EDF</p>
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
        </>
      )}
    </ActionForm>
  );
}
