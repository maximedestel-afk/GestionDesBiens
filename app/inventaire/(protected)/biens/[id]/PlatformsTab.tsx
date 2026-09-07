"use client";

import { useRef, useState, useTransition } from "react";
import type { PlatformType, PropertyPlatform } from "@/lib/inventaire/types";
import { createPropertyPlatform } from "@/lib/inventaire/actions";
import { useOutsideClick } from "@/components/inventaire/useOutsideClick";
import { PlatformCard } from "./PlatformCard";

function AddPlatformMenu({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useOutsideClick(containerRef, () => setOpen(false), open);

  const add = (platformType: PlatformType) => {
    setOpen(false);
    setError(null);
    startTransition(async () => {
      try {
        await createPropertyPlatform(propertyId, platformType);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur.");
      }
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        aria-label="Ajouter une plateforme"
        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0071e3] text-lg font-semibold text-[#0071e3] transition hover:bg-[#0071e3]/10 disabled:opacity-50"
      >
        +
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-48 overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          <button
            type="button"
            onClick={() => add("airbnb")}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
          >
            Airbnb
          </button>
          <button
            type="button"
            onClick={() => add("booking")}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
          >
            Booking.com
          </button>
          <button
            type="button"
            onClick={() => add("vrbo")}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
          >
            Vrbo
          </button>
          <button
            type="button"
            onClick={() => add("autre")}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
          >
            Autre (renseigner)
          </button>
        </div>
      )}
      {error && <p className="absolute right-0 mt-1 w-48 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function PlatformsTab({
  propertyId,
  platforms,
}: {
  propertyId: string;
  platforms: PropertyPlatform[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Plateformes</h2>
        <AddPlatformMenu propertyId={propertyId} />
      </div>
      {platforms.length === 0 ? (
        <p className="text-sm text-black/35">Aucune plateforme renseignée.</p>
      ) : (
        <div className="space-y-3">
          {platforms.map((platform) => (
            <PlatformCard key={platform.id} propertyId={propertyId} platform={platform} />
          ))}
        </div>
      )}
    </div>
  );
}
