import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getProperty,
  getPropertyAgencement,
  getPropertyDetails,
  getPropertyOwner,
  getPropertyWaterElec,
  listEquipment,
  listInventoryItems,
  listRooms,
} from "@/lib/inventaire/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const [owner, details, waterElec, agencement, rooms, equipment, inventoryItems] = await Promise.all([
    getPropertyOwner(id),
    getPropertyDetails(id),
    getPropertyWaterElec(id),
    getPropertyAgencement(id),
    listRooms(id),
    listEquipment(id),
    listInventoryItems(id),
  ]);

  const roomNameById = new Map(rooms.map((r) => [r.id, r.name]));

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Melvane Gestion des Biens";
  workbook.created = new Date();

  const infoSheet = workbook.addWorksheet("Détails");
  infoSheet.columns = [
    { header: "Champ", key: "field", width: 30 },
    { header: "Valeur", key: "value", width: 50 },
  ];
  infoSheet.addRows([
    { field: "Référence", value: property.reference },
    { field: "Nom", value: property.name ?? "" },
    { field: "Adresse", value: property.address ?? "" },
    {
      field: "Propriétaire",
      value: [owner?.firstName, owner?.lastName].filter(Boolean).join(" ") || "",
    },
    { field: "Email propriétaire", value: owner?.email ?? "" },
    { field: "Téléphone propriétaire", value: owner?.phone ?? "" },
    { field: "Étage", value: details?.floor ?? "" },
    {
      field: "Ascenseur",
      value: details?.hasElevator === true ? "Oui" : details?.hasElevator === false ? "Non" : "",
    },
    {
      field: "Type de serrure",
      value: details?.lockType === "cle" ? "Clé" : details?.lockType === "connectee" ? "Connectée" : "",
    },
    { field: "Réseau Wifi", value: details?.wifiNetwork ?? "" },
    { field: "Code Wifi", value: details?.wifiCode ?? "" },
    { field: "Référence client", value: details?.clientReference ?? "" },
    { field: "N° PRM (EDF)", value: details?.edfPrm ?? "" },
    { field: "Syndic", value: details?.syndicName ?? "" },
    { field: "Téléphone syndic", value: details?.syndicPhone ?? "" },
    { field: "Email syndic", value: details?.syndicEmail ?? "" },
    { field: "Capacité d'accueil", value: agencement?.capacity ?? "" },
    { field: "Superficie (m²)", value: agencement?.surface ?? "" },
    { field: "Lit bébé disponible", value: agencement?.babyBed ? "Oui" : "Non" },
    {
      field: "Production eau chaude",
      value:
        waterElec?.hotWaterProduction === "individuelle"
          ? "Individuelle"
          : waterElec?.hotWaterProduction === "collective"
            ? "Collective"
            : "",
    },
    { field: "Gaz", value: waterElec?.hasGas === true ? "Oui" : waterElec?.hasGas === false ? "Non" : "" },
    { field: "Commentaire", value: details?.comment ?? "" },
  ]);
  infoSheet.getRow(1).font = { bold: true };

  const roomsSheet = workbook.addWorksheet("Pièces");
  roomsSheet.columns = [
    { header: "Pièce", key: "name", width: 25 },
    { header: "Couchage / équipement", key: "description", width: 50 },
  ];
  roomsSheet.addRows(rooms.map((r) => ({ name: r.name, description: r.description ?? "" })));
  roomsSheet.getRow(1).font = { bold: true };

  const equipmentSheet = workbook.addWorksheet("Équipements techniques");
  equipmentSheet.columns = [
    { header: "Pièce", key: "room", width: 20 },
    { header: "Nom", key: "name", width: 25 },
    { header: "Marque", key: "brand", width: 18 },
    { header: "Modèle", key: "model", width: 18 },
    { header: "N° de série", key: "serialNumber", width: 18 },
    { header: "Garantie", key: "warranty", width: 18 },
    { header: "Fonction séchante", key: "drying", width: 16 },
    { header: "Notes", key: "notes", width: 40 },
  ];
  equipmentSheet.addRows(
    equipment.map((e) => ({
      room: roomNameById.get(e.roomId) ?? "",
      name: e.name,
      brand: e.brand ?? "",
      model: e.model ?? "",
      serialNumber: e.serialNumber ?? "",
      warranty: e.warranty ?? "",
      drying: e.dryingFunction ? "Oui" : "",
      notes: e.notes ?? "",
    }))
  );
  equipmentSheet.getRow(1).font = { bold: true };

  const inventorySheet = workbook.addWorksheet("Inventaire du foyer");
  inventorySheet.columns = [
    { header: "Catégorie", key: "category", width: 20 },
    { header: "Article", key: "name", width: 30 },
    { header: "En stock", key: "inStock", width: 12 },
    { header: "Cible", key: "target", width: 12 },
    { header: "Écart", key: "gap", width: 12 },
    { header: "État", key: "condition", width: 14 },
    { header: "Date de saisie", key: "stockUpdatedAt", width: 16 },
    { header: "Notes", key: "notes", width: 40 },
  ];
  inventorySheet.addRows(
    inventoryItems.map((i) => ({
      category: i.category,
      name: i.name,
      inStock: i.inStock,
      target: i.effectiveTarget,
      gap: i.gap,
      condition: i.condition,
      stockUpdatedAt: new Date(i.stockUpdatedAt).toLocaleDateString("fr-FR"),
      notes: i.notes ?? "",
    }))
  );
  inventorySheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `inventaire-${property.reference}.xlsx`;

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
