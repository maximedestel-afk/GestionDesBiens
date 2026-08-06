import { NextRequest, NextResponse } from "next/server";
import { addCustomField, getLeaseRow } from "@/lib/db";
import { SECTIONS } from "@/lib/fields";
import { serializeField } from "@/lib/serialize";

const ALLOWED_TYPES = new Set(["text", "textarea", "date", "number", "select"]);
const ALLOWED_ASSIGNED = new Set(["admin", "client", "non_applicable"]);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lease = getLeaseRow(id);
  if (!lease) {
    return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim() : "";
  const section = typeof body.section === "string" && SECTIONS.includes(body.section) ? body.section : SECTIONS[0];
  const type = ALLOWED_TYPES.has(body.type) ? body.type : "text";
  const assignedTo = ALLOWED_ASSIGNED.has(body.assignedTo) ? body.assignedTo : "client";

  if (!label) {
    return NextResponse.json({ error: "Le libellé du champ est requis." }, { status: 400 });
  }

  const field = addCustomField(id, { label, section, type, assignedTo });
  return NextResponse.json({ field: serializeField(field) }, { status: 201 });
}
