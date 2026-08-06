import { NextRequest, NextResponse } from "next/server";
import { createLease, listLeases, getLeaseFields } from "@/lib/db";
import { serializeLease } from "@/lib/serialize";

export async function GET() {
  const leases = listLeases().map((lease) => {
    const fields = getLeaseFields(lease.id);
    const clientFields = fields.filter((f) => f.assigned_to === "client");
    const clientFieldsFilled = clientFields.filter((f) => f.value && f.value.trim() !== "").length;
    return {
      ...serializeLease(lease),
      clientFieldsTotal: clientFields.length,
      clientFieldsFilled,
    };
  });
  return NextResponse.json({ leases });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const clientName = typeof body?.clientName === "string" ? body.clientName.trim() : "";
  if (!clientName) {
    return NextResponse.json({ error: "Le nom du client est requis." }, { status: 400 });
  }
  const lease = createLease(clientName);
  return NextResponse.json({ lease: serializeLease(lease) }, { status: 201 });
}
