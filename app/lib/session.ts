/**
 * Helpers purs de session pharmacien (sans dépendance).
 *
 * Volontairement sans import runtime : importable tel quel sous Node
 * pour les tests unitaires (`__tests__/session.test.ts`).
 */

import type { Pharmacien } from "./types";

// Égalité champ à champ d'un profil pharmacien (retours API normalisés).
// Sert à IGNORER les rafraîchissements sans changement : sans ce garde,
// chaque `GET /pharmaciens/me` écrivait un nouvel objet en contexte,
// nouvelle identité qui re-déclenchait tous les effets dépendant du
// profil (re-fetch dashboard/notifications, redirections) en boucle.
export const isSamePharmacien = (
  current: Pharmacien,
  fresh: Pharmacien
): boolean =>
  current.id === fresh.id &&
  current.numeroOrdre === fresh.numeroOrdre &&
  current.nomPharmacienTitulaire === fresh.nomPharmacienTitulaire &&
  current.nomPharmacie === fresh.nomPharmacie &&
  current.whatsapp === fresh.whatsapp &&
  current.email === fresh.email &&
  current.telephoneFixe === fresh.telephoneFixe &&
  current.ville === fresh.ville &&
  current.commune === fresh.commune &&
  current.pharmacieId === fresh.pharmacieId &&
  (current.pharmacie?.id ?? null) === (fresh.pharmacie?.id ?? null) &&
  (current.pharmacie?.nomPharmacie ?? null) ===
    (fresh.pharmacie?.nomPharmacie ?? null) &&
  current.verified === fresh.verified &&
  current.abonne === fresh.abonne &&
  current.forfait === fresh.forfait &&
  current.dateSouscription === fresh.dateSouscription &&
  current.dateExpiration === fresh.dateExpiration &&
  current.moyenPaiement === fresh.moyenPaiement &&
  (current.createdAt ?? null) === (fresh.createdAt ?? null) &&
  (current.updatedAt ?? null) === (fresh.updatedAt ?? null);

export type AutoEnterDashboardInput = {
  isLoading: boolean;
  /** L'écran d'accueil est-il celui affiché (pas en arrière-plan) ? */
  isFocused: boolean;
  pharmacienId: string | null | undefined;
  /** Une redirection auto a-t-elle déjà eu lieu pour ce montage ? */
  hasRedirected: boolean;
};

// Garde d'entrée directe dans l'espace pro depuis l'écran d'accueil.
// Exige le focus : l'accueil reste monté en fond de pile après
// navigation, et rediriger depuis un écran d'arrière-plan détournerait
// l'écran courant (ex. /abonnement juste après inscription) puis
// re-monterait /dashboard à chaque rafraîchissement de profil.
export const shouldAutoEnterDashboard = (
  input: AutoEnterDashboardInput
): boolean =>
  !input.isLoading &&
  input.isFocused &&
  Boolean(input.pharmacienId) &&
  !input.hasRedirected;
