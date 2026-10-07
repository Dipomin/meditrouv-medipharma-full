import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  OFFLINE_MESSAGE,
  isOfflineError,
  offlineAwareMessage,
} from "../app/lib/offline.ts";

describe("offline", () => {
  it("expose un message hors-connexion non vide", () => {
    assert.ok(OFFLINE_MESSAGE.length > 10);
  });

  it("détecte les erreurs réseau typées (kind network/timeout)", () => {
    assert.equal(isOfflineError({ kind: "network" }), true);
    assert.equal(isOfflineError({ kind: "timeout" }), true);
    assert.equal(isOfflineError({ kind: "http", status: 500 }), false);
    assert.equal(isOfflineError({ kind: "not-found" }), false);
  });

  it("détecte les erreurs fetch natives par leur message", () => {
    assert.equal(isOfflineError(new Error("Network request failed")), true);
    assert.equal(isOfflineError(new TypeError("fetch failed")), true);
    assert.equal(isOfflineError(new Error("Erreur inattendue")), false);
  });

  it("ignore les valeurs non-erreur", () => {
    assert.equal(isOfflineError(null), false);
    assert.equal(isOfflineError(undefined), false);
    assert.equal(isOfflineError("Network request failed"), false);
    assert.equal(isOfflineError(42), false);
  });

  it("substitue le message offline dans offlineAwareMessage", () => {
    assert.equal(
      offlineAwareMessage({ kind: "network" }, "Chargement impossible."),
      OFFLINE_MESSAGE
    );
    assert.equal(
      offlineAwareMessage(new Error("Network request failed"), "Envoi impossible."),
      OFFLINE_MESSAGE
    );
    assert.equal(
      offlineAwareMessage({ kind: "http" }, "Chargement impossible."),
      "Chargement impossible."
    );
  });
});
