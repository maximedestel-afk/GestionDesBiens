import { getAllowedSectionsForRole, getCurrentProfile, listApiKeys } from "@/lib/inventaire/queries";
import { canAccessSection } from "@/lib/inventaire/tabs";
import { ApiKeysManager } from "./ApiKeysManager";
import { ApiDocumentation } from "./ApiDocumentation";

export default async function ApiKeysPage() {
  const profile = await getCurrentProfile();
  const allowedSections = await getAllowedSectionsForRole(profile?.role);

  if (!canAccessSection(profile?.role, allowedSections, "menu_api")) {
    return <p className="text-sm text-[#6e6e73]">Réservé aux administrateurs.</p>;
  }

  const keys = await listApiKeys();

  return (
    <div>
      <h1 className="text-[26px] font-semibold tracking-tight text-[#1d1d1f]">API</h1>
      <p className="mt-1 text-[15px] text-[#6e6e73]">
        Permet à un autre programme de se connecter à M.G.B pour lire et modifier les données.
      </p>

      <div className="mt-6 card p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Clés API</h2>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Créez une clé et donnez-la au programme externe. La clé n&apos;est affichée qu&apos;une seule
          fois, à sa création — notez-la immédiatement. Vous pouvez révoquer une clé à tout moment.
        </p>
        <div className="mt-4">
          <ApiKeysManager keys={keys} />
        </div>
      </div>

      <div className="mt-4 card p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Documentation</h2>
        <ApiDocumentation />
      </div>
    </div>
  );
}
