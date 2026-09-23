"use client";

import { useState } from "react";
import type { PropertyTabKey } from "@/lib/inventaire/tabs";

interface TabItem {
  key: PropertyTabKey;
  label: string;
}

/** Menu des onglets d'un bien (DE, CL, AG, EQ…) : colonne verticale fixe à
 * gauche du contenu sur desktop, menu dépliant (bouton avec l'onglet actif
 * + chevron) sur mobile — remplace l'ancienne rangée de pastilles
 * horizontales, qui devenait illisible avec une vingtaine d'onglets. */
export function PropertyTabMenu({
  tabs,
  activeTab,
  onSelect,
  missingCount,
  openTasksCount,
}: {
  tabs: TabItem[];
  activeTab: PropertyTabKey;
  onSelect: (key: PropertyTabKey) => void;
  missingCount: number;
  openTasksCount: number;
}) {
  const [open, setOpen] = useState(false);
  const activeLabel = tabs.find((t) => t.key === activeTab)?.label ?? "";

  function select(key: PropertyTabKey) {
    onSelect(key);
    setOpen(false);
  }

  return (
    <div className="lg:w-56 lg:shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-[10px] border border-black/10 bg-white px-4 py-2.5 text-[14px] font-medium text-[#1d1d1f] shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:hidden"
      >
        <span>{activeLabel}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 5l4 4 4-4" />
        </svg>
      </button>

      <nav
        className={`${open ? "mt-1.5 flex" : "hidden"} max-h-[60vh] flex-col gap-0.5 overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)] lg:mt-0 lg:flex lg:max-h-none lg:shadow-[0_1px_3px_rgba(0,0,0,0.05)]`}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => select(tab.key)}
            className={`flex items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-left text-[14px] font-medium transition ${
              activeTab === tab.key ? "bg-[#1d1d1f] text-white" : "text-[#1d1d1f] hover:bg-black/[0.04]"
            }`}
          >
            <span className="truncate">{tab.label}</span>
            {tab.key === "manquant" && missingCount > 0 && (
              <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                {missingCount}
              </span>
            )}
            {tab.key === "taches" && openTasksCount > 0 && (
              <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-semibold text-white">
                {openTasksCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
