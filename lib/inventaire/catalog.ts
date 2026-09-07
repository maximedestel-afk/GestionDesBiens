import type { InventoryCategory } from "./types";

// Bouton "Charger les standards" (onglet Équipements techniques) : les
// équipements standards dépendent du type de pièce (déduit du nom de la
// pièce). Permet toujours d'ajouter d'autres équipements manuellement.
const STANDARD_EQUIPMENT_BY_ROOM_TYPE = {
  cuisine: ["Lave-vaisselle", "Plaques de cuisson", "Hotte aspirante", "Réfrigérateur", "Four", "Micro-ondes"],
  salon: ["Box internet/Wifi", "Climatisation", "Téléviseur", "Radiateurs"],
  chambre: ["Téléviseur", "Radiateurs", "Climatisation"],
  "salle de bain": ["Radiateurs"],
} as const;

export type RoomType = keyof typeof STANDARD_EQUIPMENT_BY_ROOM_TYPE;

export function detectRoomType(roomName: string): RoomType | null {
  const n = roomName.toLowerCase();
  if (n.includes("cuisine")) return "cuisine";
  if (n.includes("salon") || n.includes("séjour") || n.includes("sejour")) return "salon";
  if (n.includes("chambre")) return "chambre";
  if (n.includes("salle de bain") || n.includes("salle d'eau") || n.includes("sdb")) return "salle de bain";
  return null;
}

export function standardEquipmentNamesForRoom(roomName: string): readonly string[] {
  const type = detectRoomType(roomName);
  return type ? STANDARD_EQUIPMENT_BY_ROOM_TYPE[type] : [];
}

// Bouton "Charger les éléments standards" (onglet Eau/Élec).
export const STANDARD_WATER_ELEC_ELEMENT_NAMES = [
  "Robinet d'arrêt eau",
  "Tableau électrique",
  "Ballon d'eau chaude",
] as const;

export interface StandardInventoryItem {
  category: InventoryCategory;
  name: string;
  target: number | null;
  isTableware: boolean;
  /** Cible auto = ce multiplicateur × le nombre de lits du bien (hors lit bébé). */
  bedMultiplier?: number;
}

// Bouton "Charger la liste standard" (onglet Inventaire du foyer).
// Le linge de maison loué à chaque ménage (draps, housses de couette,
// serviettes de bain/toilette...) n'est volontairement pas inclus, il est
// fourni par un prestataire externe à chaque rotation.
export const STANDARD_INVENTORY_ITEMS: StandardInventoryItem[] = [
  // Cuisine — vaisselle (cible auto = capacité + 2)
  { category: "Cuisine", name: "Assiettes plates", target: null, isTableware: true },
  { category: "Cuisine", name: "Assiettes à dessert", target: null, isTableware: true },
  { category: "Cuisine", name: "Plat à service", target: 2, isTableware: false },
  { category: "Cuisine", name: "Bols", target: null, isTableware: true },
  { category: "Cuisine", name: "Mugs", target: null, isTableware: true },
  { category: "Cuisine", name: "Tasses café", target: null, isTableware: true },
  { category: "Cuisine", name: "Verres à eau", target: null, isTableware: true },
  { category: "Cuisine", name: "Verres à vin", target: null, isTableware: true },
  { category: "Cuisine", name: "Jeux de couverts complets", target: null, isTableware: true },

  // Cuisine — ustensiles et rangement
  { category: "Cuisine", name: "Casseroles", target: 3, isTableware: false },
  { category: "Cuisine", name: "Poêles", target: 2, isTableware: false },
  { category: "Cuisine", name: "Faitout / marmite", target: 1, isTableware: false },
  { category: "Cuisine", name: "Plats à four", target: 2, isTableware: false },
  { category: "Cuisine", name: "Saladiers", target: 2, isTableware: false },
  { category: "Cuisine", name: "Passoire", target: 1, isTableware: false },
  { category: "Cuisine", name: "Planches à découper", target: 2, isTableware: false },
  { category: "Cuisine", name: "Couteaux de cuisine (set)", target: 1, isTableware: false },
  { category: "Cuisine", name: "Ouvre-boîte", target: 1, isTableware: false },
  { category: "Cuisine", name: "Tire-bouchon", target: 1, isTableware: false },
  { category: "Cuisine", name: "Fouet", target: 1, isTableware: false },
  { category: "Cuisine", name: "Râpe", target: 1, isTableware: false },
  { category: "Cuisine", name: "Poubelle de cuisine", target: 1, isTableware: false },
  { category: "Cuisine", name: "Maniques / gants de cuisine", target: 2, isTableware: false },
  { category: "Cuisine", name: "Bac à glaçons", target: 1, isTableware: false },

  // Petit électroménager
  { category: "Petit EM", name: "Bouilloire", target: 1, isTableware: false },
  { category: "Petit EM", name: "Grille Pain", target: 1, isTableware: false },
  { category: "Petit EM", name: "Machine Nespresso", target: 1, isTableware: false },
  { category: "Petit EM", name: "Blender/Mixeur", target: 1, isTableware: false },
  { category: "Petit EM", name: "Fer à Repasser", target: 1, isTableware: false },

  // Literie (cible auto = multiplicateur × nombre de lits, hors lit bébé)
  { category: "Literie", name: "Protège-oreillers", target: null, isTableware: false, bedMultiplier: 2 },
  { category: "Literie", name: "Protège matelas", target: null, isTableware: false, bedMultiplier: 1 },
  { category: "Literie", name: "Couette", target: null, isTableware: false, bedMultiplier: 1 },
  { category: "Literie", name: "Oreillers 70x70", target: null, isTableware: false, bedMultiplier: 2 },
  { category: "Literie", name: "Oreillers 50x75", target: null, isTableware: false },

  // Salle de bain
  { category: "Salle de bain", name: "Poubelle de salle de bain", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Porte-serviettes", target: 1, isTableware: false },

  // Produits d'entretien
  { category: "Produits d'entretien", name: "Balai", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Serpillère / balai à franges", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Seau", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Table à Repasser", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Étendoir", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Aspirateur", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Pelle", target: 1, isTableware: false },

  // Sécurité
  { category: "Sécurité", name: "Détecteur de fumée", target: 2, isTableware: false },
  { category: "Sécurité", name: "Trousse de premiers secours", target: 1, isTableware: false },
  { category: "Sécurité", name: "Détecteur de monoxyde de carbone", target: 1, isTableware: false },

  // Divers
  { category: "Divers", name: "Multiprise / rallonge électrique", target: 2, isTableware: false },
  { category: "Divers", name: "Adaptateurs de prise", target: 2, isTableware: false },
];
