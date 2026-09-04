import Link from "next/link";
import { getCurrentProfile } from "@/lib/inventaire/queries";
import { signOut } from "@/lib/inventaire/actions";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/inventaire" className="text-lg font-semibold text-slate-900">
            Registre des biens
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {profile?.role === "admin" && (
              <Link href="/inventaire/utilisateurs" className="text-slate-600 hover:text-slate-900">
                Utilisateurs
              </Link>
            )}
            <Link href="/" className="text-slate-600 hover:text-slate-900">
              Autres outils
            </Link>
            {profile && <span className="text-slate-500">{profile.email}</span>}
            <form action={signOut}>
              <button type="submit" className="text-slate-600 hover:text-slate-900">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
