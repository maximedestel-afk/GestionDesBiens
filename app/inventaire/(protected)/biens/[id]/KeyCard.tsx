"use client";

import { useState } from "react";
import type { PropertyKey } from "@/lib/inventaire/types";
import { deletePropertyKey, updatePropertyKey } from "@/lib/inventaire/actions";
import { ActionForm } from "@/components/inventaire/ActionForm";
import { SaveStatus } from "@/components/inventaire/SaveStatus";
import { ConfirmDeleteButton } from "@/components/inventaire/ConfirmDeleteButton";

const inputClass =
  "mt-1 w-full rounded-[10px] border border-black/10 bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus:border-[#0071e3] focus:outline-none focus:ring-[3px] focus:ring-[#0071e3]/15";

export function KeyCard({
  propertyId,
  propertyKey,
  label,
}: {
  propertyId: string;
  propertyKey: PropertyKey;
  label: string;
}) {
  const [keyType, setKeyType] = useState(propertyKey.keyType ?? "");
  const [location, setLocation] = useState(propertyKey.location ?? "");

  return (
    <div className="card p-5">
      <ActionForm autoSave action={(formData) => updatePropertyKey(propertyId, propertyKey.id, formData)}>
        {({ pending, error, success }) => (
          <>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-[#1d1d1f]">{label}</h3>
              <ConfirmDeleteButton
                confirmText={`Supprimer « ${label} » ?`}
                action={() => deletePropertyKey(propertyId, propertyKey.id)}
              />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">Type de clé</label>
                <select
                  name="keyType"
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Non renseigné</option>
                  <option value="guest">Guest</option>
                  <option value="menage">Ménage</option>
                  <option value="backup">Back up</option>
                  <option value="autre">Autre (préciser)</option>
                </select>
                {keyType === "autre" && (
                  <input
                    name="keyTypeDetail"
                    defaultValue={propertyKey.keyTypeDetail ?? ""}
                    placeholder="Préciser le type de clé"
                    className={inputClass}
                  />
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#6e6e73]">Emplacement clé</label>
                <select
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Non renseigné</option>
                  <option value="boite_a_cle">Boîte à clé</option>
                  <option value="locker">Locker</option>
                  <option value="autre">Autre (préciser)</option>
                </select>
                {location === "autre" && (
                  <input
                    name="locationDetail"
                    defaultValue={propertyKey.locationDetail ?? ""}
                    placeholder="Préciser l'emplacement"
                    className={inputClass}
                  />
                )}
              </div>

              {location === "boite_a_cle" && (
                <div>
                  <label className="block text-[12px] font-medium text-[#6e6e73]">Code boîte à clé</label>
                  <input name="boxCode" defaultValue={propertyKey.boxCode ?? ""} className={inputClass} />
                </div>
              )}

              {location === "locker" && (
                <>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6e6e73]">Adresse Locker</label>
                    <input
                      name="lockerAddress"
                      defaultValue={propertyKey.lockerAddress ?? ""}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-[#6e6e73]">Code Locker</label>
                    <input
                      name="lockerCode"
                      defaultValue={propertyKey.lockerCode ?? ""}
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-1 flex justify-end">
              <SaveStatus pending={pending} error={error} success={success} />
            </div>
          </>
        )}
      </ActionForm>
    </div>
  );
}
