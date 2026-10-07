/**
 * Façade métiers Medipharma sur le cœur partagé `apiClient`.
 * - Auth pharmacien : inscription / connexion / profil (backend réel).
 * - Notifications : boîte de réception des recherches patients.
 * - Stock : médicaments de la pharmacie rattachée.
 * - Commandes : inter-pharmacies.
 * Erreurs explicites (`ApiError`), paramètres encodés, normalisation
 * `unknown` + garde de type (voir `normalize`).
 */

import {
  ApiError,
  deleteJsonAuth,
  getJson,
  getJsonAuth,
  patchJsonAuth,
  postJson,
  postJsonAuth,
} from "./apiClient";
import { getApiUrl } from "./config";
import { logger } from "./logger";
import {
  asRecord,
  normalizeMedicament,
  normalizePharmacie,
  type Medicament,
  type Pharmacie,
} from "./normalize";
import type {
  Commande,
  DashboardStats,
  DemandeInter,
  LigneDemande,
  LigneProposition,
  NotificationPharmacien,
  Paginated,
  Pharmacien,
  PropositionDemande,
} from "./types";

export type { Medicament, Pharmacie };
export type {
  Commande,
  DashboardStats,
  DemandeInter,
  LigneDemande,
  LigneProposition,
  NotificationPharmacien,
  Pharmacien,
  PropositionDemande,
};
export { normalizeMedicament, normalizePharmacie };
export { ApiError } from "./apiClient";

const asPaginated = <T>(
  payload: unknown,
  label: string,
  normalize: (item: unknown) => T
): Paginated<T> => {
  const record = asRecord(payload);
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(record?.data)
      ? (record.data as unknown[])
      : null;
  if (!items) {
    logger.warn(`Format de réponse inattendu pour ${label}.`);
    throw new ApiError(
      `Format de réponse inattendu du serveur (${label}).`,
      { kind: "parse" }
    );
  }
  return {
    data: items.map(normalize),
    pagination: {
      total: items.length,
      page: 1,
      currentPage: 1,
      limit: items.length,
    },
  };
};

const normalizeNotification = (input: unknown): NotificationPharmacien => {
  const row = asRecord(input) ?? {};
  const str = (value: unknown): string =>
    typeof value === "string" ? value : "";
  return {
    id: str(row.id),
    pharmacieId: str(row.pharmacieId),
    pharmacienId:
      typeof row.pharmacienId === "string" ? row.pharmacienId : null,
    rechercheId: typeof row.rechercheId === "string" ? row.rechercheId : null,
    demandeId: typeof row.demandeId === "string" ? row.demandeId : null,
    medicamentNom: str(row.medicamentNom) || "Médicament",
    message: str(row.message),
    statut: str(row.statut) || "non_lue",
    whatsappSent: row.whatsappSent === true,
    whatsappStatus:
      typeof row.whatsappStatus === "string" ? row.whatsappStatus : null,
    readAt: typeof row.readAt === "string" ? row.readAt : null,
    createdAt: str(row.createdAt),
    pharmacie: asRecord(row.pharmacie)
      ? {
          id: str((row.pharmacie as Record<string, unknown>).id),
          nomPharmacie:
            typeof (row.pharmacie as Record<string, unknown>).nomPharmacie ===
            "string"
              ? ((row.pharmacie as Record<string, unknown>)
                  .nomPharmacie as string)
              : null,
        }
      : undefined,
    recherche: asRecord(row.recherche)
      ? {
          id: str((row.recherche as Record<string, unknown>).id),
          query: str((row.recherche as Record<string, unknown>).query),
          commune:
            typeof (row.recherche as Record<string, unknown>).commune ===
            "string"
              ? ((row.recherche as Record<string, unknown>).commune as string)
              : null,
          createdAt: str((row.recherche as Record<string, unknown>).createdAt),
        }
      : null,
  };
};

