import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isSamePharmacien,
  shouldAutoEnterDashboard,
} from "../app/lib/session.ts";
import type { Pharmacien } from "../app/lib/types.ts";

const basePharmacien = (): Pharmacien => ({
  id: "ph-1",
  numeroOrdre: "ORD-001",
  nomPharmacienTitulaire: "Dr Test",
  nomPharmacie: "Pharmacie Test",
  whatsapp: "+2250700000000",
  email: "test@example.com",
  telephoneFixe: null,
  ville: "Abidjan",
  commune: "Cocody",
  pharmacieId: "pha-1",
  pharmacie: { id: "pha-1", nomPharmacie: "Pharmacie Test" },
  verified: true,
  abonne: false,
  forfait: null,
  dateSouscription: null,
  dateExpiration: null,
  moyenPaiement: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
});

describe("session", () => {
  it("détecte un profil identique malgré une nouvelle identité d'objet", () => {
    // Régression : chaque GET /pharmaciens/me écrivait un nouvel objet
    // en contexte, re-déclenchant re-fetch et redirections en boucle.
    assert.equal(isSamePharmacien(basePharmacien(), basePharmacien()), true);
  });

  it("détecte un changement de rattachement ou d'abonnement", () => {
    const current = basePharmacien();
    assert.equal(
      isSamePharmacien(current, { ...current, pharmacieId: "pha-2" }),
      false
    );
    assert.equal(
      isSamePharmacien(current, { ...current, abonne: true }),
      false
    );
    assert.equal(
      isSamePharmacien(current, { ...current, nomPharmacie: "Autre" }),
      false
    );
  });

  it("détecte un changement de pharmacie imbriquée", () => {
    const current = basePharmacien();
    assert.equal(
      isSamePharmacien(current, {
        ...current,
        pharmacie: { id: "pha-1", nomPharmacie: "Renommée" },
      }),
      false
    );
    assert.equal(
      isSamePharmacien(current, { ...current, pharmacie: null }),
      false
    );
  });

  it("n'autorise l'entrée auto que sur l'accueil affiché, session prête, une fois", () => {
    const open = {
      isLoading: false,
      isFocused: true,
      pharmacienId: "ph-1",
      hasRedirected: false,
    };
    assert.equal(shouldAutoEnterDashboard(open), true);
    // Accueil en arrière-plan : ne doit pas détourner l'écran courant.
    assert.equal(
      shouldAutoEnterDashboard({ ...open, isFocused: false }),
      false
    );
    // Session en cours de chargement ou absente.
    assert.equal(
      shouldAutoEnterDashboard({ ...open, isLoading: true }),
      false
    );
    assert.equal(
      shouldAutoEnterDashboard({ ...open, pharmacienId: null }),
      false
    );
    assert.equal(
      shouldAutoEnterDashboard({ ...open, pharmacienId: undefined }),
      false
    );
    // Déjà redirigé pour ce montage : pas de second replace.
    assert.equal(
      shouldAutoEnterDashboard({ ...open, hasRedirected: true }),
      false
    );
  });
});
