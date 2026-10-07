/**
 * Statuts de commandes inter-pharmacies (fonctions pures, sans React Native).
 * Testables en Node (`__tests__/commandes.test.ts`).
 */

export type CommandeFlowStatut =
  | "en_attente"
  | "acceptee"
  | "preparee"
  | "livree";

export const COMMANDE_FLOW: readonly CommandeFlowStatut[] = [
  "en_attente",
  "acceptee",
  "preparee",
  "livree",
];

const STATUT_META: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "#EF6C00" },
  acceptee: { label: "Acceptée", color: "#1565C0" },
  refusee: { label: "Refusée", color: "#D32F2F" },
  preparee: { label: "Préparée", color: "#6A1B9A" },
  livree: { label: "Livrée", color: "#2E7D32" },
  annulee: { label: "Annulée", color: "#666" },
};

/** Libellé + couleur d'un statut (repli honnête si inconnu). */
export const statutMeta = (statut: string): { label: string; color: string } =>
  STATUT_META[statut] ?? { label: statut, color: "#666" };

export type TimelineStep = {
  id: string;
  label: string;
  done: boolean;
  current: boolean;
};

/**
 * Étapes du cycle de vie pour la timeline. Statuts terminaux négatifs
 * (refusée/annulée) : tableau vide, la carte affiche un badge terminal.
 */
export const timelineSteps = (statut: string): TimelineStep[] => {
  const index = COMMANDE_FLOW.indexOf(statut as CommandeFlowStatut);
  if (index < 0) {
    return [];
  }
  return COMMANDE_FLOW.map((step, stepIndex) => ({
    id: step,
    label: STATUT_META[step].label,
    done: stepIndex <= index,
    current: stepIndex === index,
  }));
};

export type CommandeAction = {
  statut: string;
  label: string;
  primary: boolean;
};

/** Actions contextuelles d'une commande selon l'onglet (reçues/émises). */
export const availableActions = (
  statut: string,
  tab: "recues" | "emises"
): CommandeAction[] => {
  if (tab === "recues") {
    if (statut === "en_attente") {
      return [
        { statut: "acceptee", label: "Accepter", primary: true },
        { statut: "refusee", label: "Refuser", primary: false },
      ];
    }
    if (statut === "acceptee") {
      return [{ statut: "preparee", label: "Marquer préparée", primary: true }];
    }
    if (statut === "preparee") {
      return [{ statut: "livree", label: "Marquer livrée", primary: true }];
    }
    return [];
  }
  if (statut === "en_attente") {
    return [{ statut: "annulee", label: "Annuler", primary: false }];
  }
  return [];
};

/** Une commande « urgente » remonte en tête visuellement. */
export const isUrgent = (urgence: string): boolean => urgence === "urgente";