const normalizeCommande = (input: unknown): Commande => {
  const row = asRecord(input) ?? {};
  const str = (value: unknown): string =>
    typeof value === "string" ? value : "";
  const num = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value) ? value : 1;
  return {
    id: str(row.id),
    pharmacieDemandeuseId: str(row.pharmacieDemandeuseId),
    pharmacieFournisseuseId:
      typeof row.pharmacieFournisseuseId === "string"
        ? row.pharmacieFournisseuseId
        : null,
    medicamentId: typeof row.medicamentId === "string" ? row.medicamentId : null,
    medicamentNom: str(row.medicamentNom),
    quantite: num(row.quantite),
    statut: str(row.statut) || "en_attente",
    urgence: str(row.urgence) || "normale",
    notes: typeof row.notes === "string" ? row.notes : null,
    telephoneContact:
      typeof row.telephoneContact === "string" ? row.telephoneContact : null,
    createdAt: str(row.createdAt),
    updatedAt: str(row.updatedAt),
  };
};

const normalizePharmacien = (input: unknown): Pharmacien => {
  const row = asRecord(input) ?? {};
  const str = (value: unknown): string =>
    typeof value === "string" ? value : "";
  const strOrNull = (value: unknown): string | null =>
    typeof value === "string" ? value : null;
  return {
    id: str(row.id),
    numeroOrdre: str(row.numeroOrdre),
    nomPharmacienTitulaire: str(row.nomPharmacienTitulaire),
    nomPharmacie: strOrNull(row.nomPharmacie),
    whatsapp: str(row.whatsapp),
    email: strOrNull(row.email),
    telephoneFixe: strOrNull(row.telephoneFixe),
    ville: strOrNull(row.ville),
    commune: strOrNull(row.commune),
    pharmacieId: strOrNull(row.pharmacieId),
    pharmacie: asRecord(row.pharmacie)
      ? normalizePharmacie(row.pharmacie)
      : null,
    verified: row.verified === true,
    abonne: row.abonne === true,
    forfait: strOrNull(row.forfait),
    dateSouscription: strOrNull(row.dateSouscription),
    dateExpiration: strOrNull(row.dateExpiration),
    moyenPaiement: strOrNull(row.moyenPaiement),
    createdAt: strOrNull(row.createdAt) ?? undefined,
    updatedAt: strOrNull(row.updatedAt) ?? undefined,
  };
};

// Authentification / compte pharmacien (backend réel).
export const pharmacienAPI = {
  register: async (data: {
    numeroOrdre: string;
    nomPharmacienTitulaire: string;
    nomPharmacie?: string;
    whatsapp: string;
    email?: string;
    telephoneFixe?: string;
    ville?: string;
    commune?: string;
    password?: string;
    pharmacieId?: string;
  }): Promise<Pharmacien> => {
    try {
      const payload = await postJson<unknown>(
        `${getApiUrl()}/pharmaciens/register`,
        data
      );
      return normalizePharmacien(payload);
    } catch (error) {
      logger.error("Échec de l'inscription pharmacien.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de créer le compte.", { kind: "network" });
    }
  },

  login: async (data: {
    numeroOrdre: string;
    password?: string;
    whatsapp?: string;
  }): Promise<Pharmacien> => {
    try {
      const payload = await postJson<unknown>(
        `${getApiUrl()}/pharmaciens/login`,
        data
      );
      return normalizePharmacien(payload);
    } catch (error) {
      logger.error("Échec de la connexion pharmacien.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de se connecter.", { kind: "network" });
    }
  },

  me: async (pharmacienId: string): Promise<Pharmacien> => {
    try {
      const payload = await getJsonAuth<unknown>(
        `${getApiUrl()}/pharmaciens/me`,
        pharmacienId
      );
      return normalizePharmacien(payload);
    } catch (error) {
      logger.error("Échec du chargement du profil.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de charger le profil.", { kind: "network" });
    }
  },

  updateMe: async (
    pharmacienId: string,
    data: Partial<Pharmacien>
  ): Promise<Pharmacien> => {
    try {
      const payload = await patchJsonAuth<unknown>(
        `${getApiUrl()}/pharmaciens/me`,
        data,
        pharmacienId
      );
      return normalizePharmacien(payload);
    } catch (error) {
      logger.error("Échec de la mise à jour du profil.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de mettre à jour le profil.", {
            kind: "network",
          });
    }
  },

  dashboard: async (
    pharmacienId: string,
    pharmacieId: string
  ): Promise<DashboardStats> => {
    try {
      return await getJsonAuth<DashboardStats>(
        `${getApiUrl()}/pharmaciens/dashboard?pharmacieId=${encodeURIComponent(pharmacieId)}`,
        pharmacienId
      );
    } catch (error) {
      logger.error("Échec du chargement du tableau de bord.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de charger le tableau de bord.", {
            kind: "network",
          });
    }
  },
};

