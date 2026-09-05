import type { InventoryCategory } from "./types";

// Bouton "Charger les équipements standards" (onglet Équipements techniques) :
// ajoute ces équipements d'un coup dans la pièce choisie.
export const STANDARD_EQUIPMENT_NAMES = [
  "Radiateurs",
  "Téléviseur",
  "Box internet/Wifi",
  "Lave-vaisselle",
  "Lave-linge",
  "Plaques de cuisson",
  "Hotte aspirante",
  "Réfrigérateur",
  "Four",
  "Micro-ondes",
] as const;

export interface StandardInventoryItem {
  category: InventoryCategory;
  name: string;
  target: number | null;
  isTableware: boolean;
}

// Bouton "Charger la liste standard" (onglet Inventaire du foyer) : ~70
// articles standards. Le linge de maison loué à chaque ménage (draps, housses
// de couette, serviettes de bain/toilette...) n'est volontairement pas
// inclus, il est fourni par un prestataire externe à chaque rotation.
export const STANDARD_INVENTORY_ITEMS: StandardInventoryItem[] = [
  // Cuisine — vaisselle (cible auto = capacité + 2)
  { category: "Cuisine", name: "Assiettes plates", target: null, isTableware: true },
  { category: "Cuisine", name: "Assiettes creuses", target: null, isTableware: true },
  { category: "Cuisine", name: "Assiettes à dessert", target: null, isTableware: true },
  { category: "Cuisine", name: "Bols", target: null, isTableware: true },
  { category: "Cuisine", name: "Mugs", target: null, isTableware: true },
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
  { category: "Cuisine", name: "Ustensiles de cuisine (set)", target: 1, isTableware: false },
  { category: "Cuisine", name: "Fouet", target: 1, isTableware: false },
  { category: "Cuisine", name: "Râpe", target: 1, isTableware: false },
  { category: "Cuisine", name: "Carafe / pichet", target: 1, isTableware: false },
  { category: "Cuisine", name: "Poubelle de cuisine", target: 1, isTableware: false },
  { category: "Cuisine", name: "Maniques / gants de cuisine", target: 2, isTableware: false },
  { category: "Cuisine", name: "Boîtes de conservation (set)", target: 4, isTableware: false },
  { category: "Cuisine", name: "Salière et poivrière", target: 1, isTableware: false },
  { category: "Cuisine", name: "Bac à glaçons", target: 1, isTableware: false },

  // Chambre
  { category: "Chambre", name: "Cintres", target: 10, isTableware: false },
  { category: "Chambre", name: "Protège-oreillers", target: 4, isTableware: false },
  { category: "Chambre", name: "Valet de nuit / porte-bagages", target: 1, isTableware: false },
  { category: "Chambre", name: "Panière à linge sale", target: 1, isTableware: false },
  { category: "Chambre", name: "Lampes de chevet", target: 2, isTableware: false },
  { category: "Chambre", name: "Réveil", target: 1, isTableware: false },
  { category: "Chambre", name: "Miroir", target: 1, isTableware: false },
  { category: "Chambre", name: "Corbeille à papier", target: 1, isTableware: false },
  { category: "Chambre", name: "Rideaux / voilages", target: 1, isTableware: false },

  // Salle de bain
  { category: "Salle de bain", name: "Distributeur de savon", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Poubelle de salle de bain", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Tapis de bain", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Rideau de douche + anneaux", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Porte-serviettes", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Gobelet à brosse à dents", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Miroir grossissant", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Panière à linge sale", target: 1, isTableware: false },
  { category: "Salle de bain", name: "Support papier toilette", target: 1, isTableware: false },

  // Salon
  { category: "Salon", name: "Télécommandes (TV, box)", target: 2, isTableware: false },
  { category: "Salon", name: "Coussins décoratifs", target: 4, isTableware: false },
  { category: "Salon", name: "Vide-poche", target: 1, isTableware: false },
  { category: "Salon", name: "Corbeille à papier", target: 1, isTableware: false },
  { category: "Salon", name: "Bougeoir / bougies décoratives", target: 2, isTableware: false },
  { category: "Salon", name: "Jeux de société", target: 1, isTableware: false },
  { category: "Salon", name: "Livres / magazines de décoration", target: 3, isTableware: false },
  { category: "Salon", name: "Vase", target: 1, isTableware: false },
  { category: "Salon", name: "Porte-revues", target: 1, isTableware: false },
  { category: "Salon", name: "Horloge murale", target: 1, isTableware: false },

  // Produits d'entretien
  { category: "Produits d'entretien", name: "Balai", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Serpillère / balai à franges", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Seau", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Éponges (lot)", target: 4, isTableware: false },
  { category: "Produits d'entretien", name: "Gants de ménage", target: 2, isTableware: false },
  { category: "Produits d'entretien", name: "Produit vaisselle", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Produit multi-surfaces", target: 1, isTableware: false },
  { category: "Produits d'entretien", name: "Sacs poubelle (rouleau)", target: 2, isTableware: false },
  { category: "Produits d'entretien", name: "Pastilles lave-vaisselle (boîte)", target: 1, isTableware: false },

  // Sécurité
  { category: "Sécurité", name: "Détecteur de fumée", target: 2, isTableware: false },
  { category: "Sécurité", name: "Extincteur", target: 1, isTableware: false },
  { category: "Sécurité", name: "Trousse de premiers secours", target: 1, isTableware: false },
  { category: "Sécurité", name: "Détecteur de monoxyde de carbone", target: 1, isTableware: false },
  { category: "Sécurité", name: "Verrou de sécurité / chaîne de porte", target: 1, isTableware: false },

  // Divers
  { category: "Divers", name: "Parapluie", target: 1, isTableware: false },
  { category: "Divers", name: "Kit de couture", target: 1, isTableware: false },
  { category: "Divers", name: "Lampe de poche", target: 1, isTableware: false },
  { category: "Divers", name: "Multiprise / rallonge électrique", target: 2, isTableware: false },
  { category: "Divers", name: "Adaptateurs de prise", target: 2, isTableware: false },
  { category: "Divers", name: "Livret d'accueil", target: 1, isTableware: false },
];
