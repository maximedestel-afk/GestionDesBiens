"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveAgencement, savePropertyDetails, savePropertyOwner } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import type { QuickFillSpec } from "@/lib/inventaire/quickFill";

const ACTIONS = {
  owner: savePropertyOwner,
  agencement: saveAgencement,
  details: savePropertyDetails,
};

export function QuickFillRow({
  propertyId,
  reference,
  name,
  spec,
  values,
}: {
  propertyId: string;
  reference: string;
  name: string | null;
  spec: QuickFillSpec;
  values: Record<string, unknown>;
}) {
  const router = useRouter();
  const action = ACTIONS[spec.action];

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-4 last:border-0">
      <Link
        href={`/inventaire/biens/${propertyId}`}
        className="min-w-[140px] shrink-0 text-[15px] font-medium text-[#1d1d1f] hover:underline"
      >
        {reference}
        {name && <span className="ml-1.5 font-normal text-[#6e6e73]">{name}</span>}
      </Link>
      <ActionForm
        autoSave
        onSuccess={() => router.refresh()}
        action={(formData) => action(propertyId, formData)}
        className="flex flex-1 flex-wrap items-center gap-2"
      >
        {({ pending, error, success }) => (
          <>
            {spec.fields.map((field) =>
              field.type === "select" ? (
                <select
                  key={field.name}
                  name={field.name}
                  defaultValue={(values[field.name] as string | null) ?? ""}
                  className="rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                >
                  <option value="">{field.label}</option>
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  key={field.name}
                  name={field.name}
                  type={field.type}
                  defaultValue={(values[field.name] as string | number | null) ?? ""}
                  placeholder={field.label}
                  className="w-44 rounded-[10px] border border-black/10 bg-white px-3 py-2 text-[14px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15"
                />
              )
            )}
            <SaveStatus pending={pending} error={error} success={success} />
          </>
        )}
      </ActionForm>
    </div>
  );
}
