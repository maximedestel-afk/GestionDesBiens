import Link from "next/link";
import Image from "next/image";
import { getCurrentProfile } from "@/lib/inventaire/queries";
import { signOut } from "@/lib/inventaire/actions";
import { UserRoleProvider } from "@/components/inventaire/UserRoleContext";
import { HeaderPropertySearch } from "@/components/inventaire/HeaderPropertySearch";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <UserRoleProvider role={profile?.role ?? null}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-10 border-b border-black/[0.06] bg-white/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link
              href="/inventaire"
              className="flex min-w-0 items-center gap-2 truncate text-[22px] font-semibold tracking-tight text-[#1d1d1f]"
            >
              <Image src="/icon.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0" />
              <span className="truncate">M.G.B</span>
            </Link>
            <div className="flex shrink-0 items-center gap-4 text-[13px]">
              {profile?.role === "admin" && (
                <>
                  <Link href="/inventaire/utilisateurs" className="text-[#6e6e73] transition hover:text-[#1d1d1f]">
                    Utilisateurs
                  </Link>
                  <Link href="/inventaire/import" className="text-[#6e6e73] transition hover:text-[#1d1d1f]">
                    Importer
                  </Link>
                  <Link href="/inventaire/acces" className="text-[#6e6e73] transition hover:text-[#1d1d1f]">
                    Accès
                  </Link>
                </>
              )}
              {profile && <span className="hidden text-[#6e6e73] sm:inline">{profile.email}</span>}
              <form action={signOut}>
                <button type="submit" className="text-[#6e6e73] transition hover:text-[#1d1d1f]">
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6">
            <HeaderPropertySearch />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </UserRoleProvider>
  );
}
