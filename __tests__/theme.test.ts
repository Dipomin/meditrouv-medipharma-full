import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  colors,
  contrastRatio,
  fontSize,
  globalMenuReserve,
  minTouchTarget,
  radius,
  spacing,
  withBottomInset,
  withOpacity,
} from "../app/components/ui/theme.ts";

const HEX = /^#[0-9a-fA-F]{6}$/;
const RGBA = /^rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (0(\.\d+)?|1)\)$/;

describe("theme", () => {
  it("expose des couleurs valides (hex ou rgba)", () => {
    for (const [name, value] of Object.entries(colors)) {
      assert.ok(
        HEX.test(value) || RGBA.test(value),
        `couleur invalide ${name} : ${value}`
      );
    }
  });

  it("conserve l'identité visuelle (vert + orange)", () => {
    assert.equal(colors.primary, "#2E7D32");
    assert.equal(colors.accent, "#ff6a00");
  });

  it("ordonne les échelles (espacements, rayons, tailles)", () => {
    const ascending = (values: readonly number[]): boolean =>
      values.every((value, index) => index === 0 || values[index - 1] < value);
    assert.equal(ascending(Object.values(spacing)), true);
    assert.equal(ascending(Object.values(radius)), true);
    assert.equal(ascending(Object.values(fontSize)), true);
  });

  it("respecte les cibles tactiles et la réserve du menu", () => {
    assert.ok(minTouchTarget >= 44);
    assert.ok(globalMenuReserve > 0);
  });

  it("convertit un hex en rgba (withOpacity)", () => {
    assert.equal(withOpacity("#2E7D32", 0.5), "rgba(46, 125, 50, 0.5)");
    assert.equal(withOpacity("#ff6a00", 1), "rgba(255, 106, 0, 1)");
  });

  it("borne l'alpha de withOpacity entre 0 et 1", () => {
    assert.equal(withOpacity("#000000", -2), "rgba(0, 0, 0, 0)");
    assert.equal(withOpacity("#ffffff", 9), "rgba(255, 255, 255, 1)");
  });

  it("rejette les hex invalides dans withOpacity", () => {
    assert.throws(() => withOpacity("red", 0.5));
    assert.throws(() => withOpacity("#12345", 0.5));
    assert.throws(() => withOpacity("#GGGGGG", 0.5));
  });

  it("calcule le ratio de contraste WCAG (noir/blanc = 21)", () => {
    assert.equal(contrastRatio("#000000", "#ffffff"), 21);
    assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  });

  it("garantit un contraste AA (>= 4.5) pour les paires texte", () => {
    const pairs: [string, string, string][] = [
      [colors.textOnDark, colors.primary, "blanc sur primary"],
      [colors.primary, colors.surface, "primary sur blanc"],
      [colors.primaryDark, colors.surface, "primaryDark sur blanc"],
      [colors.primaryDark, colors.background, "titres sur fond menthe"],
      [colors.text, colors.background, "texte sur fond menthe"],
      [colors.textMuted, colors.surface, "textMuted sur blanc"],
      [colors.textSecondary, colors.surface, "textSecondary sur blanc"],
      [colors.textFaint, colors.surface, "textFaint sur blanc"],
      [colors.accentText, colors.surface, "orange texte sur blanc"],
      [colors.textOnDark, colors.accentText, "blanc sur bouton orange"],
      [colors.danger, colors.surface, "danger sur blanc"],
    ];
    for (const [fg, bg, label] of pairs) {
      assert.ok(
        contrastRatio(fg, bg) >= 4.5,
        `contraste insuffisant ${label} : ${contrastRatio(fg, bg)}`
      );
    }
  });
});

describe("withBottomInset", () => {
  it("grandit menu et réserve de l'inset bas (edge-to-edge)", () => {
    // Régression : sans inset, les boutons système Android recouvraient
    // les libellés du menu fixé en bas d'écran.
    assert.equal(withBottomInset(60, 0), 60);
    assert.equal(withBottomInset(60, 24), 84);
    assert.equal(withBottomInset(globalMenuReserve, 48), 148);
  });

  it("ignore les insets négatifs", () => {
    assert.equal(withBottomInset(60, -8), 60);
  });
});
