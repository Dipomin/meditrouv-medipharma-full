import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  availableActions,
  isUrgent,
  statutMeta,
  timelineSteps,
} from "../app/lib/commandes.ts";

describe("commandes", () => {
  it("expose libellé + couleur par statut (repli si inconnu)", () => {
    assert.deepEqual(statutMeta("livree"), {
      label: "Livrée",
      color: "#2E7D32",
    });
    assert.deepEqual(statutMeta("zzz"), { label: "zzz", color: "#666" });
  });

  it("construit la timeline du cycle de vie", () => {
    const steps = timelineSteps("preparee");
    assert.deepEqual(
      steps.map((step) => step.id),
      ["en_attente", "acceptee", "preparee", "livree"]
    );
    assert.deepEqual(
      steps.map((step) => step.done),
      [true, true, true, false]
    );
    assert.equal(steps[2].current, true);
  });

  it("masque la timeline pour les statuts terminaux négatifs", () => {
    assert.deepEqual(timelineSteps("refusee"), []);
    assert.deepEqual(timelineSteps("annulee"), []);
    assert.deepEqual(timelineSteps("zzz"), []);
  });

  it("propose les actions reçues (accepter/refuser/étapes)", () => {
    assert.deepEqual(availableActions("en_attente", "recues"), [
      { statut: "acceptee", label: "Accepter", primary: true },
      { statut: "refusee", label: "Refuser", primary: false },
    ]);
    assert.deepEqual(availableActions("acceptee", "recues"), [
      { statut: "preparee", label: "Marquer préparée", primary: true },
    ]);
    assert.deepEqual(availableActions("preparee", "recues"), [
      { statut: "livree", label: "Marquer livrée", primary: true },
    ]);
    assert.deepEqual(availableActions("livree", "recues"), []);
  });

  it("propose l'annulation des émises en attente", () => {
    assert.deepEqual(availableActions("en_attente", "emises"), [
      { statut: "annulee", label: "Annuler", primary: false },
    ]);
    assert.deepEqual(availableActions("acceptee", "emises"), []);
  });

  it("détecte les urgences", () => {
    assert.equal(isUrgent("urgente"), true);
    assert.equal(isUrgent("normale"), false);
    assert.equal(isUrgent(""), false);
  });
});
