import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Melvane Gestion des Biens",
  description: "Gestion de l'inventaire du parc de locations meublées.",
};

export default function InventaireLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full bg-slate-50">{children}</div>;
}
