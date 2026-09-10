"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { PlatformType, PropertyPlatform } from "@/lib/inventaire/types";
import { createPropertyPlatform, ensureDefaultPlatforms } from "@/lib/inventaire/actions";
import { useOutsideClick } from "@/components/inventaire/useOutsideClick";
import { MissingFieldFlag } from "@/components/inventaire/MissingFieldFlag";
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
    <div ref={containerRef} className="fixed bottom-6 right-6 z-40">
      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-2 w-48 overflow-hidden rounded-[10px] border border-black/10 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
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
            onClick={() => add("hopper")}
            className="block w-full px-3.5 py-2.5 text-left text-sm text-[#1d1d1f] hover:bg-black/[0.04]"
          >
            Hopper
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
      {error && (
        <p className="absolute bottom-full right-0 mb-2 w-48 rounded-[10px] bg-white p-2 text-sm text-red-600 shadow-[0_4px_16px_rgba(0,0,0,0.12)]">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => setOpen((v) => !v)}
        aria-label="Ajouter une plateforme"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0071e3] text-2xl font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:bg-[#0077ed] active:scale-95 disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}

export function PlatformsTab({
  propertyId,
  platforms,
  missingCheckKeys,
}: {
  propertyId: string;
  platforms: PropertyPlatform[];
  missingCheckKeys: string[];
}) {
  useEffect(() => {
    if (platforms.length === 0) {
      ensureDefaultPlatforms(propertyId).catch(() => {});
    }
  }, [propertyId, platforms.length]);

  return (
    <div className="space-y-3 pb-20">
      <h2 className="flex items-center text-sm font-semibold text-[#1d1d1f]">
        Plateformes
        <MissingFieldFlag
          propertyId={propertyId}
          checkKey="platforms_info"
          missing={missingCheckKeys.includes("platforms_info")}
        />
      </h2>
      {platforms.length === 0 ? (
        <p className="text-sm text-black/35">Chargement…</p>
      ) : (
        <div className="space-y-3">
          {platforms.map((platform) => (
            <PlatformCard key={platform.id} propertyId={propertyId} platform={platform} />
          ))}
        </div>
      )}
      <AddPlatformMenu propertyId={propertyId} />
    </div>
  );
}
