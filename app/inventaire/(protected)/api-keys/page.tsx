import { getAllowedSectionsForRole, getCurrentProfile, listApiKeys } from "@/lib/inventaire/queries";
import { canAccessSection } from "@/lib/inventaire/tabs";
import { ApiKeysManager } from "./ApiKeysManager";
import { ApiDocumentation } from "./ApiDocumentation";
import { GuestyWebhookSetup } from "./GuestyWebhookSetup";
import { GuestySyncNowButton } from "./GuestySyncNowButton";

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
        Permet à un autre programme de se connecter à M.G.B pour lire les données.
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
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Guesty — coût du ménage</h2>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Une vérification automatique a lieu une fois par jour pour tous les biens (limite du plan
          Vercel actuel). Pour forcer une synchronisation immédiate sans attendre le prochain passage,
          utilisez le bouton ci-dessous.
        </p>
        <div className="mt-4">
          <GuestySyncNowButton />
        </div>
      </div>

      <div className="mt-4 card p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Guesty — webhook Coût du ménage</h2>
        <p className="mt-1 text-[13px] text-[#6e6e73]">
          Crée l&apos;abonnement webhook Guesty → MGB pour l&apos;onglet DATA (Coût du ménage), sans
          passer par la console Guesty. Nécessite GUESTY_CLIENT_ID / GUESTY_CLIENT_SECRET /
          GUESTY_WEBHOOK_SECRET déjà configurés, et le scope « endpoint:Create » activé sur le compte
          Guesty — indisponible sur certains comptes (y compris depuis l&apos;interface native de
          Guesty, pas seulement l&apos;API). En attendant, la vérification périodique quotidienne (voir
          vercel.json — plus fréquente si le plan Vercel le permet) prend le relais automatiquement,
          sans configuration supplémentaire.
        </p>
        <div className="mt-4">
          <GuestyWebhookSetup />
        </div>
      </div>

      <div className="mt-4 card p-5">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Documentation</h2>
        <ApiDocumentation />
      </div>
    </div>
  );
}
