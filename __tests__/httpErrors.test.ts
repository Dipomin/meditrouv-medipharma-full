import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_SERVER_ERROR_LENGTH,
  extractServerError,
  toHttpError,
} from "../app/lib/httpErrors.ts";

describe("httpErrors", () => {
  it("extrait le message explicite du serveur ({ error })", () => {
    assert.equal(
      extractServerError('{"error":"Un compte existe déjà."}'),
      "Un compte existe déjà."
    );
  });

  it("ignore les corps inexploitables (HTML, vide, invalide)", () => {
    assert.equal(extractServerError(""), null);
    assert.equal(extractServerError("   "), null);
    assert.equal(
      extractServerError("<html><body>Erreur</body></html>"),
      null
    );
    assert.equal(extractServerError("{invalide"), null);
    assert.equal(extractServerError('{"data":[]}'), null);
    assert.equal(extractServerError('{"error":500}'), null);
    assert.equal(extractServerError('{"error":"   "}'), null);
  });

  it("borne la longueur du message serveur affiché", () => {
    const long = "x".repeat(MAX_SERVER_ERROR_LENGTH + 50);
    assert.equal(
      extractServerError(JSON.stringify({ error: `  ${long}  ` })),
      "x".repeat(MAX_SERVER_ERROR_LENGTH)
    );
  });

  it("préfère le message serveur en 409 (inscription existante)", () => {
    const error = toHttpError(
      409,
      '{"error":"Un compte existe déjà (numéro d\'ordre ou email)"}'
    );
    assert.equal(
      error.message,
      "Un compte existe déjà (numéro d'ordre ou email)"
    );
    assert.equal(error.kind, "http");
    assert.equal(error.status, 409);
  });

  it("repliant générique quand le serveur n'explique pas l'échec", () => {
    const error = toHttpError(409, "");
    assert.equal(error.message, "Erreur du serveur (409). Veuillez réessayer.");
    assert.equal(error.kind, "http");
    assert.equal(error.status, 409);
  });

  it("préserve kinds et statuts existants (401, 403, 404)", () => {
    const unauthorized = toHttpError(
      401,
      '{"error":"Identifiants invalides"}'
    );
    assert.equal(unauthorized.message, "Identifiants invalides");
    assert.equal(unauthorized.kind, "http");
    assert.equal(unauthorized.status, 401);

    assert.equal(
      toHttpError(401, "").message,
      "Session expirée. Veuillez vous reconnecter."
    );
    assert.equal(toHttpError(403, "").message, "Accès refusé.");
    const notFound = toHttpError(404, "");
    assert.equal(notFound.kind, "not-found");
    assert.equal(notFound.status, 404);
  });
});
