# Push + son d'alerte Medipharma

Les requêtes broadcast fonctionnent sans push (in-app + WhatsApp +
vibration). Ce guide active le **push avec son**, y compris app fermée.

## 1. Installer les modules natifs

```sh
cd medipharma
npx expo install expo-notifications expo-audio
```

Versions installées avec Expo 57.0.26 : `expo-notifications ~57.0.22`,
`expo-audio ~57.0.5` (`npx expo install` résout seul les bonnes versions ;
l'installateur ajoute aussi le plugin `expo-audio` à `app.json`).

## 2. Configurer `app.json`

Ajouter les plugins et l'identifiant du projet EAS :

```json
{
  "expo": {
    "extra": {
      "router": {},
      "eas": { "projectId": "VOTRE-PROJECT-ID" }
    }
  }
}
```

(Les plugins `expo-notifications` et `expo-audio` sont déjà déclarés.)

Le push distant utilise le son système (`sound: default`) ; le fichier
`assets/sounds/alert.wav` ne sert qu'à l'alerte en avant-plan via
`expo-audio` (aucune configuration native supplémentaire requise).

Le `projectId` vient de https://expo.dev (projet EAS) ; sans lui,
l'enregistrement push est ignoré proprement (repli in-app + WhatsApp).

## 3. Credentials push

- Android : activer l'API FCM v1 et renseigner le service-account dans le
  projet EAS (`eas credentials`, ou dashboard Expo).
- iOS : clé APNs (.p8) + identifiant d'app avec capacité Push.

Sans credentials valides, les builds reçoivent les notifications locales
mais pas les push distants.

## 4. Reconstruire et tester

```sh
eas build --platform android --profile development
```

Le push distant exige un **build de développement** (pas Expo Go sur
Android depuis le SDK 53). Vérifier :

1. Connexion → le jeton est enregistré (`push_devices` en base).
2. Depuis un 2e compte, diffuser une requête → push reçu **avec son**,
   tap → ouverture du détail de la requête.
3. Répondre avec une cotation → le demandeur reçoit push + WhatsApp.
4. Déconnexion → le jeton est désinscrit.

## 5. Serveur (optionnel)

`EXPO_ACCESS_TOKEN` (token Expo, `.env` admin) authentifie les envois
serveur et relève les quotas. Sans lui, l'envoi anonyme reste possible
(quotas réduits). Les échecs n'empêchent jamais la notification in-app.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| Pas de push, in-app OK | Module non installé, pas de rebuild, ou `projectId` absent |
| `DeviceNotRegistered` | Appareil désinstallé : le serveur purge le jeton seul |
| Son absent en avant-plan | `expo-audio` non installé : seule la vibration joue |
| Son absent app fermée | Canal Android sans son : vérifier le profil de build |
