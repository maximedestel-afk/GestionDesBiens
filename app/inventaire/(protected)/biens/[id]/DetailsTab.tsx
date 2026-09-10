"use client";

import type { ReactNode } from "react";
import type { Attachment, PropertyDetails } from "@/lib/inventaire/types";
import { savePropertyDetails } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { MissingFieldFlag } from "@/components/inventaire/MissingFieldFlag";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
  rows = 3,
  labelExtra,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  textarea?: boolean;
  rows?: number;
  labelExtra?: ReactNode;
}) {
  return (
    <div>
      <label className="field-label flex items-center" htmlFor={name}>
        {label}
        {labelExtra}
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

function Section({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <fieldset className="card p-5">
      <legend className="flex items-center px-1 text-sm font-semibold text-[#1d1d1f]">{title}</legend>
      <div className="mt-2 space-y-3">{children}</div>
    </fieldset>
  );
}

export function DetailsTab({
  propertyId,
  address,
  details,
  attachments,
  missingCheckKeys,
}: {
  propertyId: string;
  address: string | null;
  details: PropertyDetails | null;
  attachments: Attachment[];
  missingCheckKeys: string[];
}) {
  const byKind = (kind: Attachment["kind"]) => attachments.filter((a) => a.kind === kind);

  return (
    <div className="space-y-6">
      {address && (
        <div className="overflow-hidden rounded-2xl border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <iframe
            title="Localisation du bien"
            src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
            className="h-48 w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

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
            <Field
              label="Note (étage / ascenseur)"
              name="floorElevatorNotes"
              defaultValue={details?.floorElevatorNotes}
              textarea
            />
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">
                Vidéo / photos d&apos;accès (comment entrer dans l&apos;immeuble/appartement)
              </p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("access_video")} />
                <FileUploadButtons
                  accept="image/*,video/*"
                  showVideoCamera
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "access_video" }}
                />
                <Field
                  label="Ou un lien (URL)"
                  name="accessVideoUrl"
                  type="url"
                  defaultValue={details?.accessVideoUrl}
                />
                {details?.accessVideoUrl && (
                  <a
                    href={details.accessVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[13px] text-sky-600 hover:underline"
                  >
                    Ouvrir le lien
                  </a>
                )}
              </div>
            </div>
            <div>
              <p className="flex items-center text-sm font-medium text-[#1d1d1f]">
                Local Poubelle
                <MissingFieldFlag
                  propertyId={propertyId}
                  checkKey="trash_room_info"
                  missing={missingCheckKeys.includes("trash_room_info")}
                />
              </p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("trash_room")} />
                <FileUploadButtons
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  showVideoCamera
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "trash_room" }}
                />
                <Field label="Ou un lien (URL)" name="trashRoomUrl" type="url" defaultValue={details?.trashRoomUrl} />
                {details?.trashRoomUrl && (
                  <a
                    href={details.trashRoomUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-[13px] text-sky-600 hover:underline"
                  >
                    Ouvrir le lien
                  </a>
                )}
                <Field label="Note" name="trashRoomNotes" defaultValue={details?.trashRoomNotes} textarea />
              </div>
            </div>
            <p className="text-[13px] text-[#6e6e73]">
              Décrivez par écrit comment rejoindre l&apos;appartement (codes, étage, ascenseur…) — le même
              texte que celui du message automatique envoyé au client.
            </p>
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

          <Section
            title={
              <>
                Wifi
                <MissingFieldFlag
                  propertyId={propertyId}
                  checkKey="wifi_info"
                  missing={missingCheckKeys.includes("wifi_info")}
                />
              </>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Réseau" name="wifiNetwork" defaultValue={details?.wifiNetwork} />
              <Field label="Code" name="wifiCode" defaultValue={details?.wifiCode} />
              <Field label="Numéro PTO" name="wifiPtoNumber" defaultValue={details?.wifiPtoNumber} />
            </div>
            <Field label="Notes" name="wifiNotes" defaultValue={details?.wifiNotes} textarea />
            <div>
              <p className="flex items-center text-sm font-medium text-[#1d1d1f]">
                Contrat internet
                <MissingFieldFlag
                  propertyId={propertyId}
                  checkKey="wifi_contract"
                  missing={missingCheckKeys.includes("wifi_contract")}
                />
              </p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("wifi_contract")} />
                <FileUploadButtons
                  accept=".pdf,.doc,.docx,image/*"
                  showCamera={false}
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "wifi_contract" }}
                />
              </div>
            </div>
            <div>
              <p className="flex items-center text-sm font-medium text-[#1d1d1f]">
                Photo Prise Optique et branchements
                <MissingFieldFlag
                  propertyId={propertyId}
                  checkKey="wifi_pto_photo"
                  missing={missingCheckKeys.includes("wifi_pto_photo")}
                />
              </p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("wifi_pto_photo")} />
                <FileUploadButtons
                  accept="image/*"
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "wifi_pto_photo" }}
                />
                <Field
                  label="Notes (ex. emplacement)"
                  name="wifiPtoNotes"
                  defaultValue={details?.wifiPtoNotes}
                  textarea
                />
              </div>
            </div>
          </Section>

          <Section title="Électricité (EDF)">
            <Field
              label="Numéro PRM"
              name="edfPrm"
              defaultValue={details?.edfPrm}
              labelExtra={
                <MissingFieldFlag
                  propertyId={propertyId}
                  checkKey="edf_prm"
                  missing={missingCheckKeys.includes("edf_prm")}
                />
              }
            />
            <Field label="Notes" name="edfNotes" defaultValue={details?.edfNotes} textarea />
            <div>
              <p className="flex items-center text-sm font-medium text-[#1d1d1f]">
                Contrat EDF
                <MissingFieldFlag
                  propertyId={propertyId}
                  checkKey="edf_contract"
                  missing={missingCheckKeys.includes("edf_contract")}
                />
              </p>
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

          <Section
            title={
              <>
                Syndic
                <MissingFieldFlag
                  propertyId={propertyId}
                  checkKey="syndic_info"
                  missing={missingCheckKeys.includes("syndic_info")}
                />
              </>
            }
          >
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
    </div>
  );
}
