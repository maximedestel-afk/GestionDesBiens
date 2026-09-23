import { getAllowedSectionsForRole, getCurrentProfile, getRolePermissionLevel } from "@/lib/inventaire/queries";
import { signOut } from "@/lib/inventaire/actions";
import { canAccessSection } from "@/lib/inventaire/tabs";
import { UserRoleProvider } from "@/components/inventaire/UserRoleContext";
import { HeaderPropertySearch } from "@/components/inventaire/HeaderPropertySearch";
import { Sidebar } from "@/components/inventaire/Sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const [allowedSections, permissionLevel] = await Promise.all([
    getAllowedSectionsForRole(profile?.role),
    getRolePermissionLevel(profile?.role),
  ]);
  const canSee = (key: string) => canAccessSection(profile?.role, allowedSections, key);

  const navItems = [
    canSee("menu_utilisateurs") && { href: "/inventaire/utilisateurs", label: "Utilisateurs" },
    canSee("menu_bail_type") && { href: "/inventaire/bail-type", label: "Bail type" },
    canSee("menu_import") && { href: "/inventaire/import", label: "Importer" },
    canSee("menu_completer") && { href: "/inventaire/completer", label: "Compléter" },
    canSee("menu_journal") && { href: "/inventaire/journal", label: "Journal" },
    canSee("menu_acces") && { href: "/inventaire/acces", label: "Accès" },
    canSee("menu_api") && { href: "/inventaire/api-keys", label: "API" },
  ].filter((item): item is { href: string; label: string } => !!item);

  return (
    <UserRoleProvider role={profile?.role ?? null} permissionLevel={permissionLevel}>
      <div className="lg:flex lg:min-h-screen">
        <Sidebar navItems={navItems} profileEmail={profile?.email ?? null} signOutAction={signOut} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 hidden border-b border-black/[0.06] bg-white/80 backdrop-blur-xl lg:block">
            <div className="mx-auto max-w-6xl px-6 py-3">
              <HeaderPropertySearch />
            </div>
          </header>
          <div className="border-b border-black/[0.06] bg-white px-4 py-3 lg:hidden">
            <HeaderPropertySearch />
          </div>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </UserRoleProvider>
  );
}
