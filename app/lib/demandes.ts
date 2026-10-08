/**
 * Requêtes broadcast inter-pharmacies (fonctions pures, sans React Native).
 * Testables en Node (`__tests__/demandes.test.ts`).
 */

import type { LigneDemande, LigneProposition } from "./types";

// Miroir de DEMANDE_PROPOSITIONS_MAX (serveur) : seules les 5 premières
// propositions sont transmises au demandeur.
export const DEMANDES_PROPOSITIONS_MAX = 5;

const STATUT_META: Record<string, { label: string; color: string }> = {
  ouverte: { label: "Ouverte", color: "#2E7D32" },
  cloturee: { label: "Clôturée (5/5)", color: "#1565C0" },
  expiree: { label: "Expirée", color: "#9E9E9E" },
  annulee: { label: "Annulée", color: "#666" },
};

/** Libellé + couleur d'un statut de requête (repli honnête si inconnu). */
export const demandeStatutMeta = (
  statut: string
): { label: string; color: string } =>
  STATUT_META[statut] ?? { label: statut, color: "#666" };

/** Une requête « urgente » remonte en tête visuellement. */
export const isUrgentDemande = (urgence: string): boolean =>
  urgence === "urgente";

export type ReponseEligibilite = {
  statut: string;
  expiresAt: string;
  pharmacieDemandeuseId: string;
  maPharmacieId: string | null | undefined;
  dejaRepondu: boolean;
  propositionsCount: number;
};

/**
 * Éligibilité à répondre : requête ouverte et non expirée, autre pharmacie,
 * pas de doublon, cap non atteint. `now` injectable pour les tests.
 */
export const canRespond = (
  demande: ReponseEligibilite,
  now: Date = new Date()
): boolean => {
  if (!demande.maPharmacieId) {
    return false;
  }
  if (demande.pharmacieDemandeuseId === demande.maPharmacieId) {
    return false;
  }
  if (demande.statut !== "ouverte") {
    return false;
  }
  if (demande.dejaRepondu) {
    return false;
  }
  if (demande.propositionsCount >= DEMANDES_PROPOSITIONS_MAX) {
    return false;
  }
  const fin = new Date(demande.expiresAt).getTime();
  if (Number.isNaN(fin) || fin <= now.getTime()) {
    return false;
  }
  return true;
};

/** Prix affiché (« — » si non chiffré). */
export const formatPrix = (prix: number | null | undefined): string =>
  typeof prix === "number" && Number.isFinite(prix) ? `${prix} F` : "—";

/** Total d'une ligne de proposition (null si non chiffrable). */
export const lignePropositionTotal = (
  ligne: Pick<LigneProposition, "quantiteProposee" | "prixUnitaire">
): number | null => {
  if (typeof ligne.prixUnitaire !== "number") {
    return null;
  }
  return ligne.quantiteProposee * ligne.prixUnitaire;
};

/** Résumé compact des lignes (« 10x Doliprane (+1) »). */
export const resumeLignes = (
  lignes: readonly Pick<LigneDemande, "medicamentNom" | "quantite">[],
  max = 2
): string => {
  if (lignes.length === 0) {
    return "—";
  }
  const visibles = lignes.slice(0, max).map(
    (ligne) => `${ligne.quantite}x ${ligne.medicamentNom}`
  );
  const reste = lignes.length - visibles.length;
  return reste > 0 ? `${visibles.join(", ")} (+${reste})` : visibles.join(", ");
};

/** Compteur de propositions (« 3/5 »). */
export const compteurPropositions = (count: number): string =>
  `${count}/${DEMANDES_PROPOSITIONS_MAX}`;

export type DemandesListSens = "all" | "emises" | "recues";

/**
 * Paramètres de `GET /demandes` (`limit` optionnel : aperçu accueil).
 * Le serveur trie par récence décroissante et borne `limit` à 100.
 */
export const demandesListParams = (
  pharmacieId: string,
  sens: DemandesListSens,
  limit?: number
): string => {
  const params = new URLSearchParams({ pharmacieId, sens });
  if (limit !== undefined) {
    params.set("limit", String(limit));
  }
  return params.toString();
};
