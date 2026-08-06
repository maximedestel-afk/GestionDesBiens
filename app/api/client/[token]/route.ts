import { NextRequest, NextResponse } from "next/server";
import { getLeaseByToken, getLeaseFields, saveClientValues } from "@/lib/db";
import { serializeField, serializeLease } from "@/lib/serialize";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const lease = getLeaseByToken(token);
  if (!lease) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  }
  const fields = getLeaseFields(lease.id)
    .filter((f) => f.assigned_to === "client")
    .map(serializeField);

  return NextResponse.json({ lease: serializeLease(lease), fields });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const existing = getLeaseByToken(token);
  if (!existing) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  }
  if (existing.submitted_at) {
    return NextResponse.json(
      { error: "Ce dossier a déjà été transmis et ne peut plus être modifié." },
      { status: 409 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const values: Record<string, string> =
    body?.values && typeof body.values === "object" ? body.values : {};
  const submit = body?.submit === true;

  if (submit) {
    const currentFields = getLeaseFields(existing.id).filter((f) => f.assigned_to === "client");
    const missing = currentFields.filter((f) => {
      if (!f.required) return false;
      const incoming = values[f.id];
      const value = incoming !== undefined ? incoming : f.value;
      return !value || value.trim() === "";
    });
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Merci de compléter tous les champs obligatoires avant l'envoi.",
          missingFieldIds: missing.map((f) => f.id),
        },
        { status: 422 }
      );
    }
  }

  const result = saveClientValues(token, values, submit);
  if (!result) {
    return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  }

  const fields = result.fields.filter((f) => f.assigned_to === "client").map(serializeField);
  return NextResponse.json({ lease: serializeLease(result.lease), fields });
}
