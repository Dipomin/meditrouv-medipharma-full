import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isValidOptionalEmail,
  isValidOtpFormat,
  isValidPersonName,
  normalizePhone,
  parsePhone,
} from "../app/lib/validation.ts";

describe("validation", () => {
  it("normalise les numéros (espaces, points, tirets, parenthèses)", () => {
    assert.equal(normalizePhone("+225 07.87-22 52 04"), "+2250787225204");
    assert.equal(normalizePhone("(771) 234-56"), "77123456");
  });

  it("accepte les numéros plausibles (8 à 15 chiffres, + optionnel)", () => {
    assert.equal(parsePhone("77123456"), "77123456");
    assert.equal(parsePhone("+2250787225204"), "+2250787225204");
    assert.equal(parsePhone("  77123456  "), "77123456");
  });

  it("rejette les numéros invalides", () => {
    assert.equal(parsePhone("1234567"), null);
    assert.equal(parsePhone("1234567890123456"), null);
    assert.equal(parsePhone("not-a-number"), null);
    assert.equal(parsePhone(""), null);
    assert.equal(parsePhone("12 34"), null);
  });

  it("valide les e-mails optionnels (vide accepté)", () => {
    assert.equal(isValidOptionalEmail(""), true);
    assert.equal(isValidOptionalEmail("  "), true);
    assert.equal(isValidOptionalEmail("a@b.co"), true);
    assert.equal(isValidOptionalEmail("sans-arobase"), false);
    assert.equal(isValidOptionalEmail("a@b"), false);
  });

  it("valide le format OTP (exactement 6 chiffres)", () => {
    assert.equal(isValidOtpFormat("123456"), true);
    assert.equal(isValidOtpFormat("12345"), false);
    assert.equal(isValidOtpFormat("1234567"), false);
    assert.equal(isValidOtpFormat("abcdef"), false);
    assert.equal(isValidOtpFormat(""), false);
  });

  it("valide les noms de personne (au moins 2 caractères non blancs)", () => {
    assert.equal(isValidPersonName("Dr Test"), true);
    assert.equal(isValidPersonName("Al"), true);
    assert.equal(isValidPersonName("A"), false);
    assert.equal(isValidPersonName("   "), false);
  });
});
