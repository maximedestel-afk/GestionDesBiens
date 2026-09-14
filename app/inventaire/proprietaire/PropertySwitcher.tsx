"use client";

import { useRouter } from "next/navigation";
import type { OwnerPropertyOption } from "@/lib/inventaire/ownerActions";

export function PropertySwitcher({
  properties,
  currentPropertyId,
}: {
  properties: OwnerPropertyOption[];
  currentPropertyId: string;
}) {
  const router = useRouter();

  return (
    <div className="mt-4 max-w-sm">
      <label className="field-label" htmlFor="property-switcher">
        Bien
      </label>
      <select
        id="property-switcher"
        defaultValue={currentPropertyId}
        onChange={(e) => router.push(`/inventaire/proprietaire/${e.target.value}`)}
        className="field-input"
      >
        {properties.map((p) => (
          <option key={p.propertyId} value={p.propertyId}>
            {p.reference}
            {p.name ? ` — ${p.name}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
