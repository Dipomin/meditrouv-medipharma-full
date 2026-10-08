/**
 * Fabrique générique de contexte d'authentification persistée.
 *
 * `AuthContext` et `PharmacienAuthContext` étaient deux copies quasi
 * identiques (seule la clé AsyncStorage différait) : l'implémentation
 * vit ici une seule fois, chaque contexte ne gardant que son API publique.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { logger } from "../lib/logger";

export type StorageAuth<T extends object> = {
  session: T | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: T) => Promise<void>;
  logout: () => Promise<void>;
  updateSession: (partial: Partial<T>) => Promise<void>;
};

type StorageAuthOptions = {
  storageKey: string;
  /** Clés AsyncStorage annexes à purger à la déconnexion (ex. ancien OTP). */
  extraKeysToClear?: string[];
  /** Nettoyage additionnel à la déconnexion (ex. OTP chiffré). */
  onLogoutExtra?: () => Promise<void>;
  hookName: string;
};

export const createStorageAuth = <T extends object>(
  options: StorageAuthOptions
) => {
  const AuthContext = createContext<StorageAuth<T> | undefined>(undefined);

  const Provider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      let cancelled = false;
      const load = async (): Promise<void> => {
        try {
          const raw = await AsyncStorage.getItem(options.storageKey);
          if (raw && !cancelled) {
            setSession(JSON.parse(raw) as T);
          }
        } catch (error) {
          logger.warn(
            `Session ${options.storageKey} illisible, ignorée.`,
            error
          );
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, []);

    // Actions stabilisées : sans useCallback, chaque rendu du Provider
    // créait de nouvelles identités qui re-déclenchaient les effets
    // consommateurs (rafraîchissement de session, re-fetch écrans).
    // (`options.*` est stable : fabrique appelée au niveau module.)
    const storageKey = options.storageKey;
    const extraKeysToClear = options.extraKeysToClear;
    const onLogoutExtra = options.onLogoutExtra;

    const login = useCallback(
      async (data: T): Promise<void> => {
        try {
          await AsyncStorage.setItem(storageKey, JSON.stringify(data));
          setSession(data);
        } catch (error) {
          logger.error("Échec de la persistance de session.", error);
          throw error;
        }
      },
      [storageKey]
    );

    const logout = useCallback(async (): Promise<void> => {
      try {
        await AsyncStorage.removeItem(storageKey);
        for (const key of extraKeysToClear ?? []) {
          await AsyncStorage.removeItem(key);
        }
        await onLogoutExtra?.();
        setSession(null);
      } catch (error) {
        logger.error("Échec de la déconnexion.", error);
        throw error;
      }
    }, [storageKey, extraKeysToClear, onLogoutExtra]);

    const updateSession = useCallback(
      async (partial: Partial<T>): Promise<void> => {
        if (!session) {
          throw new Error("Aucune session active.");
        }
        try {
          const updated = { ...session, ...partial };
          await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
          setSession(updated);
        } catch (error) {
          logger.error("Échec de la mise à jour de session.", error);
          throw error;
        }
      },
      [session, storageKey]
    );

    const value: StorageAuth<T> = useMemo(
      () => ({
        session,
        isAuthenticated: session !== null,
        isLoading,
        login,
        logout,
        updateSession,
      }),
      [session, isLoading, login, logout, updateSession]
    );

    return (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
  };

  const useStorageAuth = (): StorageAuth<T> => {
    const context = useContext(AuthContext);
    if (context === undefined) {
      throw new Error(`${options.hookName} must be used within its Provider`);
    }
    return context;
  };

  return { Provider, useStorageAuth };
};
