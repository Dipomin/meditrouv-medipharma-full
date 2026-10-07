import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { bucketByDay, bucketTotal } from "../app/lib/trends.ts";

describe("trends", () => {
  it("ventile sur N jours (ancien → récent, aujourd'hui inclus)", () => {
    const now = new Date(2026, 0, 10, 12);
    const iso = (day: number, hour: number): string =>
      new Date(2026, 0, day, hour).toISOString();
    const buckets = bucketByDay(
      [
        { createdAt: iso(10, 8) },
        { createdAt: iso(10, 9) },
        { createdAt: iso(8, 8) },
        { createdAt: new Date(2025, 11, 1, 8).toISOString() },
        { createdAt: "xxx" },
      ],
      7,
      now
    );
    assert.equal(buckets.length, 7);
    assert.equal(buckets[6].label, "Auj.");
    assert.equal(buckets[6].count, 2);
    assert.equal(buckets[4].count, 1);
    assert.equal(bucketTotal(buckets), 3);
  });

  it("libelle en jours du mois au-delà de 7 jours", () => {
    const buckets = bucketByDay([], 30, new Date(2026, 0, 10, 12));
    assert.equal(buckets.length, 30);
    assert.equal(buckets[29].label, "Auj.");
    assert.equal(buckets[28].label, "9");
  });

  it("borde la période à au moins 1 jour", () => {
    assert.equal(bucketByDay([], 0).length, 1);
  });
});
