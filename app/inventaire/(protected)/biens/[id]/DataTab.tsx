"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { CleaningProvider, PropertyData, PropertyFinanceSettings } from "@/lib/inventaire/types";
import {
  addCleaningProvider,
  savePropertyFinanceSettings,
  saveCleaningProvider,
  refreshGuestyCleaningRate,
} from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR");
}

function RefreshGuestyButton({ propertyId }: { propertyId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  return (
    <div className="mt-3">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setResult(null);
          startTransition(async () => {
            try {
              const message = await refreshGuestyCleaningRate(propertyId);
              setIsError(false);
              setResult(message);
            } catch (e) {
              unstable_rethrow(e);
              setIsError(true);
              setResult(e instanceof Error ? e.message : "Une erreur est survenue.");
            }
          });
        }}
        className="btn-secondary btn-sm"
      >
        {pending ? "Actualisation…" : "Actualiser depuis Guesty"}
      </button>
      {result && (
        <p className={`mt-2 text-[13px] ${isError ? "text-red-600" : "text-emerald-600"}`}>{result}</p>
      )}
    </div>
  );
}

export function DataTab({
  propertyId,
  cleaningProviders,
  propertyData,
  financeSettings,
}: {
  propertyId: string;
  cleaningProviders: CleaningProvider[];
  propertyData: PropertyData | null;
  financeSettings: PropertyFinanceSettings | null;
}) {
  const [addingProvider, setAddingProvider] = useState(false);
  const [extraReferences, setExtraReferences] = useState<string[]>(
    financeSettings?.extraVrplatformReferences ?? []
  );

  return (
    <div className="space-y-6">
      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Regroupement</legend>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Certains biens correspondent à plusieurs listings VRPlatform distincts (ex. « 14ECO », « 14ECO 1 »,
          « 14ECO 2 ») — ajoutez ici leurs références pour les additionner dans l&apos;onglet Finances.
        </p>
        <ActionForm className="mt-3 space-y-3" action={(formData) => savePropertyFinanceSettings(propertyId, formData)}>
          {({ pending, error, success }) => (
            <>
              <div className="space-y-2">
                {extraReferences.length === 0 && (
                  <p className="text-[13px] text-[#6e6e73]">Aucune référence supplémentaire.</p>
                )}
                {extraReferences.map((reference, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      name="extraVrplatformReferences"
                      type="text"
                      value={reference}
                      onChange={(e) =>
                        setExtraReferences((refs) => refs.map((r, i) => (i === index ? e.target.value : r)))
                      }
                      placeholder="ex. 14ECO 1"
                      className="w-full min-w-[220px] rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setExtraReferences((refs) => refs.filter((_, i) => i !== index))}
                      aria-label="Supprimer cette référence"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-black/10 text-[#6e6e73] transition hover:bg-black/[0.04]"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setExtraReferences((refs) => [...refs, ""])}
                  className="btn-secondary btn-sm"
                >
                  + Ajouter une référence
                </button>
                <button type="submit" className="btn-secondary btn-sm">
                  Enregistrer
                </button>
                <SaveStatus pending={pending} error={error} success={success} />
              </div>
            </>
          )}
        </ActionForm>
      </fieldset>

      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Prestataire Ménage</legend>
        <ActionForm className="mt-2" autoSave action={(formData) => saveCleaningProvider(propertyId, formData)}>
          {({ pending, error, success }) => (
            <>
              <select
                name="cleaningProviderId"
                defaultValue={propertyData?.cleaningProviderId ?? ""}
                className="w-full max-w-sm rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
              >
                <option value="">Non renseigné</option>
                {cleaningProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <div className="mt-1">
                <SaveStatus pending={pending} error={error} success={success} />
              </div>
            </>
          )}
        </ActionForm>

        {!addingProvider ? (
          <button
            type="button"
            onClick={() => setAddingProvider(true)}
            className="mt-3 inline-flex items-center gap-1 rounded-full border-2 border-[#0071e3] px-3.5 py-1.5 text-sm font-semibold text-[#0071e3] transition hover:bg-[#0071e3]/10"
          >
            + Ajouter un prestataire
          </button>
        ) : (
          <ActionForm
            resetOnSuccess
            className="mt-3 flex flex-wrap items-end gap-2 rounded-2xl border border-dashed border-black/15 p-3.5"
            action={async (formData) => {
              await addCleaningProvider(propertyId, formData);
              setAddingProvider(false);
            }}
          >
            {({ pending, error }) => (
              <>
                <div className="min-w-[10rem] flex-1">
                  <label className="block text-[12px] font-medium text-[#6e6e73]">Nom du prestataire</label>
                  <input
                    name="name"
                    required
                    className="mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                  />
                </div>
                <button type="submit" disabled={pending} className="btn-primary">
                  {pending ? "…" : "Ajouter"}
                </button>
                <button type="button" onClick={() => setAddingProvider(false)} className="btn-secondary btn-sm">
                  Annuler
                </button>
                {error && <span className="text-sm text-red-600">{error}</span>}
              </>
            )}
          </ActionForm>
        )}
      </fieldset>

      <fieldset className="card p-5">
        <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Ménage (Guesty)</legend>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Valeurs lues depuis l&apos;annonce Guesty dont le nom correspond à la référence de ce bien
          (lecture seule — MGB ne modifie rien côté Guesty). Actualisées automatiquement une fois par
          jour, ou manuellement ci-dessous.
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] font-medium text-[#6e6e73]">
              Coût du ménage — prestataire (€)
            </label>
            <p className="mt-1 text-[15px] text-[#1d1d1f]">
              {propertyData?.cleaningRate ?? "Non renseigné"}
            </p>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-[#6e6e73]">
              Prix du ménage facturé au voyageur (€)
            </label>
            <p className="mt-1 text-[15px] text-[#1d1d1f]">
              {propertyData?.guestyCleaningFee ?? "Non renseigné"}
            </p>
          </div>
        </div>

        {propertyData?.guestyLastSyncError && (
          <p className="mt-2 text-[13px] text-red-600">
            Dernière synchronisation Guesty en échec : {propertyData.guestyLastSyncError}
          </p>
        )}
        {propertyData?.guestyLastSyncedAt && !propertyData.guestyLastSyncError && (
          <p className="mt-2 text-[13px] text-[#6e6e73]">
            Dernière synchronisation Guesty réussie : {formatDate(propertyData.guestyLastSyncedAt)}
          </p>
        )}

        <RefreshGuestyButton propertyId={propertyId} />
      </fieldset>
    </div>
  );
}
