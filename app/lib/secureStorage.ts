/**
 * Stockage chiffré pour les secrets courts (OTP, futurs tokens).
 *
 * - iOS/Android : `expo-secure-store` (Keychain / Keystore).
 * - Web : SecureStore est indisponible, repli sur AsyncStorage avec un
 *   avertissement en développement (documenté, pas silencieux).
 *
 * Ne pas y stocker de gros objets : SecureStore limite les valeurs à ~2 Ko.
 * Les données de profil non sensibles restent dans AsyncStorage.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { logger } from "./logger";

const useSecureStore = Platform.OS === "ios" || Platform.OS === "android";

let fallbackWarned = false;
const warnFallback = (): void => {
  if (__DEV__ && !fallbackWarned) {
    fallbackWarned = true;
    logger.warn(
      "SecureStore indisponible sur cette plateforme, repli sur AsyncStorage."
    );
  }
};

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!useSecureStore) {
      warnFallback();
      return AsyncStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (!useSecureStore) {
      warnFallback();
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED,
    });
  },

  removeItem: async (key: string): Promise<void> => {
    if (!useSecureStore) {
      warnFallback();
      await AsyncStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export default secureStorage;
