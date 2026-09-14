"use client";

import { useState } from "react";
import type { PropertyAgencement, PropertyDetails, PropertyOwner, PropertyWaterElec } from "@/lib/inventaire/types";
import { saveOwnerSelfService, type OwnerRibFile } from "@/lib/inventaire/ownerActions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { OwnerRibUpload } from "./OwnerRibUpload";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} className="field-input" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-5">
      <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">{title}</legend>
      <div className="mt-3 space-y-3">{children}</div>
    </fieldset>
  );
}

export function OwnerSelfServiceForm({
  propertyId,
  owner,
  details,
  waterElec,
  agencement,
  ribFiles,
}: {
  propertyId: string;
  owner: PropertyOwner | null;
  details: PropertyDetails | null;
  waterElec: PropertyWaterElec | null;
  agencement: PropertyAgencement | null;
  ribFiles: OwnerRibFile[];
}) {
  const [isCompany, setIsCompany] = useState(
    !!owner?.isCompany ||
      !!(
        owner?.companyName ||
        owner?.companyLegalForm ||
        owner?.companyCapital ||
        owner?.companyAddress ||
        owner?.companySiren ||
        owner?.companyRcsCity ||
        owner?.companyRepresentedBy ||
        owner?.companyRole
      )
  );

  return (
    <ActionForm
      className="mt-6 space-y-5"
      action={(formData) => saveOwnerSelfService(propertyId, formData)}
      resetOnSuccess={false}
    >
      {({ pending, error, success }) => (
        <>
          <Section title="Coordonnées du propriétaire">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom" name="lastName" defaultValue={owner?.lastName} />
              <Field label="Prénom" name="firstName" defaultValue={owner?.firstName} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email" name="email" type="email" defaultValue={owner?.email} />
              <Field label="Téléphone" name="phone" type="tel" defaultValue={owner?.phone} />
            </div>
            <Field label="Adresse" name="address" defaultValue={owner?.address} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date de naissance" name="birthDate" defaultValue={owner?.birthDate} />
              <Field label="Lieu de naissance" name="birthPlace" defaultValue={owner?.birthPlace} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nationalité" name="nationality" defaultValue={owner?.nationality} />
              <Field label="Numéro de passeport" name="passportNumber" defaultValue={owner?.passportNumber} />
            </div>
          </Section>

          <Section title="Si vous êtes une société">
            <label className="flex items-center gap-2 text-[15px] text-[#1d1d1f]">
              <input
                type="checkbox"
                checked={isCompany}
                onChange={(e) => setIsCompany(e.target.checked)}
                className="h-4 w-4 accent-[#0071e3]"
              />
              Je suis une société (SCI, SARL…)
            </label>
            <input type="hidden" name="isCompany" value={isCompany ? "true" : "false"} />
            {isCompany && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nom société" name="companyName" defaultValue={owner?.companyName} />
                  <Field label="Forme société" name="companyLegalForm" defaultValue={owner?.companyLegalForm} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Capital société" name="companyCapital" defaultValue={owner?.companyCapital} />
                  <Field label="SIREN société" name="companySiren" defaultValue={owner?.companySiren} />
                </div>
                <Field label="Adresse société" name="companyAddress" defaultValue={owner?.companyAddress} />
                <Field label="Ville RCS" name="companyRcsCity" defaultValue={owner?.companyRcsCity} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field
                    label="Représenté par"
                    name="companyRepresentedBy"
                    defaultValue={owner?.companyRepresentedBy}
                  />
                  <Field label="Qualité (ex. gérant)" name="companyRole" defaultValue={owner?.companyRole} />
                </div>
                <OwnerRibUpload propertyId={propertyId} existingFiles={ribFiles} />
              </div>
            )}
          </Section>

          <Section title="Le bien">
            <Field label="Superficie (m²)" name="surface" type="number" defaultValue={agencement?.surface?.toString()} />
            <Field
              label="Commentaire (nom du voisin, du gardien, etc.)"
              name="comment"
              defaultValue={details?.comment}
            />
          </Section>

          <Section title="Eau chaude et chauffage">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="hotWaterProduction">
                  Production eau chaude
                </label>
                <select
                  id="hotWaterProduction"
                  name="hotWaterProduction"
                  defaultValue={waterElec?.hotWaterProduction ?? ""}
                  className="field-input"
                >
                  <option value="">Je ne sais pas</option>
                  <option value="individuelle">Individuelle</option>
                  <option value="collective">Collective</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="heatingProduction">
                  Production chauffage
                </label>
                <select
                  id="heatingProduction"
                  name="heatingProduction"
                  defaultValue={waterElec?.heatingProduction ?? ""}
                  className="field-input"
                >
                  <option value="">Je ne sais pas</option>
                  <option value="individuelle">Individuelle</option>
                  <option value="collective">Collective</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="hasGas">
                Gaz
              </label>
              <select
                id="hasGas"
                name="hasGas"
                defaultValue={waterElec?.hasGas === true ? "true" : waterElec?.hasGas === false ? "false" : ""}
                className="field-input"
              >
                <option value="">Je ne sais pas</option>
                <option value="true">Oui</option>
                <option value="false">Non</option>
              </select>
            </div>
            <Field
              label="Précisions chauffage (si besoin)"
              name="heatingProductionNotes"
              defaultValue={waterElec?.heatingProductionNotes}
            />
          </Section>

          <Section title="Syndic">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom du syndic" name="syndicName" defaultValue={details?.syndicName} />
              <Field label="Téléphone syndic" name="syndicPhone" defaultValue={details?.syndicPhone} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Email syndic" name="syndicEmail" defaultValue={details?.syndicEmail} />
              <Field label="Numéro de Lot" name="syndicLotNumber" defaultValue={details?.syndicLotNumber} />
            </div>
            <Field label="Notes syndic" name="syndicNotes" defaultValue={details?.syndicNotes} />
          </Section>

          {error && <p className="text-[14px] text-red-600">{error}</p>}
          {success && !pending && (
            <p className="text-[14px] font-medium text-emerald-600">Merci, vos informations ont été enregistrées ✓</p>
          )}

          <button type="submit" disabled={pending} className="w-full btn-primary justify-center">
            {pending ? "Enregistrement…" : "Enregistrer mes informations"}
          </button>
        </>
      )}
    </ActionForm>
  );
}
