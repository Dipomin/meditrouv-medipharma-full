/**
 * Normalisation des données API (source unique, sans dépendance).
 *
 * Volontairement sans import : importable tel quel sous Node pour les
 * tests unitaires (`__tests__/normalize.test.ts`), sans dépendance native.
 * `api.ts` ré-exporte les types et utilise ces fonctions.
 */

// Types pour les médicaments (adapté au format de l'API Vercel)
export type Medicament = {
  id: string;
  id_medicament?: string; // Pour la compatibilité avec l'ancien code
  nomMedicament: string;
  nom_medicament?: string; // Pour la compatibilité avec l'ancien code
  description?: string | null;
  prix?: number | null;
  quantite: number;
  codePharmacie?: string;
  idPharmacie?: string;
  commune?: string;
  date?: string;
  pharmacie?: {
    nom_pharmacie?: string | null;
    nomPharmacie?: string | null;
    commune?: string | null;
    lien_photo?: string | null;
  };
};

// Types pour les pharmacies (adapté au format de l'API Vercel)
export type Pharmacie = {
  id: string;
  id_pharmacie?: string; // Pour la compatibilité avec l'ancien code
  codePharmacie?: string;
  nomPharmacie: string;
  nom_pharmacie?: string; // Pour la compatibilité avec l'ancien code
  activite?: string;
  activiteSecondaire?: string;
  adresse?: string | null;
  ad1?: string | null;
  quartier?: string | null;
  lien_photo?: string | null;
  commune?: string | null;
  telephone?: string | null;
  garde?: boolean | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distance?: number;
  horaires_pharmacie?: {
    id: string;
    jourSemaine: number;
    heureOuverture: string;
    heureFermeture: string;
    ferme: boolean;
  }[];
};

export type RawRecord = Record<string, unknown>;

/** Garde de type objet (aussi utilisée par `api.ts`). */
export const asRecord = (value: unknown): RawRecord | null =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as RawRecord)
    : null;

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const asNumberOrNull = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

/** Identifiant local stable (empreinte du contenu), pas d'aléatoire. */
export const stableLocalId = (prefix: string, seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return `${prefix}-${(hash >>> 0).toString(36)}`;
};

// Fonction pour normaliser les données des médicaments
export const normalizeMedicament = (input: unknown): Medicament => {
  const med = asRecord(input) ?? {};
  const nom = asString(med.nomMedicament ?? med.nom_medicament);
  const id =
    asString(med.id ?? med.id_medicament) ||
    stableLocalId(
      "medicament",
      `${nom}|${asString(med.codePharmacie)}|${asString(med.idPharmacie)}|${String(med.prix ?? "")}`
    );
  const displayName = nom || "Médicament sans nom";
  const quantite =
    typeof med.quantite === "number" && Number.isFinite(med.quantite)
      ? med.quantite
      : 0;
  const pharmacie = asRecord(med.pharmacie);

  return {
    ...(med as Partial<Medicament>),
    id,
    id_medicament: id,
    nom_medicament: displayName,
    nomMedicament: displayName,
    description:
      typeof med.description === "string" ? med.description : null,
    prix: asNumberOrNull(med.prix),
    quantite,
    ...(pharmacie ? { pharmacie: pharmacie as Medicament["pharmacie"] } : {}),
  };
};

// Fonction pour normaliser les données des pharmacies
export const normalizePharmacie = (input: unknown): Pharmacie => {
  const pharm = asRecord(input) ?? {};
  const nom = asString(pharm.nomPharmacie ?? pharm.nom_pharmacie);
  const id =
    asString(pharm.id ?? pharm.id_pharmacie) ||
    stableLocalId(
      "pharmacie",
      `${nom}|${asString(pharm.commune)}|${asString(pharm.quartier)}`
    );
  const displayName = nom || "Pharmacie sans nom";

  return {
    ...(pharm as Partial<Pharmacie>),
    id,
    id_pharmacie: id,
    nom_pharmacie: displayName,
    nomPharmacie: displayName,
  };
};
