import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  canRespond,
  compteurPropositions,
  demandeStatutMeta,
  formatPrix,
  isUrgentDemande,
  lignePropositionTotal,
  resumeLignes,
} from "../app/lib/demandes.ts";

describe("demandes", () => {
  it("expose libellé + couleur par statut (repli si inconnu)", () => {
    assert.deepEqual(demandeStatutMeta("ouverte"), {
      label: "Ouverte",
      color: "#2E7D32",
    });
    assert.deepEqual(demandeStatutMeta("cloturee"), {
      label: "Clôturée (5/5)",
      color: "#1565C0",
    });
    assert.deepEqual(demandeStatutMeta("zzz"), { label: "zzz", color: "#666" });
  });

  it("détecte l'urgence", () => {
    assert.equal(isUrgentDemande("urgente"), true);
    assert.equal(isUrgentDemande("normale"), false);
  });

  it("autorise la réponse dans les règles", () => {
    const base = {
      statut: "ouverte",
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
      pharmacieDemandeuseId: "ph-a",
      maPharmacieId: "ph-b",
      dejaRepondu: false,
      propositionsCount: 2,
    };
    assert.equal(canRespond(base), true);
    assert.equal(canRespond({ ...base, maPharmacieId: null }), false);
    assert.equal(
      canRespond({ ...base, maPharmacieId: "ph-a" }),
      false
    );
    assert.equal(canRespond({ ...base, statut: "cloturee" }), false);
    assert.equal(canRespond({ ...base, dejaRepondu: true }), false);
    assert.equal(canRespond({ ...base, propositionsCount: 5 }), false);
    assert.equal(
      canRespond({
        ...base,
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      }),
      false
    );
  });

  it("formate prix, totaux et résumés", () => {
    assert.equal(formatPrix(500), "500 F");
    assert.equal(formatPrix(null), "—");
    assert.equal(
      lignePropositionTotal({ quantiteProposee: 10, prixUnitaire: 500 }),
      5000
    );
    assert.equal(
      lignePropositionTotal({ quantiteProposee: 10, prixUnitaire: null }),
      null
    );
    assert.equal(
      resumeLignes([
        { medicamentNom: "Doliprane", quantite: 10 },
        { medicamentNom: "Amox", quantite: 5 },
        { medicamentNom: "Fer", quantite: 2 },
      ]),
      "10x Doliprane, 5x Amox (+1)"
    );
    assert.equal(resumeLignes([]), "—");
    assert.equal(compteurPropositions(3), "3/5");
  });
});
