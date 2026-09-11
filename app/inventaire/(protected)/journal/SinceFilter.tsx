"use client";

import { useRouter } from "next/navigation";

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SinceFilter({ defaultSinceIso }: { defaultSinceIso: string }) {
  const router = useRouter();

  return (
    <div>
      <label className="field-label" htmlFor="since">
        Depuis
      </label>
      <input
        id="since"
        type="datetime-local"
        defaultValue={toDatetimeLocalValue(defaultSinceIso)}
        onChange={(e) => {
          if (!e.target.value) return;
          const iso = new Date(e.target.value).toISOString();
          router.push(`/inventaire/journal?since=${encodeURIComponent(iso)}`);
        }}
        className="field-input max-w-xs"
      />
    </div>
  );
}
