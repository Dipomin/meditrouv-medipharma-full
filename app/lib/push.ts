/**
 * Push + son d'alerte Medipharma.
 *
 * `expo-notifications` et `expo-audio` sont des dépendances déclarées
 * (package.json + plugins app.json) : imports STATIQUES obligatoires.
 * L'ancien `require(nom)` dynamique n'était pas résolu par Metro en build
 * release : "Requiring unknown module" était remonté comme erreur FATALE
 * par `guardedLoadModule` (le try/catch ne l'interceptait pas), ce qui
 * faisait planter l'APK dès l'ouverture d'une session (inscription,
 * connexion, relance avec session stockée).
 * Chaque usage reste gardé par une détection de capacités
 * (`typeof ... === "function"`) : ex. web, module natif non lié.
 */

import Constants from "expo-constants";
import * as ExpoAudio from "expo-audio";
import * as Haptics from "expo-haptics";
import * as ExpoNotifications from "expo-notifications";
import { Platform } from "react-native";

import { logger } from "./logger";

// Surface minimale utilisée d'expo-notifications (voir doc SDK : méthodes
// getExpoPushTokenAsync, setNotificationHandler, setNotificationChannelAsync,
// addNotificationReceivedListener, addNotificationResponseReceivedListener,
// getLastNotificationResponseAsync, AndroidImportance).
type NotificationsModule = {
  getPermissionsAsync: () => Promise<{ status?: string; granted?: boolean }>;
  requestPermissionsAsync: () => Promise<{
    status?: string;
    granted?: boolean;
  }>;
  getExpoPushTokenAsync: (options?: {
    projectId?: string;
  }) => Promise<{ data: string }>;
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
  setNotificationChannelAsync: (
    id: string,
    channel: { name: string; importance?: number; sound?: string }
  ) => Promise<unknown>;
  addNotificationReceivedListener: (
    listener: (event: unknown) => void
  ) => { remove: () => void };
  addNotificationResponseReceivedListener: (
    listener: (response: unknown) => void
  ) => { remove: () => void };
  getLastNotificationResponseAsync: () => Promise<unknown>;
  AndroidImportance?: { HIGH?: number; MAX?: number; DEFAULT?: number };
};

// Surface minimale utilisée d'expo-audio (createAudioPlayer impératif).
type AudioModule = {
  createAudioPlayer: (source: unknown) => {
    play: () => void;
    seekTo?: (seconds: number) => void;
  };
};

type UnknownRecord = Record<string, unknown>;

let cachedNotifications: NotificationsModule | null | undefined;
let cachedAudio: AudioModule | null | undefined;

/** Module expo-notifications si installé (sinon null). */
export const loadNotificationsModule = (): NotificationsModule | null => {
  if (cachedNotifications === undefined) {
    const mod = ExpoNotifications as unknown as UnknownRecord | null;
    cachedNotifications =
      mod !== null &&
      typeof mod.getExpoPushTokenAsync === "function" &&
      typeof mod.setNotificationHandler === "function"
        ? (mod as unknown as NotificationsModule)
        : null;
  }
  return cachedNotifications;
};

/** Module expo-audio si installé (sinon null). */
export const loadAudioModule = (): AudioModule | null => {
  if (cachedAudio === undefined) {
    const mod = ExpoAudio as unknown as UnknownRecord | null;
    cachedAudio =
      mod !== null && typeof mod.createAudioPlayer === "function"
        ? (mod as unknown as AudioModule)
        : null;
  }
  return cachedAudio;
};

/** Push envisageable sur cette plateforme (Android/iOS, module présent). */
export const isPushAvailable = (): boolean =>
  (Platform.OS === "android" || Platform.OS === "ios") &&
  loadNotificationsModule() !== null;

const readProjectId = (): string | undefined => {
  const config = Constants.expoConfig as UnknownRecord | null;
  const extra = config?.extra as UnknownRecord | undefined;
  const eas = extra?.eas as UnknownRecord | undefined;
  return typeof eas?.projectId === "string" ? eas.projectId : undefined;
};