// Notifications des recherches patients.
export const notificationsAPI = {
  list: async (
    pharmacienId: string,
    pharmacieId: string,
    statut?: string
  ): Promise<{ data: NotificationPharmacien[]; unreadCount: number }> => {
    try {
      const params = new URLSearchParams({ pharmacieId });
      if (statut) params.set("statut", statut);
      const payload = await getJsonAuth<unknown>(
        `${getApiUrl()}/notifications?${params.toString()}`,
        pharmacienId
      );
      const page = asPaginated(payload, "notifications", normalizeNotification);
      const record = asRecord(payload);
      const unreadCount =
        typeof record?.unreadCount === "number" ? record.unreadCount : 0;
      return { data: page.data, unreadCount };
    } catch (error) {
      logger.error("Échec du chargement des notifications.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de charger les notifications.", {
            kind: "network",
          });
    }
  },

  getById: async (
    pharmacienId: string,
    id: string
  ): Promise<NotificationPharmacien> => {
    try {
      const payload = await getJsonAuth<unknown>(
        `${getApiUrl()}/notifications/${encodeURIComponent(id)}`,
        pharmacienId
      );
      return normalizeNotification(payload);
    } catch (error) {
      logger.error("Échec du chargement de la notification.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de charger la notification.", {
            kind: "network",
          });
    }
  },

  unreadCount: async (
    pharmacienId: string,
    pharmacieId: string
  ): Promise<number> => {
    const payload = await getJsonAuth<{ count: number }>(
      `${getApiUrl()}/notifications/unread-count?pharmacieId=${encodeURIComponent(pharmacieId)}`,
      pharmacienId
    );
    return payload.count ?? 0;
  },

  setStatut: async (
    pharmacienId: string,
    id: string,
    statut: "non_lue" | "lue" | "traitee"
  ): Promise<NotificationPharmacien> => {
    try {
      const payload = await patchJsonAuth<unknown>(
        `${getApiUrl()}/notifications/${encodeURIComponent(id)}`,
        { statut },
        pharmacienId
      );
      return normalizeNotification(payload);
    } catch (error) {
      logger.error("Échec de la mise à jour de la notification.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de mettre à jour la notification.", {
            kind: "network",
          });
    }
  },

  remove: async (pharmacienId: string, id: string): Promise<void> => {
    await deleteJsonAuth(
      `${getApiUrl()}/notifications/${encodeURIComponent(id)}`,
      pharmacienId
    );
  },
};

