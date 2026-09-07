"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import type { Attachment, PropertyDetails, PropertyElement, PropertyKey } from "@/lib/inventaire/types";
import { createPropertyKey, ensureDefaultKeyElements, savePropertyDetails } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { FileUploadButtons } from "@/components/inventaire/FileUploadButtons";
import { AttachmentGallery } from "@/components/inventaire/AttachmentGallery";
import { useOutsideClick } from "@/components/inventaire/useOutsideClick";
import { MissingFieldFlag } from "@/components/inventaire/MissingFieldFlag";
import { KeyCard } from "./KeyCard";
import { ElementCard } from "./ElementCard";
import { AddElementForm } from "./AddElementForm";

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="card p-5">
      <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">{title}</legend>
      <div className="mt-2 space-y-3">{children}</div>
    </fieldset>
  );
}

function AddKeyMenu({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

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
    <div ref={containerRef} className="relative">
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

function KeyElementsSection({
  propertyId,
  elements,
  attachments,
}: {
  propertyId: string;
  elements: PropertyElement[];
  attachments: Attachment[];
}) {
  useEffect(() => {
    if (elements.length === 0) {
      ensureDefaultKeyElements(propertyId).catch(() => {});
    }
  }, [propertyId, elements.length]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Autres éléments (carte clé, bridge, interphone…)</h2>
        <AddElementForm propertyId={propertyId} section="cles" label="+ Ajouter un élément" />
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
    </div>
  );
}

export function KeysTab({
  propertyId,
  details,
  attachments,
  keys,
  elements,
  elementAttachments,
  missingCheckKeys,
}: {
  propertyId: string;
  details: PropertyDetails | null;
  attachments: Attachment[];
  keys: PropertyKey[];
  elements: PropertyElement[];
  elementAttachments: Attachment[];
  missingCheckKeys: string[];
}) {
  const byKind = (kind: Attachment["kind"]) => attachments.filter((a) => a.kind === kind);
  const [lockType, setLockType] = useState(details?.lockType ?? "");

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

            <Section title="Clé / Serrure">
              <div>
                <label className="field-label" htmlFor="lockType">
                  Type de serrure
                </label>
                <select
                  id="lockType"
                  name="lockType"
                  value={lockType}
                  onChange={(e) => setLockType(e.target.value)}
                  className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                >
                  <option value="">Non renseigné</option>
                  <option value="cle">Clé</option>
                  <option value="connectee">Connectée</option>
                </select>
              </div>
              {lockType === "connectee" && (
                <div>
                  <label className="field-label" htmlFor="lockStaticCodesNotes">
                    Codes Statiques
                  </label>
                  <textarea
                    id="lockStaticCodesNotes"
                    name="lockStaticCodesNotes"
                    defaultValue={details?.lockStaticCodesNotes ?? ""}
                    rows={3}
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  />
                </div>
              )}
              <KeyContentField defaultType={details?.keyContentType} defaultDetail={details?.keyContentDetail} />
              <div>
                <p className="flex items-center text-sm font-medium text-[#1d1d1f]">
                  Photo du trousseau de clé
                  <MissingFieldFlag
                    propertyId={propertyId}
                    checkKey="key_set_photo"
                    missing={missingCheckKeys.includes("key_set_photo")}
                  />
                </p>
                <div className="mt-1 space-y-2">
                  <AttachmentGallery propertyId={propertyId} attachments={byKind("key_set_photo")} />
                  <FileUploadButtons
                    accept="image/*"
                    target={{ propertyId, entityType: "property", entityId: propertyId, kind: "key_set_photo" }}
                  />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="keySetNote">
                  Note (trousseau de clé)
                </label>
                <textarea
                  id="keySetNote"
                  name="keySetNote"
                  defaultValue={details?.keySetNote ?? ""}
                  rows={2}
                  className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                />
              </div>
            </Section>
          </>
        )}
      </ActionForm>

      <KeysSection propertyId={propertyId} keys={keys} />
      <KeyElementsSection propertyId={propertyId} elements={elements} attachments={elementAttachments} />
    </div>
  );
}
