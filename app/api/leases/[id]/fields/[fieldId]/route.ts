import { NextRequest, NextResponse } from "next/server";
import { deleteCustomField, getLeaseRow, updateLeaseField } from "@/lib/db";
import { serializeField } from "@/lib/serialize";

const ALLOWED_ASSIGNED = new Set(["admin", "client", "non_applicable"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id, fieldId } = await params;
  const lease = getLeaseRow(id);
  if (!lease) {
    return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const patch: Parameters<typeof updateLeaseField>[2] = {};

  if (typeof body.assignedTo === "string" && ALLOWED_ASSIGNED.has(body.assignedTo)) {
    patch.assignedTo = body.assignedTo;
  }
  if (body.value === null || typeof body.value === "string") {
    patch.value = body.value;
  }
  if (typeof body.required === "boolean") {
    patch.required = body.required;
  }
  if (typeof body.label === "string" && body.label.trim()) {
    patch.label = body.label.trim();
  }

  const field = updateLeaseField(id, fieldId, patch);
  if (!field) {
    return NextResponse.json({ error: "Champ introuvable." }, { status: 404 });
  }
  return NextResponse.json({ field: serializeField(field) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  const { id, fieldId } = await params;
  const lease = getLeaseRow(id);
  if (!lease) {
    return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  }
  const deleted = deleteCustomField(id, fieldId);
  if (!deleted) {
    return NextResponse.json(
      { error: "Champ introuvable ou champ du modèle standard (non supprimable)." },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
