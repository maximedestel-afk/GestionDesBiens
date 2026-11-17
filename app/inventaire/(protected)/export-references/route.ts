import { NextResponse } from "next/server";
import {
  getCurrentProfile,
  getPrestataireAllowedPropertyIds,
  listProperties,
  listPropertiesPlatforms,
} from "@/lib/inventaire/queries";
import type { PlatformType } from "@/lib/inventaire/types";

// Un bien n'a qu'une seule référence Airbnb/Booking.com/Vrbo/Hopper (une
// ligne property_platforms par type) — une colonne par plateforme, dans le
// même ordre que le reste de l'app (ex. platformFields dans bulkFields.ts).
const PLATFORM_COLUMNS: { type: PlatformType; header: string }[] = [
  { type: "airbnb", header: "ID Airbnb" },
  { type: "booking", header: "ID Booking.com" },
  { type: "vrbo", header: "ID Vrbo" },
  { type: "hopper", header: "ID Hopper" },
];

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

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
  const platformsByProperty = await listPropertiesPlatforms(properties.map((p) => p.id));

  const header = ["Reference", ...PLATFORM_COLUMNS.map((c) => c.header)].map(csvCell).join(",");
  const rows = properties.map((p) => {
    const platforms = platformsByProperty[p.id] ?? [];
    const cells = [
      p.reference,
      ...PLATFORM_COLUMNS.map((c) => platforms.find((pf) => pf.platformType === c.type)?.reference ?? ""),
    ];
    return cells.map(csvCell).join(",");
  });
  const csv = "﻿" + [header, ...rows].join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="references-biens.csv"`,
    },
  });
}
