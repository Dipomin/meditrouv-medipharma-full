import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { haversineKm } from "../app/lib/geo.ts";

describe("haversineKm", () => {
  it("retourne 0 pour deux points identiques", () => {
    assert.equal(haversineKm(5.345, -4.024, 5.345, -4.024), 0);
  });

  it("est symétrique", () => {
    const ab = haversineKm(5.345, -4.024, 6.137, 1.212);
    const ba = haversineKm(6.137, 1.212, 5.345, -4.024);
    assert.equal(ab, ba);
  });

  it("retourne ~344 km entre Paris et Londres", () => {
    const distance = haversineKm(48.8566, 2.3522, 51.5074, -0.1278);
    assert.ok(
      distance > 340 && distance < 348,
      `attendu ~344 km, obtenu ${distance}`
    );
  });

  it("retourne ~585 km entre Abidjan et Lomé", () => {
    const distance = haversineKm(5.3453, -4.0244, 6.1375, 1.2123);
    assert.ok(
      distance > 575 && distance < 595,
      `attendu ~585 km, obtenu ${distance}`
    );
  });
});
