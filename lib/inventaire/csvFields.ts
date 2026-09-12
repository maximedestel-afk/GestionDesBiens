import { normalizeHeader } from "./csv";

export interface CsvFieldDef {
  /** Nom de colonne à utiliser dans un fichier Excel/CSV — c'est aussi ce
   * qui est affiché au survol du champ dans l'application. */
  header: string;
  /** Alias supplémentaires reconnus à l'import (en plus du header
   * lui-même), déjà normalisés (minuscules, sans accents). */
  aliases?: string[];
}

// Catalogue des champs "plats" (un bien = une ligne) exposés au survol dans
// les fiches bien et reconnus par l'import CSV (voir importProperties dans
// actions.ts). Les collections (pièces, équipements, inventaire, clés,
// éléments Notes/Photos, documents) ne sont pas incluses : elles ne
// tiennent pas dans une seule ligne par bien.
export const CSV_FIELDS = {
  // Bien
  reference: { header: "Reference", aliases: ["ref"] },
  name: { header: "Nom" },
  address: { header: "Adresse" },

  // Agencement
  capacity: { header: "Capacité" },
  surface: { header: "Superficie" },

  // Détails — Appartement
  floor: { header: "Étage" },
  hasElevator: { header: "Ascenseur" },
  floorElevatorNotes: { header: "Note Étage Ascenseur" },
  accessVideoUrl: { header: "Lien Vidéo Accès" },
  trashRoomUrl: { header: "Local Poubelle Lien" },
  trashRoomNotes: { header: "Local Poubelle Note" },

  // Détails — Codes & accès
  accessCodeClient: { header: "Code Accès Client" },
  accessCodeCleaning: { header: "Code Accès Ménage" },
  accessCodeBackup: { header: "Code Accès Back Up" },
  lockType: { header: "Type Serrure" },
  lockStaticCodesNotes: { header: "Codes Statiques" },
  keyContentType: { header: "Contenu Trousseau" },
  keyContentDetail: { header: "Détail Trousseau" },
  keySetNote: { header: "Note Trousseau" },

  // Détails — Wifi
  wifiNetwork: { header: "Réseau Wifi" },
  wifiCode: { header: "Code Wifi" },
  wifiPtoNumber: { header: "Numéro PTO" },
  wifiPtoNotes: { header: "Note Prise Optique" },
  wifiNotes: { header: "Notes Wifi" },

  // Détails — EDF
  edfPrm: { header: "Numéro PRM" },
  edfNotes: { header: "Notes EDF" },

  // Détails — Syndic
  syndicName: { header: "Nom Syndic" },
  syndicPhone: { header: "Téléphone Syndic" },
  syndicEmail: { header: "Email Syndic" },
  syndicNotes: { header: "Notes Syndic" },

  // Détails — Divers
  comment: { header: "Commentaire" },

  // Eau / Électricité / Gaz
  hotWaterProduction: { header: "Eau Chaude" },
  hasGas: { header: "Gaz" },
  heatingProduction: { header: "Chauffage" },
  heatingProductionNotes: { header: "Note Chauffage" },

  // Propriétaire
  ownerLastName: { header: "Nom Owner" },
  ownerFirstName: { header: "Prénom Owner" },
  ownerEmail: { header: "Email Owner" },
  ownerPhone: { header: "Tel Owner", aliases: ["telephone owner"] },
  ownerAddress: { header: "Adresse Owner" },
  ownerNotes: { header: "Notes Owner" },
  leaseNotes: { header: "Note Bail" },
  ribNotes: { header: "Note RIB" },
  rcpNotes: { header: "Note RCP" },
  rentType: { header: "Modèle Loyer" },
  rentNotes: { header: "Note Loyer" },
  rentAmount: { header: "Loyer" },
  chargesAmount: { header: "Charges" },
  otherAmountLabel: { header: "Autre Label" },
  otherAmount: { header: "Autre Montant" },

  // Plateformes — Airbnb
  airbnbUrl: { header: "URL Airbnb", aliases: ["airbnb"] },
  airbnbReference: { header: "Référence Airbnb" },
  airbnbListingName: { header: "Nom Annonce Airbnb" },
  airbnbNotes: { header: "Note Airbnb" },
  // Plateformes — Booking.com
  bookingUrl: { header: "URL Booking", aliases: ["booking"] },
  bookingReference: { header: "Référence Booking" },
  bookingListingName: { header: "Nom Annonce Booking" },
  bookingNotes: { header: "Note Booking" },
  // Plateformes — Vrbo
  vrboUrl: { header: "URL Vrbo", aliases: ["vrbo"] },
  vrboReference: { header: "Référence Vrbo" },
  vrboListingName: { header: "Nom Annonce Vrbo" },
  vrboNotes: { header: "Note Vrbo" },
  // Plateformes — Hopper
  hopperUrl: { header: "URL Hopper", aliases: ["hopper"] },
  hopperReference: { header: "Référence Hopper" },
  hopperListingName: { header: "Nom Annonce Hopper" },
  hopperNotes: { header: "Note Hopper" },
} as const satisfies Record<string, CsvFieldDef>;

export type CsvFieldKey = keyof typeof CSV_FIELDS;

/** Tous les alias reconnus pour un champ (le header normalisé + ses alias),
 * utilisé par l'import CSV pour retrouver la colonne quel que soit son nom
 * exact dans le fichier. */
export function csvFieldAliases(key: CsvFieldKey): string[] {
  const def: CsvFieldDef = CSV_FIELDS[key];
  return [normalizeHeader(def.header), ...(def.aliases ?? [])];
}
