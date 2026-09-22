"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserRole } from "@/lib/inventaire/types";

const UserRoleContext = createContext<UserRole | null>(null);
const PermissionLevelContext = createContext<"read" | "write" | "delete">("read");

export function UserRoleProvider({
  role,
  permissionLevel = "read",
  children,
}: {
  role: UserRole | null;
  /** Accréditation du rôle courant (page Utilisateurs > Autorisations par
   * rôle) — pour décider côté client si un bouton de suppression s'affiche. */
  permissionLevel?: "read" | "write" | "delete";
  children: ReactNode;
}) {
  return (
    <UserRoleContext.Provider value={role}>
      <PermissionLevelContext.Provider value={permissionLevel}>{children}</PermissionLevelContext.Provider>
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  return useContext(UserRoleContext);
}

export function usePermissionLevel() {
  return useContext(PermissionLevelContext);
}
