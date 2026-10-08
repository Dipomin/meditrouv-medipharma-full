import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_SPLASH_DURATION_MS,
  SPLASH_DISMISS_BUFFER_MS,
  SPLASH_FADE_MS,
  splashDismissDelay,
  splashPauseDuration,
} from "../app/lib/splash.ts";

describe("temporisation du splash", () => {
  it("expose des constantes strictement positives", () => {
    assert.ok(SPLASH_FADE_MS > 0);
    assert.ok(DEFAULT_SPLASH_DURATION_MS > 0);
    assert.ok(SPLASH_DISMISS_BUFFER_MS > 0);
  });

  it("calcule une pause bornée (jamais négative)", () => {
    assert.equal(splashPauseDuration(3000), 1000);
    assert.equal(splashPauseDuration(2000), 0);
    assert.equal(splashPauseDuration(500), 0);
    assert.equal(splashPauseDuration(-100), 0);
  });

  it("garantit un délai de fermeture strictement positif", () => {
    assert.equal(splashDismissDelay(3000), 3500);
    assert.ok(splashDismissDelay(0) > 0);
    assert.ok(splashDismissDelay(-5000) > 0);
  });

  it("ferme après la fin nominale de l'animation", () => {
    // L'animation nominale dure `duration` ; la fermeture intervient après,
    // pilotée par minuterie (jamais par le rappel de fin d'animation).
    assert.ok(
      splashDismissDelay(DEFAULT_SPLASH_DURATION_MS) >
        DEFAULT_SPLASH_DURATION_MS
    );
  });
});
