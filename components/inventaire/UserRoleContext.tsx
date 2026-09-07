"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { UserRole } from "@/lib/inventaire/types";

const UserRoleContext = createContext<UserRole | null>(null);

export function UserRoleProvider({ role, children }: { role: UserRole | null; children: ReactNode }) {
  return <UserRoleContext.Provider value={role}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  return useContext(UserRoleContext);
}
