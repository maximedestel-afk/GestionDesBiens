import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getLeaseTemplateInfo,
  getProperty,
  getPropertyAgencement,
  getPropertyDetails,
  getPropertyOwner,
  getPropertyWaterElec,
  listRooms,
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

  const [owner, details, agencement, waterElec, rooms, templateInfo] = await Promise.all([
    getPropertyOwner(id),
    getPropertyDetails(id),
    getPropertyAgencement(id),
    getPropertyWaterElec(id),
    listRooms(id),
    getLeaseTemplateInfo(),
  ]);

  let templateBuffer: Buffer | undefined;
  if (templateInfo.filePath) {
    const { data: templateBlob, error: downloadError } = await supabase.storage
      .from("property-files")
      .download(templateInfo.filePath);
    if (downloadError || !templateBlob) {
      return NextResponse.json({ error: "Impossible de récupérer le modèle de bail personnalisé." }, { status: 500 });
    }
    templateBuffer = Buffer.from(await templateBlob.arrayBuffer());
  }

  const buffer = generateLeaseDocx({ property, owner, details, agencement, waterElec, rooms, templateBuffer });
  const fileName = `bail-${property.reference}.docx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
