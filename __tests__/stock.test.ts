import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { filterStockLocal, sortStock } from "../app/lib/stock.ts";
import type { Medicament } from "../app/lib/types.ts";

const med = (part: Partial<Medicament> & { id: string }): Medicament => ({
  nomMedicament: "X",
  quantite: 0,
  ...part,
});

describe("stock", () => {
  it("trie par nom (fr, stable)", () => {
    const items = [
      med({ id: "b", nomMedicament: "Doliprane" }),
      med({ id: "a", nomMedicament: "Aspirine" }),
      med({ id: "c", nomMedicament: "Aspirine" }),
    ];
    assert.deepEqual(
      sortStock(items, "nom").map((item) => item.id),
      ["a", "c", "b"]
    );
  });

  it("trie par quantité croissante / décroissante (stable)", () => {
    const items = [
      med({ id: "a", quantite: 5 }),
      med({ id: "b", quantite: 0 }),
      med({ id: "c", quantite: 5 }),
    ];
    assert.deepEqual(
      sortStock(items, "qte-asc").map((item) => item.id),
      ["b", "a", "c"]
    );
    assert.deepEqual(
      sortStock(items, "qte-desc").map((item) => item.id),
      ["a", "c", "b"]
    );
  });

  it("filtre en local (nom + description, accents pliés)", () => {
    const items = [
      med({ id: "a", nomMedicament: "Érythromycine" }),
      med({ id: "b", nomMedicament: "X", description: "Antalgique puissant" }),
      med({ id: "c", nomMedicament: "Y" }),
    ];
    assert.deepEqual(
      filterStockLocal(items, "erythro").map((item) => item.id),
      ["a"]
    );
    assert.deepEqual(
      filterStockLocal(items, "antal").map((item) => item.id),
      ["b"]
    );
    assert.equal(filterStockLocal(items, "").length, 3);
  });
});
