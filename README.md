# Bail Meublé — Dossiers clients

Application permettant de gérer le modèle de contrat de location meublée : pour
chaque nouveau client (locataire), vous choisissez quels champs du bail sont à
remplir par vous-même et lesquels sont à remplir par le client via un lien
personnel, puis vous suivez l'avancement de la saisie.

## Fonctionnement

- **`/admin`** — liste des dossiers, création d'un nouveau dossier par client.
- **`/admin/leases/[id]`** — pour un dossier donné, tous les champs du bail
  (bailleur, locataire, logement, durée, loyer, dépôt de garantie, clauses
  particulières, clés, signature) groupés par section. Pour chaque champ vous
  choisissez : *Je le remplis* / *Le client le remplit* / *Non applicable*,
  vous pouvez le marquer obligatoire, et ajouter des champs personnalisés
  propres à ce dossier. Un lien à usage unique (`/remplir/[token]`) est généré
  pour le client.
- **`/remplir/[token]`** — formulaire public (pas de compte requis) affichant
  uniquement les champs assignés au client, avec sauvegarde de brouillon et
  envoi final. Une fois envoyé, le dossier passe en lecture seule côté client
  (l'admin peut le rouvrir si besoin).

Le catalogue des champs du modèle de bail est défini dans `lib/fields.ts` et
peut être ajusté si le modèle évolue.

⚠️ L'interface `/admin` n'est pas protégée par mot de passe (choix fait pour
cette version). La sécurité du lien client repose sur le caractère
imprévisible du token généré. Ne partagez pas l'URL `/admin` publiquement.

## Démarrage

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) — vous serez redirigé
vers `/admin`.

Les données sont stockées dans une base SQLite locale (`data/app.db`, créée
automatiquement, ignorée par git).

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) pour la
  persistance locale

---

## Registre des biens (`/inventaire`)

Deuxième application du dépôt : gestion de l'inventaire d'un parc de
locations meublées de courte durée (~100 biens). Contrairement à
« Bail Meublé », cette application utilise **Supabase** (Postgres +
Storage + Auth) comme backend partagé entre tous les utilisateurs et
appareils.

### Fonctionnement

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

### Configuration Supabase

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
5. `npm run dev`, puis ouvrez `/inventaire`.

### Notes d'implémentation

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
