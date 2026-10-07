import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  normalizeMedicament,
  normalizePharmacie,
  stableLocalId,
} from "../app/lib/normalize.ts";

describe("normalizeMedicament", () => {
  it("accepte les deux conventions de nommage (camel + snake)", () => {
    const camel = normalizeMedicament({ id: "1", nomMedicament: "Doli", quantite: 5 });
    assert.equal(camel.nomMedicament, "Doli");
    assert.equal(camel.nom_medicament, "Doli");
    const snake = normalizeMedicament({ id: "1", nom_medicament: "Doli", quantite: 5 });
    assert.equal(snake.nomMedicament, "Doli");
    assert.equal(snake.id_medicament, "1");
  });

  it("applique des replis sûrs (nom, quantité, prix)", () => {
    const med = normalizeMedicament({ id: "x", quantite: Number.NaN });
    assert.equal(med.nomMedicament, "Médicament sans nom");
    assert.equal(med.quantite, 0);
    assert.equal(med.prix, null);
    assert.equal(med.description, null);
  });

  it("génère des identifiants stables et déterministes", () => {
    const a = normalizeMedicament({ nomMedicament: "Doli", quantite: 1 });
    const b = normalizeMedicament({ nomMedicament: "Doli", quantite: 1 });
    assert.equal(a.id, b.id);
    assert.match(a.id, /^medicament-/);
    const other = normalizeMedicament({
      nomMedicament: "Doli",
      codePharmacie: "P2",
      quantite: 1,
    });
    assert.notEqual(a.id, other.id);
  });

  it("tolère les entrées non-objets", () => {
    for (const input of [null, undefined, 42, "x", []]) {
      const med = normalizeMedicament(input);
      assert.equal(med.nomMedicament, "Médicament sans nom");
      assert.ok(med.id.length > 0);
    }
  });
});

describe("normalizePharmacie", () => {
  it("accepte les deux conventions de nommage", () => {
    const p = normalizePharmacie({ id: "9", nom_pharmacie: "Pharma", commune: "C" });
    assert.equal(p.nomPharmacie, "Pharma");
    assert.equal(p.id_pharmacie, "9");
  });

  it("applique le repli de nom et des IDs stables", () => {
    const a = normalizePharmacie({ commune: "C" });
    const b = normalizePharmacie({ commune: "C" });
    assert.equal(a.nomPharmacie, "Pharmacie sans nom");
    assert.equal(a.id, b.id);
  });
});

describe("stableLocalId", () => {
  it("est déterministe et sensible à la graine", () => {
    assert.equal(stableLocalId("p", "abc"), stableLocalId("p", "abc"));
    assert.notEqual(stableLocalId("p", "abc"), stableLocalId("p", "abd"));
  });
});
