/**
 * Helpers d'alertes pharmacien (fonctions pures, sans React Native).
 * Testables en Node (`__tests__/alerts.test.ts`).
 */

import type { NotificationPharmacien } from "./types";

/** Clé calendaire locale « AAAA-MM-JJ » ("" si illisible). */
export const dayKey = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const keyOf = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Libellé d'un groupe jour : « Aujourd'hui », « Hier » ou date courte. */
export const dayLabel = (key: string, now: Date = new Date()): string => {
  if (!key) {
    return "Date inconnue";
  }
  if (key === keyOf(now)) {
    return "Aujourd'hui";
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key === keyOf(yesterday)) {
    return "Hier";
  }
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export type DayGroup = {
  key: string;
  label: string;
  items: NotificationPharmacien[];
};

/** Regroupe des alertes par jour calendaire (plus récent d'abord). */
export const groupByDay = (
  items: readonly NotificationPharmacien[],
  now: Date = new Date()
): DayGroup[] => {
  const groups = new Map<string, NotificationPharmacien[]>();
  for (const item of items) {
    const key = dayKey(item.createdAt);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }
  return [...groups.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([key, groupItems]) => ({
      key: key || "unknown",
      label: dayLabel(key, now),
      items: groupItems,
    }));
};

export type MedicamentGroup = {
  medicamentNom: string;
  count: number;
  unread: number;
  latestAt: string;
  items: NotificationPharmacien[];
};

/** Regroupe des alertes par médicament (activité récente d'abord). */
export const groupByMedicament = (
  items: readonly NotificationPharmacien[]
): MedicamentGroup[] => {
  const groups = new Map<string, NotificationPharmacien[]>();
  for (const item of items) {
    const name = item.medicamentNom || "Sans nom";
    const group = groups.get(name);
    if (group) {
      group.push(item);
    } else {
      groups.set(name, [item]);
    }
  }
  return [...groups.entries()]
    .map(([medicamentNom, groupItems]) => ({
      medicamentNom,
      count: groupItems.length,
      unread: groupItems.filter((item) => item.statut === "non_lue").length,
      latestAt: groupItems.reduce(
        (latest, item) => (item.createdAt > latest ? item.createdAt : latest),
        ""
      ),
      items: groupItems,
    }))
    .sort((a, b) => (a.latestAt < b.latestAt ? 1 : -1));
};

/** Minuscules sans accents (recherche insensible aux diacritiques). */
export const fold = (value: string): string =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/** Filtre textuel local (nom, message, requête d'origine). */
export const filterAlerts = (
  items: readonly NotificationPharmacien[],
  query: string
): NotificationPharmacien[] => {
  const needle = fold(query.trim());
  if (!needle) {
    return [...items];
  }
  return items.filter((item) =>
    fold(
      `${item.medicamentNom} ${item.message} ${item.recherche?.query ?? ""}`
    ).includes(needle)
  );
};

/**
 * IDs des alertes non lues présentes dans `items` mais absentes de
 * `previousIds` (détection d'arrivées pour haptique/son).
 */
export const detectNewIds = (
  previousIds: ReadonlySet<string> | readonly string[],
  items: readonly NotificationPharmacien[]
): string[] => {
  const known = previousIds instanceof Set ? previousIds : new Set(previousIds);
  return items
    .filter((item) => item.statut === "non_lue" && !known.has(item.id))
    .map((item) => item.id);
};
