import type { ReactNode } from "react";

import type { Pharmacien } from "../lib/types";
import { createStorageAuth } from "./createStorageAuth";

export type { Pharmacien };

// Type pour le contexte d'authentification pharmacien (API publique).
export type PharmacienAuthContextType = {
  pharmacien: Pharmacien | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (pharmacienData: Pharmacien) => Promise<void>;
  logout: () => Promise<void>;
  updatePharmacien: (pharmacienData: Partial<Pharmacien>) => Promise<void>;
};

const { Provider, useStorageAuth } = createStorageAuth<Pharmacien>({
  storageKey: "medipharma.pharmacien.v1",
  extraKeysToClear: ["pharmacien", "pharmacien_otp", "otp"],
  hookName: "usePharmacienAuth",
});

// Fournisseur d'authentification pharmacien.
export const PharmacienAuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => <Provider>{children}</Provider>;

// Hook personnalisé pour utiliser le contexte.
export const usePharmacienAuth = (): PharmacienAuthContextType => {
  const { session, isAuthenticated, isLoading, login, logout, updateSession } =
    useStorageAuth();
  return {
    pharmacien: session,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updatePharmacien: updateSession,
  };
};

export default Provider;
