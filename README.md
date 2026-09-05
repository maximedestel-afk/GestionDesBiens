# Registre des biens

Application de gestion de l'inventaire d'un parc de locations meublées de
courte durée (~100 biens). Elle utilise **Supabase** (Postgres + Storage +
Auth) comme backend partagé entre tous les utilisateurs et appareils de
l'équipe.

## Fonctionnement

- **`/inventaire`** — liste des biens, recherche par référence ou nom,
  création d'un nouveau bien.
- **`/inventaire/biens/[id]`** — fiche d'un bien avec 4 onglets, dans
  l'ordre : Détails appartement, Agencement, Équipements techniques,
  Inventaire du foyer. Export Excel et historique des modifications
  disponibles depuis la fiche.
- **`/inventaire/utilisateurs`** — gestion des rôles (admin / ménage) et
  invitation de nouveaux membres de l'équipe (réservé aux admins).
- **`/inventaire/login`** — authentification email/mot de passe (Supabase
  Auth). Toutes les routes `/inventaire/*` sont protégées.

## Configuration Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Exécutez les migrations SQL du dossier [`supabase/migrations`](./supabase/migrations)
   dans l'éditeur SQL du projet (ou via la CLI Supabase :
   `supabase db push`), dans l'ordre numérique. Elles créent le schéma,
   les policies RLS et le bucket de stockage `property-files`.
3. Copiez `.env.example` vers `.env.local` et renseignez `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` (Project
   Settings > API).
4. Créez le premier compte utilisateur (Authentication > Users > Invite,
   ou `supabase.auth.admin.createUser` côté serveur) : un profil `admin`
   est créé automatiquement par un trigger. Les comptes suivants peuvent
   être invités depuis `/inventaire/utilisateurs`.
5. `npm run dev`, puis ouvrez [http://localhost:3000](http://localhost:3000)
   — vous serez redirigé vers `/inventaire`.

## Notes d'implémentation

- Les photos sont compressées côté client avant envoi
  (`browser-image-compression`) ; les vidéos et documents sont envoyés
  tels quels, directement du navigateur vers Supabase Storage (pas de
  limite artificielle côté serveur).
- Le bucket `property-files` est privé : les fichiers sont servis via des
  URLs signées générées à la demande.
- Chaque mutation (bien, pièce, équipement, article, pièce jointe) est
  journalisée dans `activity_log`, consultable depuis l'onglet
  « Historique » d'une fiche bien.
- Export Excel par bien : `/inventaire/biens/[id]/export`.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [Supabase](https://supabase.com) (Postgres, Storage, Auth)
