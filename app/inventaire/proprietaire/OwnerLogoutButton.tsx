"use client";

import { useTransition } from "react";
import { ownerLogout } from "@/lib/inventaire/ownerActions";

export function OwnerLogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => ownerLogout())}
      className="text-[13px] text-[#6e6e73] underline-offset-2 hover:underline disabled:opacity-50"
    >
      Ce n&apos;est pas vous ? Changer d&apos;email
    </button>
  );
}
