"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import type { CleaningProvider, PropertyData } from "@/lib/inventaire/types";
import { addCleaningProvider, saveCleaningProvider, saveGuestyData, testGuestyConnection } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";

const inputClass =
  "mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR");
}

function TestConnectionButton({ propertyId }: { propertyId: string }) {
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
              const message = await testGuestyConnection(propertyId);
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
        {pending ? "Test en cours…" : "Tester la connexion Guesty"}
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
}: {
  propertyId: string;
  cleaningProviders: CleaningProvider[];
  propertyData: PropertyData | null;
}) {
  const [addingProvider, setAddingProvider] = useState(false);

  return (
    <div className="space-y-6">
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
        <legend className="px-1 text-sm font-semibold text-[#1d1d1f]">Coût du ménage (Guesty)</legend>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Synchronisé dans les deux sens avec le champ « cleaning_rate » de l&apos;annonce Guesty
          correspondante (retrouvée automatiquement par référence si l&apos;ID n&apos;est pas renseigné
          ci-dessous).
        </p>
        <ActionForm className="mt-3 grid gap-3 sm:grid-cols-2" autoSave action={(formData) => saveGuestyData(propertyId, formData)}>
          {({ pending, error, success }) => (
            <>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">Coût du ménage (€)</label>
                <input
                  name="cleaningRate"
                  type="number"
                  step="any"
                  min={0}
                  defaultValue={propertyData?.cleaningRate ?? ""}
                  placeholder="Non renseigné"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">ID Listing Guesty (optionnel)</label>
                <input
                  name="guestyListingId"
                  defaultValue={propertyData?.guestyListingId ?? ""}
                  placeholder="Auto (par référence)"
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <SaveStatus pending={pending} error={error} success={success} />
              </div>
            </>
          )}
        </ActionForm>

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

        <TestConnectionButton propertyId={propertyId} />
      </fieldset>
    </div>
  );
}
