import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Le registre des biens est la seule section qui dépend de Supabase : on
// limite le proxy à /inventaire pour ne pas coupler le reste de
// l'application (Bail Meublé) à cette configuration.
export const config = {
  matcher: ["/inventaire/:path*"],
};
