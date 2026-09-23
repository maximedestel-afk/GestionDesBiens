"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

/** Barre latérale de navigation (esprit apple.com) : colonne fixe sur
 * desktop, tiroir qui glisse depuis la gauche sur mobile (déclenché par le
 * bouton menu de la bande sticky en haut). Remplace l'ancienne rangée de
 * liens horizontale, qui débordait sur petit écran et encombrait le haut
 * de l'écran même sur desktop. */
export function Sidebar({
  navItems,
  profileEmail,
  signOutAction,
}: {
  navItems: NavItem[];
  profileEmail: string | null;
  signOutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-black/[0.06] bg-white/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link
          href="/inventaire"
          className="flex min-w-0 items-center gap-2 truncate text-[20px] font-semibold tracking-tight text-[#1d1d1f]"
        >
          <Image src="/icon.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
          <span className="truncate">M.G.B</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#1d1d1f] transition hover:bg-black/[0.05]"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-black/[0.06] bg-[#f5f5f7] transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 lg:border-r ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Link
            href="/inventaire"
            onClick={() => setOpen(false)}
            className="flex min-w-0 items-center gap-2 truncate text-[20px] font-semibold tracking-tight text-[#1d1d1f]"
          >
            <Image src="/icon.png" alt="" width={30} height={30} className="h-[30px] w-[30px] shrink-0" />
            <span className="truncate">M.G.B</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6e6e73] transition hover:bg-black/[0.05] lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-[10px] px-3 py-2.5 text-[14px] font-medium transition ${
                  active ? "bg-[#0071e3]/10 text-[#0071e3]" : "text-[#1d1d1f] hover:bg-black/[0.05]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-black/[0.06] px-5 py-4">
          {profileEmail && <p className="truncate text-[12px] text-[#6e6e73]">{profileEmail}</p>}
          <form action={signOutAction} className="mt-2">
            <button type="submit" className="text-[13px] font-medium text-[#6e6e73] transition hover:text-[#1d1d1f]">
              Déconnexion
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