// Stock de la pharmacie rattachée.
export const stockAPI = {
  list: async (
    pharmacieId: string,
    query?: string
  ): Promise<Medicament[]> => {
    try {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      const payload = await getJson<unknown>(
        `${getApiUrl()}/pharmacies/${encodeURIComponent(pharmacieId)}/stocks${params}`
      );
      return asPaginated(payload, "stock", normalizeMedicament).data;
    } catch (error) {
      logger.error("Échec du chargement du stock.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de charger le stock.", { kind: "network" });
    }
  },

  create: async (
    pharmacienId: string,
    pharmacieId: string,
    data: {
      nomMedicament: string;
      quantite: number;
      prix?: number;
      description?: string;
      categorie?: string;
      commune?: string;
    }
  ): Promise<Medicament> => {
    try {
      const payload = await postJsonAuth<unknown>(
        `${getApiUrl()}/pharmacies/${encodeURIComponent(pharmacieId)}/stocks`,
        data,
        pharmacienId
      );
      return normalizeMedicament(payload);
    } catch (error) {
      logger.error("Échec de l'ajout au stock.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible d'ajouter au stock.", { kind: "network" });
    }
  },

  update: async (
    pharmacienId: string,
    id: string,
    data: Partial<{
      nomMedicament: string;
      quantite: number;
      prix: number;
      description: string;
      categorie: string;
      commune: string;
    }>
  ): Promise<Medicament> => {
    try {
      const payload = await patchJsonAuth<unknown>(
        `${getApiUrl()}/stocks/${encodeURIComponent(id)}`,
        data,
        pharmacienId
      );
      return normalizeMedicament(payload);
    } catch (error) {
      logger.error("Échec de la mise à jour du stock.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de mettre à jour le stock.", {
            kind: "network",
          });
    }
  },

  remove: async (pharmacienId: string, id: string): Promise<void> => {
    await deleteJsonAuth(
      `${getApiUrl()}/stocks/${encodeURIComponent(id)}`,
      pharmacienId
    );
  },
};

// Commandes inter-pharmacies.
export const commandesAPI = {
  list: async (
    pharmacienId: string,
    pharmacieId: string,
    sens: "all" | "emises" | "recues" = "all"
  ): Promise<Commande[]> => {
    try {
      const params = new URLSearchParams({ pharmacieId, sens });
      const payload = await getJsonAuth<unknown>(
        `${getApiUrl()}/commandes?${params.toString()}`,
        pharmacienId
      );
      return asPaginated(payload, "commandes", normalizeCommande).data;
    } catch (error) {
      logger.error("Échec du chargement des commandes.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de charger les commandes.", {
            kind: "network",
          });
    }
  },

  create: async (
    pharmacienId: string,
    data: {
      medicamentNom: string;
      quantite: number;
      pharmacieFournisseuseId?: string;
      medicamentId?: string;
      urgence?: string;
      notes?: string;
      telephoneContact?: string;
    }
  ): Promise<Commande> => {
    try {
      const payload = await postJsonAuth<unknown>(
        `${getApiUrl()}/commandes`,
        data,
        pharmacienId
      );
      return normalizeCommande(payload);
    } catch (error) {
      logger.error("Échec de la création de la commande.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de créer la commande.", { kind: "network" });
    }
  },

  setStatut: async (
    pharmacienId: string,
    id: string,
    statut: string
  ): Promise<Commande> => {
    try {
      const payload = await patchJsonAuth<unknown>(
        `${getApiUrl()}/commandes/${encodeURIComponent(id)}`,
        { statut },
        pharmacienId
      );
      return normalizeCommande(payload);
    } catch (error) {
      logger.error("Échec de la mise à jour de la commande.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de mettre à jour la commande.", {
            kind: "network",
          });
    }
  },
};

// Annuaire (choix de pharmacie, recherche inter-pharmacies).
export const annuaireAPI = {
  pharmacies: async (query?: string): Promise<Pharmacie[]> => {
    const params = query ? `?q=${encodeURIComponent(query)}` : "";
    const payload = await getJson<unknown>(
      `${getApiUrl()}/pharmacies${params}`
    );
    return asPaginated(payload, "pharmacies", normalizePharmacie).data;
  },

  searchMedicaments: async (query: string): Promise<Medicament[]> => {
    const payload = await getJson<unknown>(
      `${getApiUrl()}/medicaments/search?q=${encodeURIComponent(query)}`
    );
    return asPaginated(payload, "medicaments", normalizeMedicament).data;
  },

  medicamentById: async (id: string): Promise<Medicament> => {
    const payload = await getJson<unknown>(
      `${getApiUrl()}/medicaments/${encodeURIComponent(id)}`
    );
    return normalizeMedicament(payload);
  },
};