/**
 * Demande la permission, crée le canal Android et retourne le jeton push
 * Expo (null si indisponible : module absent, web, refus, sans projectId).
 */
export const registerForPushAsync = async (): Promise<string | null> => {
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return null;
  }
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    return null;
  }
  try {
    if (Platform.OS === "android") {
      const importance =
        Notifications.AndroidImportance?.HIGH ??
        Notifications.AndroidImportance?.MAX ??
        Notifications.AndroidImportance?.DEFAULT;
      await Notifications.setNotificationChannelAsync("default", {
        name: "Alertes Medipharma",
        ...(importance !== undefined ? { importance } : {}),
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const granted =
      current.granted ?? current.status === "granted";
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      if (!(requested.granted ?? requested.status === "granted")) {
        logger.info("Permission de notification refusée.");
        return null;
      }
    }
    const projectId = readProjectId();
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return typeof token?.data === "string" ? token.data : null;
  } catch (error) {
    logger.warn("Push indisponible sur cet appareil.", error);
    return null;
  }
};

// Lecteur d'alerte paresseux (conservé pour la durée de l'app).
let alertPlayer: { play: () => void; seekTo?: (s: number) => void } | null =
  null;

/**
 * Joue le son d'alerte embarqué (expo-audio si présent), sinon vibration.
 * Ne lève jamais.
 */
export const playAlertSound = (): void => {
  try {
    const Audio = loadAudioModule();
    if (!Audio) {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Warning
      ).catch(() => undefined);
      return;
    }
    if (!alertPlayer) {
      alertPlayer = Audio.createAudioPlayer(
        // Asset embarqué (généré, voir assets/sounds/).
        require("../../assets/sounds/alert.wav")
      );
    }
    try {
      alertPlayer.seekTo?.(0);
    } catch {
      // Relecture depuis le début : best effort.
    }
    alertPlayer.play();
    // Retour haptique systématique, avec ou sans son.
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning
    ).catch(() => undefined);
  } catch (error) {
    logger.warn("Son d'alerte illisible.", error);
  }
};

export type PushTapHandler = (data: Record<string, string>) => void;

const readData = (value: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value as UnknownRecord)) {
      if (typeof entry === "string") {
        out[key] = entry;
      }
    }
  }
  return out;
};

const responseData = (response: unknown): Record<string, string> => {
  const row = (response ?? {}) as UnknownRecord;
  const notification = row.notification as UnknownRecord | undefined;
  const request = notification?.request as UnknownRecord | undefined;
  const content = request?.content as UnknownRecord | undefined;
  return readData(content?.data);
};

/**
 * Handler d'avant-plan (bannière + son système) et écouteurs :
 * - réception en avant-plan → son d'alerte local ;
 * - tap → `onTap(data)` (deep-link).
 * Retourne la désinscription. No-op si le module est absent.
 */
export const setupPushListeners = (
  onTap: PushTapHandler
): (() => void) => {
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return () => undefined;
  }
  try {
    Notifications.setNotificationHandler({
      handleNotification: () =>
        Promise.resolve({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
    });
  } catch (error) {
    logger.warn("Handler de notification impossible.", error);
    return () => undefined;
  }
  const received = Notifications.addNotificationReceivedListener(() => {
    playAlertSound();
  });
  const tapped = Notifications.addNotificationResponseReceivedListener(
    (response: unknown) => {
      try {
        onTap(responseData(response));
      } catch (error) {
        logger.warn("Deep-link push impossible.", error);
      }
    }
  );
  return () => {
    try {
      received.remove();
      tapped.remove();
    } catch {
      // Désinscription best effort.
    }
  };
};

/**
 * Réponse ayant ouvert l'app à froid (deep-link au démarrage).
 * null si aucune ou module absent.
 */
export const getInitialPushTap = async (): Promise<Record<
  string,
  string
> | null> => {
  const Notifications = loadNotificationsModule();
  if (!Notifications) {
    return null;
  }
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    if (!response) {
      return null;
    }
    return responseData(response);
  } catch (error) {
    logger.warn("Lecture du tap initial impossible.", error);
    return null;
  }
};
