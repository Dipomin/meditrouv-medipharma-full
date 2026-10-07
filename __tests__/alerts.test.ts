import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  dayKey,
  dayLabel,
  detectNewIds,
  filterAlerts,
  fold,
  groupByDay,
  groupByMedicament,
} from "../app/lib/alerts.ts";
import type { NotificationPharmacien } from "../app/lib/types.ts";

const alert = (
  part: Partial<NotificationPharmacien> & { id: string }
): NotificationPharmacien => ({
  pharmacieId: "ph1",
  pharmacienId: null,
  rechercheId: null,
  demandeId: null,
  medicamentNom: "Doliprane",
  message: "Recherche patient",
  statut: "non_lue",
  whatsappSent: false,
  whatsappStatus: null,
  readAt: null,
  createdAt: "2026-01-10T10:00:00Z",
  ...part,
});

describe("alerts", () => {
  it("calcule les clés jour locales", () => {
    assert.equal(dayKey("2026-03-05T12:00:00Z").length, 10);
    assert.equal(dayKey("xxx"), "");
  });

  it("libelle Aujourd'hui / Hier / date", () => {
    const now = new Date(2026, 0, 10, 12);
    assert.equal(dayLabel("2026-01-10", now), "Aujourd'hui");
    assert.equal(dayLabel("2026-01-09", now), "Hier");
    assert.ok(dayLabel("2026-01-01", now).length > 0);
    assert.equal(dayLabel("", now), "Date inconnue");
  });

  it("regroupe par jour (récent d'abord)", () => {
    const groups = groupByDay(
      [
        alert({ id: "a", createdAt: "2026-01-08T12:00:00Z" }),
        alert({ id: "b", createdAt: "2026-01-10T12:00:00Z" }),
        alert({ id: "c", createdAt: "2026-01-10T13:00:00Z" }),
      ],
      new Date(2026, 0, 10, 14)
    );
    assert.equal(groups.length, 2);
    assert.equal(groups[0].label, "Aujourd'hui");
    assert.deepEqual(
      groups[0].items.map((item) => item.id),
      ["b", "c"]
    );
  });

  it("regroupe par médicament (activité récente d'abord)", () => {
    const groups = groupByMedicament([
      alert({ id: "a", medicamentNom: "Vieux", createdAt: "2026-01-01T12:00:00Z" }),
      alert({ id: "b", medicamentNom: "Récent", createdAt: "2026-01-10T12:00:00Z" }),
      alert({
        id: "c",
        medicamentNom: "Récent",
        statut: "lue",
        createdAt: "2026-01-09T12:00:00Z",
      }),
    ]);
    assert.equal(groups.length, 2);
    assert.equal(groups[0].medicamentNom, "Récent");
    assert.equal(groups[0].count, 2);
    assert.equal(groups[0].unread, 1);
  });

  it("plie casse et accents (fold)", () => {
    assert.equal(fold("Érythromycine"), "erythromycine");
    assert.equal(fold("ÇaDéjà"), "cadeja");
  });

  it("filtre sur nom, message et requête (insensible aux accents)", () => {
    const items = [
      alert({ id: "a", medicamentNom: "Érythromycine" }),
      alert({ id: "b", message: "rupture de Doliprane" }),
      alert({
        id: "c",
        medicamentNom: "X",
        message: "Y",
        recherche: { id: "r", query: "amox", commune: null, createdAt: "" },
      }),
    ];
    assert.deepEqual(
      filterAlerts(items, "erythro").map((item) => item.id),
      ["a"]
    );
    assert.deepEqual(
      filterAlerts(items, "DOLIPRANE").map((item) => item.id),
      ["b"]
    );
    assert.deepEqual(
      filterAlerts(items, "amox").map((item) => item.id),
      ["c"]
    );
    assert.equal(filterAlerts(items, "").length, 3);
  });

  it("détecte les nouvelles non lues", () => {
    const items = [
      alert({ id: "a", statut: "lue" }),
      alert({ id: "b" }),
      alert({ id: "c" }),
    ];
    assert.deepEqual(detectNewIds(["a", "b"], items), ["c"]);
    assert.deepEqual(detectNewIds(new Set(["a", "b", "c"]), items), []);
  });
});
