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

      <div className="mt-6 overflow-hidden card">
        {properties.length === 0 ? (
          <p className="p-8 text-center text-[15px] text-[#6e6e73]">Aucun bien trouvé.</p>
        ) : (
          <ul className="divide-y divide-black/[0.06]">
            {properties.map((property) => (
              <li key={property.id}>
                <Link
                  href={`/inventaire/biens/${property.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-black/[0.02]"
                >
                  <div>
                    <p className="text-[15px] font-medium text-[#1d1d1f]">
                      {property.reference}
                      {property.name && <span className="ml-2 font-normal text-[#6e6e73]">{property.name}</span>}
                    </p>
                    {property.address && <p className="text-[13px] text-[#6e6e73]">{property.address}</p>}
                  </div>
                  <span className="text-black/25">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
