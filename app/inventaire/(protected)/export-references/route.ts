import { NextResponse } from "next/server";
import { getCurrentProfile, getPrestataireAllowedPropertyIds, listProperties } from "@/lib/inventaire/queries";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const isPrestataire = profile.role === "prestataire";
  const allowedPropertyIds = isPrestataire ? await getPrestataireAllowedPropertyIds(profile.id) : null;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const properties = await listProperties(q, allowedPropertyIds);

  const lines = ["Reference", ...properties.map((p) => `"${p.reference.replace(/"/g, '""')}"`)];
  const csv = "﻿" + lines.join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="references-biens.csv"`,
    },
  });
}
