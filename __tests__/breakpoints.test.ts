import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  BREAKPOINTS,
  columnsForWidth,
  contentWidthFor,
  getDeviceTypeForWidth,
  isTabletWidth,
} from "../app/utils/breakpoints.ts";

describe("breakpoints", () => {
  it("classe les largeurs (mobile / tablette / desktop)", () => {
    assert.equal(getDeviceTypeForWidth(0), "mobile");
    assert.equal(getDeviceTypeForWidth(BREAKPOINTS.mobile), "mobile");
    assert.equal(getDeviceTypeForWidth(BREAKPOINTS.tablet - 1), "mobile");
    assert.equal(getDeviceTypeForWidth(BREAKPOINTS.tablet), "tablet");
    assert.equal(getDeviceTypeForWidth(BREAKPOINTS.desktop - 1), "tablet");
    assert.equal(getDeviceTypeForWidth(BREAKPOINTS.desktop), "desktop");
    assert.equal(getDeviceTypeForWidth(2000), "desktop");
  });

  it("détecte les largeurs tablette et plus", () => {
    assert.equal(isTabletWidth(767), false);
    assert.equal(isTabletWidth(768), true);
    assert.equal(isTabletWidth(1024), true);
  });

  it("calcule les colonnes de grille (au moins 1)", () => {
    assert.equal(columnsForWidth(390, 160, 10), 2);
    assert.equal(columnsForWidth(768, 160, 10), 4);
    assert.equal(columnsForWidth(100, 160, 10), 1);
  });

  it("plafonne la largeur de contenu sur tablette", () => {
    assert.equal(contentWidthFor(390), 390);
    assert.equal(contentWidthFor(768, 600), 600);
    assert.equal(contentWidthFor(2000, 600), 600);
    assert.equal(contentWidthFor(800, 900), 640);
  });
});
