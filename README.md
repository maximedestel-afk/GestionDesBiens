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
