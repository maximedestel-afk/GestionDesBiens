import {
  getCurrentProfile,
  listProperties,
  listPropertiesAgencementsMap,
  listPropertiesDetailsMap,
  listPropertiesMissingChecks,
  listPropertiesOwnersMap,
} from "@/lib/inventaire/queries";
import { getCompletenessCheck } from "@/lib/inventaire/completeness";
import { tabCode } from "@/lib/inventaire/tabs";
import { QUICK_FILL_SPECS } from "@/lib/inventaire/quickFill";
import { CheckSelector } from "./CheckSelector";
import { QuickFillRow } from "./QuickFillRow";

export default async function CompleterPage({
  searchParams,
}: {
  searchParams: Promise<{ check?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const options = Object.keys(QUICK_FILL_SPECS)
    .map((key) => {
      const check = getCompletenessCheck(key);
      return check ? { key, label: `${tabCode(check.tab)} - ${check.label}` } : null;
    })
    .filter((o): o is { key: string; label: string } => !!o);

  const { check } = await searchParams;
  const selectedKey = check && QUICK_FILL_SPECS[check] ? check : options[0]?.key;
  const spec = selectedKey ? QUICK_FILL_SPECS[selectedKey] : undefined;

  const properties = await listProperties();
  const propertyIds = properties.map((p) => p.id);
  const [missingChecks, owners, agencements, details] = await Promise.all([
    listPropertiesMissingChecks(propertyIds),
    listPropertiesOwnersMap(propertyIds),
    listPropertiesAgencementsMap(propertyIds),
    listPropertiesDetailsMap(propertyIds),
  ]);

  const valuesByAction = {
    owner: owners,
    agencement: agencements,
    details: details,
  } as unknown as Record<string, Record<string, Record<string, unknown>>>;

  const matching = selectedKey
    ? properties.filter((p) => (missingChecks[p.id] ?? []).some((c) => c.key === selectedKey))
    : [];

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">Compléter les données manquantes</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Choisissez un champ : la liste des biens où il n&apos;est pas renseigné s&apos;affiche, avec une case pour le
        remplir directement.
      </p>

      <div className="mt-5">{selectedKey && <CheckSelector options={options} value={selectedKey} />}</div>

      <div className="mt-6 card overflow-visible">
        {!spec ? (
          <p className="p-8 text-center text-[15px] text-[#6e6e73]">Aucun champ disponible.</p>
        ) : matching.length === 0 ? (
          <p className="p-8 text-center text-[15px] text-[#6e6e73]">
            Tous les biens ont cette donnée renseignée. 🎉
          </p>
        ) : (
          matching.map((property) => (
            <QuickFillRow
              key={property.id}
              propertyId={property.id}
              reference={property.reference}
              name={property.name}
              spec={spec}
              values={valuesByAction[spec.action]?.[property.id] ?? {}}
            />
          ))
        )}
      </div>
    </div>
  );
}
