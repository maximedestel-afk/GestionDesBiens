import Link from "next/link";
import { listProperties } from "@/lib/inventaire/queries";
import { NewPropertyDialog } from "@/components/inventaire/NewPropertyDialog";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const properties = await listProperties(q);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Biens</h1>
        <NewPropertyDialog />
      </div>

      <form action="/inventaire" method="get" className="mt-4">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Rechercher par référence ou nom…"
          className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </form>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {properties.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Aucun bien trouvé.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {properties.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/inventaire/biens/${property.id}`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {property.reference}
                      {property.name && <span className="ml-2 font-normal text-slate-500">{property.name}</span>}
                    </p>
                    {property.address && <p className="text-sm text-slate-500">{property.address}</p>}
                  </div>
                  <span className="text-slate-400">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