// Requêtes broadcast inter-pharmacies.
const normalizeLigneDemande = (input: unknown): LigneDemande => {
  const row = asRecord(input) ?? {};
  const str = (value: unknown): string =>
    typeof value === "string" ? value : "";
  return {
    id: str(row.id),
    demandeId: str(row.demandeId),
    medicamentNom: str(row.medicamentNom),
    quantite:
      typeof row.quantite === "number" && Number.isFinite(row.quantite)
        ? row.quantite
        : 1,
  };
};

const normalizeLigneProposition = (input: unknown): LigneProposition => {
  const row = asRecord(input) ?? {};
  const str = (value: unknown): string =>
    typeof value === "string" ? value : "";
  return {
    id: str(row.id),
    propositionId: str(row.propositionId),
    ligneDemandeId:
      typeof row.ligneDemandeId === "string" ? row.ligneDemandeId : null,
    medicamentNom: str(row.medicamentNom),
    quantiteProposee:
      typeof row.quantiteProposee === "number" &&
      Number.isFinite(row.quantiteProposee)
        ? row.quantiteProposee
        : 1,
    prixUnitaire:
      typeof row.prixUnitaire === "number" ? row.prixUnitaire : null,
    disponible: row.disponible !== false,
  };
};

const normalizeProposition = (input: unknown): PropositionDemande => {
  const row = asRecord(input) ?? {};
  const str = (value: unknown): string =>
    typeof value === "string" ? value : "";
  return {
    id: str(row.id),
    demandeId: str(row.demandeId),
    pharmacieId: str(row.pharmacieId),
    nomPharmacie:
      typeof row.nomPharmacie === "string" ? row.nomPharmacie : null,
    pharmacienId: str(row.pharmacienId),
    prixTotal: typeof row.prixTotal === "number" ? row.prixTotal : null,
    message: typeof row.message === "string" ? row.message : null,
    telephoneContact:
      typeof row.telephoneContact === "string" ? row.telephoneContact : null,
    createdAt: str(row.createdAt),
    lignes: Array.isArray(row.lignes)
      ? (row.lignes as unknown[]).map(normalizeLigneProposition)
      : [],
  };
};

const normalizeDemande = (input: unknown): DemandeInter => {
  const row = asRecord(input) ?? {};
  const str = (value: unknown): string =>
    typeof value === "string" ? value : "";
  return {
    id: str(row.id),
    pharmacieDemandeuseId: str(row.pharmacieDemandeuseId),
    nomPharmacieDemandeuse:
      typeof row.nomPharmacieDemandeuse === "string"
        ? row.nomPharmacieDemandeuse
        : null,
    pharmacienId:
      typeof row.pharmacienId === "string" ? row.pharmacienId : null,
    urgence: str(row.urgence) || "normale",
    notes: typeof row.notes === "string" ? row.notes : null,
    telephoneContact:
      typeof row.telephoneContact === "string" ? row.telephoneContact : null,
    statut: str(row.statut) || "ouverte",
    propositionsCount:
      typeof row.propositionsCount === "number" ? row.propositionsCount : 0,
    expiresAt: str(row.expiresAt),
    createdAt: str(row.createdAt),
    updatedAt: str(row.updatedAt),
    lignes: Array.isArray(row.lignes)
      ? (row.lignes as unknown[]).map(normalizeLigneDemande)
      : [],
    propositions: Array.isArray(row.propositions)
      ? (row.propositions as unknown[]).map(normalizeProposition)
      : [],
  };
};

