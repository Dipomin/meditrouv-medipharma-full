# MEDIPHARMA

Application mobile Expo (React Native) des pharmaciens partenaires du
réseau Meditrouv : alertes de recherche en temps réel (in-app + WhatsApp),
gestion du stock, commandes inter-pharmacies.

Application sœur : **Meditrouv** (patients, `../meditrouv`).
Backend : **meditrouv-admin** (`../meditrouv-admin`).

## Prérequis

- Node 22 (`nvm use`, voir `.nvmrc`)
- `npm`
- L'API `meditrouv-admin` déployée et accessible.

## Démarrage

```bash
npm install
cp .env.example .env   # ajuster si besoin (fichier non versionné)
npx expo start
```

## Scripts

| Script                | Usage                                              |
| --------------------- | -------------------------------------------------- |
| `npm start`           | Démarrer Expo                                      |
| `npm run lint`        | ESLint (config Expo + verrous `no-console`/`no-any`) |
| `npm run typecheck`   | `tsc --noEmit`                                     |
| `npm test`            | Tests unitaires (runner natif Node, `__tests__/`)  |

## Fonctionnalités

- **Authentification** : inscription (n° d'ordre, titulaire, WhatsApp,
  rattachement pharmacie) et connexion (mot de passe ou WhatsApp).
- **Tableau de bord** : alertes non lues, état du stock (ruptures /
  faibles), commandes en attente, dernières alertes.
- **Alertes** : recherches de médicaments des patients ventilées par le
  serveur, avec filtre par statut, marquage lu / traité, accès direct au
  réassort. Chaque alerte est aussi envoyée sur WhatsApp par le serveur.
- **Stock** : liste, recherche, filtres ruptures / faibles, ajout,
  modification (stepper, réassort rapide +10), retrait.
- **Commandes** : reçues / émises, changement de statut, nouvelle commande
  inter-pharmacies depuis la recherche réseau.
- **Requêtes** : diffusion multi-médicaments à toutes les pharmacies,
  alertes push avec son, réponses avec cotation (5 premières transmises),
  mise en relation (appel / WhatsApp).
- **Compte** : profil, rattachement pharmacie, abonnement, déconnexion.

## Architecture

```text
app/
  lib/          services partagés (source unique par domaine)
    apiClient.ts       cœur HTTP : timeout 15 s, erreurs typées ApiError,
                       variantes authentifiées (header x-pharmacien-id)
    api.ts             façade métiers (pharmaciens, notifications, stock,
                       commandes, requêtes, push, annuaire)
    normalize.ts       normalisation API, sans dépendance (testé)
    env.ts / config.ts variables EXPO_PUBLIC_* et URL d'API
    types.ts           types de domaine (Pharmacien, Notification, Commande,
                       Demande, Proposition)
    validation.ts      validation des saisies (testé)
    geo.ts             Haversine (testé)
    logger.ts          journalisation centralisée (seul usage de console)
    secureStorage.ts   SecureStore (+ repli AsyncStorage sur web)
    payment.ts         catalogue d'abonnement (montants de référence)
    usePharmacienSession.ts, useNotifications.ts
  context/      PharmacienAuthContext (fabrique createStorageAuth)
  components/   GlobalMenu (pastille non-lus), cartes métier
  *.tsx         écrans expo-router
__tests__/      tests unitaires node:test
```

Conventions : pas de `console.*` hors `logger`, pas de `any` explicite,
erreurs réseau typées (`ApiError`), paramètres d'URL encodés, pas de
`setState` synchrone dans les effets (continuations de promesse).

## Sécurité

- **Secrets** : aucun secret dans git (`.env` ignoré, voir `.env.example`).
- **Session** : identifiant pharmacien persisté localement, transmis dans
  le header `x-pharmacien-id` ; le serveur vérifie le rattachement à la
  pharmacie sur chaque route protégée.
- **Mots de passe** : hachés côté serveur (scrypt), jamais journalisés.
- **Paiements** : parcours **simulé** (mention « Mode démonstration » dans
  l'UI). Intégrer les SDK marchands avant tout usage réel.

## Backend

Client uniquement : les endpoints vivent dans `meditrouv-admin`
(`POST /api/pharmaciens/*`, `GET/PATCH /api/notifications*`,
`/api/pharmacies/[id]/stocks`, `/api/stocks/*`, `/api/commandes*`).
