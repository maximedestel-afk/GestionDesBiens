"use client";

import { useRouter } from "next/navigation";

export function CheckSelector({
  options,
  value,
}: {
  options: { key: string; label: string }[];
  value: string;
}) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => router.push(`/inventaire/completer?check=${e.target.value}`)}
      className="field-input max-w-md"
    >
      {options.map((o) => (
        <option key={o.key} value={o.key}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
