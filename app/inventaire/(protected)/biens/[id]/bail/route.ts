import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getProperty,
  getPropertyAgencement,
  getPropertyDetails,
  getPropertyOwner,
  getPropertyWaterElec,
} from "@/lib/inventaire/queries";
import { generateLeaseDocx } from "@/lib/inventaire/leaseTemplate";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const property = await getProperty(id);
  if (!property) {
    return NextResponse.json({ error: "Bien introuvable." }, { status: 404 });
  }

  const [owner, details, agencement, waterElec] = await Promise.all([
    getPropertyOwner(id),
    getPropertyDetails(id),
    getPropertyAgencement(id),
    getPropertyWaterElec(id),
  ]);

  const buffer = generateLeaseDocx({ property, owner, details, agencement, waterElec });
  const fileName = `bail-${property.reference}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
