"use client";

import type { Attachment, PropertyOwner } from "@/lib/inventaire/types";
import { savePropertyOwner } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { DocumentField, Field } from "./OwnerTab";

export function BailTab({
  propertyId,
  owner,
  leaseAttachments,
  missingCheckKeys,
}: {
  propertyId: string;
  owner: PropertyOwner | null;
  leaseAttachments: Attachment[];
  missingCheckKeys: string[];
}) {
  return (
    <div className="space-y-4">
      <div className="card space-y-2 p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Générer le bail</h2>
        <p className="text-[13px] text-[#6e6e73]">
          Télécharge le modèle de bail avec les champs déjà connus du système (propriétaire, bien, loyer…)
          préremplis. Les informations manquantes (locataire filiale, durée, désignation…) restent affichées
          entre crochets — à compléter ou retirer dans Word avant signature, puis à reverser ci-dessous dans
          « Bail » comme version finale.
        </p>
        <a href={`/inventaire/biens/${propertyId}/bail`} className="btn-secondary btn-sm inline-flex">
          Télécharger le bail rempli
        </a>
      </div>

      <ActionForm className="space-y-4" autoSave action={(formData) => savePropertyOwner(propertyId, formData)}>
        {({ pending, error, success }) => (
          <>
            <DocumentField
              propertyId={propertyId}
              title="Bail"
              attachments={leaseAttachments}
              emptyLabel="Aucun bail joint"
              kind="lease_contract"
              noteName="leaseNotes"
              noteValue={owner?.leaseNotes}
              noteCsvKey="leaseNotes"
              checkKey="lease_contract"
              missing={missingCheckKeys.includes("lease_contract")}
              extraFields={
                <>
                  <Field
                    label="Date de début du bail"
                    name="leaseStartDate"
                    type="date"
                    defaultValue={owner?.leaseStartDate}
                    csvKey="leaseStartDate"
                  />
                  <Field
                    label="Durée initiale du bail"
                    name="leaseInitialTerm"
                    defaultValue={owner?.leaseInitialTerm}
                    csvKey="leaseInitialTerm"
                    placeholder="ex. 3 ans"
                  />
                  <Field
                    label="Durée tacite reconduction"
                    name="leaseRenewalTerm"
                    defaultValue={owner?.leaseRenewalTerm}
                    csvKey="leaseRenewalTerm"
                    placeholder="ex. 1 an"
                  />
                  <Field
                    label="Franchise de loyer"
                    name="leaseRentFreePeriod"
                    defaultValue={owner?.leaseRentFreePeriod}
                    csvKey="leaseRentFreePeriod"
                    placeholder="ex. 2 000 €"
                  />
                  <Field
                    label="Société locataire"
                    name="leaseTenantCompany"
                    defaultValue={owner?.leaseTenantCompany}
                    csvKey="leaseTenantCompany"
                  />
                  <Field
                    label="Directeur locataire"
                    name="leaseTenantDirector"
                    defaultValue={owner?.leaseTenantDirector}
                    csvKey="leaseTenantDirector"
                  />
                  <Field
                    label="Notes locataire"
                    name="leaseTenantNotes"
                    textarea
                    defaultValue={owner?.leaseTenantNotes}
                    csvKey="leaseTenantNotes"
                  />
                  <Field
                    label="Clause particulière 1"
                    name="leaseSpecialClause1"
                    textarea
                    defaultValue={owner?.leaseSpecialClause1}
                    csvKey="leaseSpecialClause1"
                  />
                  <Field
                    label="Clause particulière 2"
                    name="leaseSpecialClause2"
                    textarea
                    defaultValue={owner?.leaseSpecialClause2}
                    csvKey="leaseSpecialClause2"
                  />
                </>
              }
            />
            <div className="flex justify-end">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>
    </div>
  );
}
