import { NextRequest, NextResponse } from "next/server";
import {
  getLeaseFields,
  getLeaseRow,
  reopenLease,
  updateLeaseClientName,
} from "@/lib/db";
import { serializeField, serializeLease } from "@/lib/serialize";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lease = getLeaseRow(id);
  if (!lease) {
    return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  }
  const fields = getLeaseFields(id).map(serializeField);
  return NextResponse.json({ lease: serializeLease(lease), fields });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lease = getLeaseRow(id);
  if (!lease) {
    return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));

  if (typeof body.clientName === "string" && body.clientName.trim()) {
    updateLeaseClientName(id, body.clientName.trim());
  }
  if (body.reopen === true) {
    reopenLease(id);
  }

  const updated = getLeaseRow(id)!;
  const fields = getLeaseFields(id).map(serializeField);
  return NextResponse.json({ lease: serializeLease(updated), fields });
}