export const demandesAPI = {
  list: async (
    pharmacienId: string,
    pharmacieId: string,
    sens: "all" | "emises" | "recues" = "all"
  ): Promise<DemandeInter[]> => {
    try {
      const params = new URLSearchParams({ pharmacieId, sens });
      const payload = await getJsonAuth<unknown>(
        `${getApiUrl()}/demandes?${params.toString()}`,
        pharmacienId
      );
      return asPaginated(payload, "demandes", normalizeDemande).data;
    } catch (error) {
      logger.error("Échec du chargement des requêtes.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de charger les requêtes.", {
            kind: "network",
          });
    }
  },

  getById: async (
    pharmacienId: string,
    id: string
  ): Promise<DemandeInter> => {
    try {
      const payload = await getJsonAuth<unknown>(
        `${getApiUrl()}/demandes/${encodeURIComponent(id)}`,
        pharmacienId
      );
      return normalizeDemande(payload);
    } catch (error) {
      logger.error("Échec du chargement de la requête.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de charger la requête.", { kind: "network" });
    }
  },

  create: async (
    pharmacienId: string,
    data: {
      lignes: { medicamentNom: string; quantite: number }[];
      urgence?: string;
      notes?: string;
      telephoneContact?: string;
    }
  ): Promise<{
    demande: DemandeInter;
    notified: number;
    whatsappSent: number;
    pushSent: number;
  }> => {
    try {
      const payload = await postJsonAuth<unknown>(
        `${getApiUrl()}/demandes`,
        data,
        pharmacienId
      );
      const record = asRecord(payload) ?? {};
      const num = (value: unknown): number =>
        typeof value === "number" ? value : 0;
      return {
        demande: normalizeDemande(record.demande ?? payload),
        notified: num(record.notified),
        whatsappSent: num(record.whatsappSent),
        pushSent: num(record.pushSent),
      };
    } catch (error) {
      logger.error("Échec de la diffusion de la requête.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible de diffuser la requête.", {
            kind: "network",
          });
    }
  },

  annuler: async (
    pharmacienId: string,
    id: string
  ): Promise<DemandeInter> => {
    try {
      const payload = await patchJsonAuth<unknown>(
        `${getApiUrl()}/demandes/${encodeURIComponent(id)}`,
        { statut: "annulee" },
        pharmacienId
      );
      return normalizeDemande(payload);
    } catch (error) {
      logger.error("Échec de l'annulation de la requête.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible d'annuler la requête.", { kind: "network" });
    }
  },

  respond: async (
    pharmacienId: string,
    id: string,
    data: {
      lignes: {
        medicamentNom: string;
        quantiteProposee: number;
        prixUnitaire?: number | null;
        disponible?: boolean;
        ligneDemandeId?: string;
      }[];
      prixTotal?: number | null;
      message?: string;
      telephoneContact?: string;
    }
  ): Promise<{
    proposition: PropositionDemande;
    position: number | null;
    demandeStatut: string | null;
  }> => {
    try {
      const payload = await postJsonAuth<unknown>(
        `${getApiUrl()}/demandes/${encodeURIComponent(id)}/propositions`,
        data,
        pharmacienId
      );
      const record = asRecord(payload) ?? {};
      return {
        proposition: normalizeProposition(payload),
        position:
          typeof record.position === "number" ? record.position : null,
        demandeStatut:
          typeof record.demandeStatut === "string"
            ? record.demandeStatut
            : null,
      };
    } catch (error) {
      logger.error("Échec de l'envoi de la proposition.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible d'envoyer la proposition.", {
            kind: "network",
          });
    }
  },
};

// Appareils push (jetons Expo).
export const pushAPI = {
  register: async (
    pharmacienId: string,
    token: string,
    plateforme?: string
  ): Promise<void> => {
    try {
      await postJsonAuth<unknown>(
        `${getApiUrl()}/push/devices`,
        { token, plateforme },
        pharmacienId
      );
    } catch (error) {
      logger.error("Échec de l'enregistrement push.", error);
      throw error instanceof ApiError
        ? error
        : new ApiError("Impossible d'enregistrer les notifications.", {
            kind: "network",
          });
    }
  },

  unregister: async (pharmacienId: string, token: string): Promise<void> => {
    try {
      await deleteJsonAuth(
        `${getApiUrl()}/push/devices?token=${encodeURIComponent(token)}`,
        pharmacienId
      );
    } catch (error) {
      logger.warn("Désinscription push impossible.", error);
    }
  },
};

export default {
  pharmacienAPI,
  notificationsAPI,
  stockAPI,
  commandesAPI,
  annuaireAPI,
  demandesAPI,
  pushAPI,
};
