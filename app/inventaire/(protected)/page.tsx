import Link from "next/link";
import {
  getCurrentProfile,
  getPrestataireAllowedPropertyIds,
  listProperties,
  listPropertiesMissingChecks,
  listPropertiesOpenTasksCount,
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
  const profile = await getCurrentProfile();
  const isPrestataire = profile?.role === "prestataire";
  const allowedPropertyIds = isPrestataire ? await getPrestataireAllowedPropertyIds(profile!.id) : null;
  const properties = await listProperties(q, allowedPropertyIds);
  const propertyIds = properties.map((p) => p.id);
  const [missingChecks, stats, platforms, openTasksCounts] = await Promise.all([
    listPropertiesMissingChecks(propertyIds),
    listPropertiesStats(propertyIds),
    listPropertiesPlatforms(propertyIds),
    listPropertiesOpenTasksCount(propertyIds),
  ]);
  const totalOpenTasks = Object.values(openTasksCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-baseline gap-2 text-[28px] font-semibold tracking-tight text-[#1d1d1f]">
          Biens
          <span className="text-[15px] font-normal text-[#6e6e73]">({properties.length})</span>
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/inventaire/taches"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-black/10 px-3.5 py-1.5 text-sm font-semibold text-[#1d1d1f] transition hover:bg-black/[0.03]"
          >
            📋 Tâches
            {totalOpenTasks > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[12px] font-semibold text-white">
                {totalOpenTasks}
              </span>
            )}
          </Link>
          {!isPrestataire && <NewPropertyDialog />}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <form action="/inventaire" method="get" className="flex-1">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher par référence ou nom…"
            className="field-input max-w-md"
          />
        </form>
        <a
          href={`/inventaire/export-references${q ? `?q=${encodeURIComponent(q)}` : ""}`}
          className="link-quiet text-[13px]"
        >
          Exporter les références (CSV)
        </a>
      </div>

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
                  {(missingChecks[property.id] ?? []).some((c) => c.key === "rooms") && (
                    <span className="mt-1.5 inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                      New
                    </span>
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
                      >
                        <PlatformLogo platformType={p.platformType} title={platformTitle(p)} className="h-6 w-6 text-[12px]" />
                      </a>
                    ))}
                  {(openTasksCounts[property.id] ?? 0) > 0 && (
                    <Link
                      href={`/inventaire/biens/${property.id}?tab=taches`}
                      title={`${openTasksCounts[property.id]} tâche${openTasksCounts[property.id] > 1 ? "s" : ""} en cours`}
                      className="flex items-center gap-1 rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700 transition hover:bg-sky-200"
                    >
                      📋 {openTasksCounts[property.id]}
                    </Link>
                  )}
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
