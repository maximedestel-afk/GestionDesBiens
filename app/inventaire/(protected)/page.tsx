import Link from "next/link";
import {
  listProperties,
  listPropertiesMissingChecks,
  listPropertiesPlatforms,
  listPropertiesStats,
} from "@/lib/inventaire/queries";
import { NewPropertyDialog } from "@/components/inventaire/NewPropertyDialog";
import { PropertyCompletenessBadge } from "@/components/inventaire/PropertyCompletenessBadge";
import { PropertyStatsBar } from "@/components/inventaire/PropertyStatsBar";
import { PlatformLogo, platformTitle } from "@/components/inventaire/PlatformLogo";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const properties = await listProperties(q);
  const propertyIds = properties.map((p) => p.id);
  const [missingChecks, stats, platforms] = await Promise.all([
    listPropertiesMissingChecks(propertyIds),
    listPropertiesStats(propertyIds),
    listPropertiesPlatforms(propertyIds),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-semibold tracking-tight text-[#1d1d1f]">Biens</h1>
        <NewPropertyDialog />
      </div>

      <form action="/inventaire" method="get" className="mt-5">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher par référence ou nom…"
          className="field-input max-w-md"
        />
      </form>

      <div className="mt-6 card overflow-visible">
        {properties.length === 0 ? (
          <p className="p-8 text-center text-[15px] text-[#6e6e73]">Aucun bien trouvé.</p>
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {properties.map((property) => (
              <li key={property.id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-black/[0.02]">
                <Link href={`/inventaire/biens/${property.id}`} className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#1d1d1f]">
                    {property.reference}
                    {property.name && <span className="ml-2 font-normal text-[#6e6e73]">{property.name}</span>}
                  </p>
                  {property.address && <p className="text-[13px] text-[#6e6e73]">{property.address}</p>}
                  {stats[property.id] && (
                    <PropertyStatsBar
                      bedroomCount={stats[property.id].bedroomCount}
                      bathroomCount={stats[property.id].bathroomCount}
                      capacity={stats[property.id].capacity}
                    />
                  )}
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  {(platforms[property.id] ?? [])
                    .filter((p) => p.url)
                    .map((p) => (
                      <a
                        key={p.id}
                        href={p.url ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        title={`Ouvrir l'annonce ${platformTitle(p)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <PlatformLogo platformType={p.platformType} title={platformTitle(p)} className="h-6 w-6 text-[12px]" />
                      </a>
                    ))}
                  <PropertyCompletenessBadge propertyId={property.id} missing={missingChecks[property.id] ?? []} />
                  <Link href={`/inventaire/biens/${property.id}`} className="text-black/25">
                    ›
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
