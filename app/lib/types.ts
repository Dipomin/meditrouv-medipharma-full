/**
 * Types de domaine Medipharma (source unique).
 * Reflet des modèles serveur (meditrouv-admin/prisma/schema.prisma).
 */

import type { Medicament, Pharmacie } from "./normalize";

export type { Medicament, Pharmacie };

// Compte pharmacien (sérialisation publique serveur : jamais de hash).
export type Pharmacien = {
  id: string;
  numeroOrdre: string;
  nomPharmacienTitulaire: string;
  nomPharmacie: string | null;
  whatsapp: string;
  email: string | null;
  telephoneFixe: string | null;
  ville: string | null;
  commune: string | null;
  pharmacieId: string | null;
  pharmacie?: Pharmacie | null;
  verified: boolean;
  abonne: boolean;
  forfait: string | null;
  dateSouscription: string | null;
  dateExpiration: string | null;
  moyenPaiement: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationStatut = "non_lue" | "lue" | "traitee";

// Notification adressée à la pharmacie (recherche patient ou commande).
export type NotificationPharmacien = {
  id: string;
  pharmacieId: string;
  pharmacienId: string | null;
  rechercheId: string | null;
  demandeId: string | null;
  medicamentNom: string;
  message: string;
  statut: NotificationStatut | string;
  whatsappSent: boolean;
  whatsappStatus: string | null;
  readAt: string | null;
  createdAt: string;
  pharmacie?: { id: string; nomPharmacie: string | null };
  recherche?: {
    id: string;
    query: string;
    commune: string | null;
    createdAt: string;
  } | null;
};

export type CommandeStatut =
  | "en_attente"
  | "acceptee"
  | "refusee"
  | "preparee"
  | "livree"
  | "annulee";

// Commande inter-pharmacies.
export type Commande = {
  id: string;
  pharmacieDemandeuseId: string;
  pharmacieFournisseuseId: string | null;
  medicamentId: string | null;
  medicamentNom: string;
  quantite: number;
  statut: CommandeStatut | string;
  urgence: string;
  notes: string | null;
  telephoneContact: string | null;
  createdAt: string;
  updatedAt: string;
};

// Requête broadcast inter-pharmacies (rupture de stock).
export type DemandeStatut = "ouverte" | "cloturee" | "expiree" | "annulee";

export type LigneDemande = {
  id: string;
  demandeId: string;
  medicamentNom: string;
  quantite: number;
};

export type LigneProposition = {
  id: string;
  propositionId: string;
  ligneDemandeId: string | null;
  medicamentNom: string;
  quantiteProposee: number;
  prixUnitaire: number | null;
  disponible: boolean;
};

export type PropositionDemande = {
  id: string;
  demandeId: string;
  pharmacieId: string;
  nomPharmacie: string | null;
  pharmacienId: string;
  prixTotal: number | null;
  message: string | null;
  telephoneContact: string | null;
  createdAt: string;
  lignes: LigneProposition[];
};

export type DemandeInter = {
  id: string;
  pharmacieDemandeuseId: string;
  nomPharmacieDemandeuse: string | null;
  pharmacienId: string | null;
  urgence: string;
  notes: string | null;
  telephoneContact: string | null;
  statut: DemandeStatut | string;
  propositionsCount: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  lignes: LigneDemande[];
  propositions: PropositionDemande[];
};

// Chiffres clés du tableau de bord.
export type DashboardStats = {
  notifications: {
    unread: number;
    today: number;
    lastWeek: number;
    recent: {
      id: string;
      medicamentNom: string;
      message: string;
      statut: string;
      createdAt: string;
    }[];
  };
  stock: { medicaments: number; ruptures: number; faibles: number };
  commandes: { recuesEnAttente: number; emisesEnAttente: number };
};

// Enveloppe paginée du serveur.
export type Paginated<T> = {
  data: T[];
  pagination: { total: number; page: number; currentPage: number; limit: number };
};
