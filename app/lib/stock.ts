/**
 * Tri et filtre local du stock (fonctions pures, sans React Native).
 * Testables en Node (`__tests__/stock.test.ts`).
 */

import type { Medicament } from "./types";

export type StockSort = "nom" | "qte-asc" | "qte-desc";

/** Tri du stock (stable : l'ordre d'origine départage les ex æquo). */
export const sortStock = (
  items: readonly Medicament[],
  sort: StockSort
): Medicament[] => {
  const decorated = items.map((item, index) => ({ item, index }));
  switch (sort) {
    case "qte-asc":
      decorated.sort(
        (a, b) => a.item.quantite - b.item.quantite || a.index - b.index
      );
      break;
    case "qte-desc":
      decorated.sort(
        (a, b) => b.item.quantite - a.item.quantite || a.index - b.index
      );
      break;
    case "nom":
    default:
      decorated.sort(
        (a, b) =>
          a.item.nomMedicament.localeCompare(b.item.nomMedicament, "fr") ||
          a.index - b.index
      );
      break;
  }
  return decorated.map(({ item }) => item);
};

/** Filtre local insensible à la casse et aux accents (nom + description). */
export const filterStockLocal = (
  items: readonly Medicament[],
  query: string
): Medicament[] => {
  const needle = query
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!needle) {
    return [...items];
  }
  return items.filter((item) =>
    `${item.nomMedicament} ${item.description ?? ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(needle)
  );
};
