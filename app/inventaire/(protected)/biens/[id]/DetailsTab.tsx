"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { Attachment, PropertyDetails, PropertyKey } from "@/lib/inventaire/types";
import { createPropertyKey, savePropertyDetails } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { KeyCard } from "./KeyCard";

function KeyContentField({
  defaultType,
  defaultDetail,
}: {
  defaultType: PropertyDetails["keyContentType"] | undefined;
  defaultDetail: string | null | undefined;
}) {
  const [type, setType] = useState<"" | "cle" | "cle_vigik" | "autre">(defaultType ?? "");

  return (
    <div className="mt-3">
      <label className="field-label" htmlFor="keyContentType">
        Contenu du trousseau de clé
      </label>
      <select
        id="keyContentType"
        name="keyContentType"
        value={type}
        onChange={(e) => setType(e.target.value as "" | "cle" | "cle_vigik" | "autre")}
        className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
      >
        <option value="">Non renseigné</option>
        <option value="cle">Clé</option>
        <option value="cle_vigik">Clé + Vigik</option>
        <option value="autre">Renseigner manuellement</option>
      </select>
      {type === "autre" && (
        <input
          name="keyContentDetail"
          defaultValue={defaultDetail ?? ""}
          placeholder="Préciser le contenu du trousseau"
          className="mt-2 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
        />
      )}
    </div>
  );
}

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

function AddKeyMenu({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const add = (keyType?: "autre") => {
    setOpen(false);
    setError(null);
    startTransition(async () => {
      try {
        await createPropertyKey(propertyId, keyType);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur.");
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        aria-label="Ajouter une clé"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0071e3] text-lg font-semibold text-[#0071e3] transition hover:bg-[#0071e3]/10 disabled:opacity-50"
      >
        +
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            onClick={() => add()}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
          >
            Clé
          </button>
          <button
            type="button"
            onClick={() => add("autre")}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
          >
            Autre (renseigner)
          </button>
        </div>
      )}
      {error && <p className="absolute right-0 mt-1 w-48 text-sm text-red-600">{error}</p>}
    </div>
  );
}

function KeysSection({ propertyId, keys }: { propertyId: string; keys: PropertyKey[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Gestion des clés</h2>
        <AddKeyMenu propertyId={propertyId} />
      </div>
      {(() => {
        let keyNumber = 0;
        return keys.map((key) => {
          const label = key.keyType === "autre" ? "Autre" : `Clé ${++keyNumber}`;
          return <KeyCard key={key.id} propertyId={propertyId} propertyKey={key} label={label} />;
        });
      })()}
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
  keys,
}: {
  propertyId: string;
  details: PropertyDetails | null;
  attachments: Attachment[];
  keys: PropertyKey[];
}) {
  const byKind = (kind: Attachment["kind"]) => attachments.filter((a) => a.kind === kind);

  return (
    <div className="space-y-6">
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

          <Section title="Clé / Serrure">
            <div>
              <label className="field-label" htmlFor="lockType">
                Type de serrure
              </label>
              <select
                id="lockType"
                name="lockType"
                defaultValue={details?.lockType ?? ""}
                className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
              >
                <option value="">Non renseigné</option>
                <option value="cle">Clé</option>
                <option value="connectee">Connectée</option>
              </select>
            </div>
            <KeyContentField defaultType={details?.keyContentType} defaultDetail={details?.keyContentDetail} />
            <div>
              <p className="text-sm font-medium text-[#1d1d1f]">Photo du trousseau de clé</p>
              <div className="mt-1 space-y-2">
                <AttachmentGallery propertyId={propertyId} attachments={byKind("key_set_photo")} />
                <FileUploadButtons
                  accept="image/*"
                  target={{ propertyId, entityType: "property", entityId: propertyId, kind: "key_set_photo" }}
                />
              </div>
            </div>
          </Section>
          </>
        )}
      </ActionForm>

      <KeysSection propertyId={propertyId} keys={keys} />

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
    </div>
  );
}
