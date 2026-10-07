import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_TOASTS,
  initialToastState,
  nextToastId,
  toastReducer,
  type ToastItem,
} from "../app/lib/toast.ts";

const toast = (id: string, message = id): ToastItem => ({
  id,
  kind: "info",
  message,
});

describe("toast", () => {
  it("ajoute un toast via show", () => {
    const state = toastReducer(initialToastState, {
      type: "show",
      toast: toast("a"),
    });
    assert.equal(state.items.length, 1);
    assert.equal(state.items[0].id, "a");
  });

  it("ne duplique pas un toast existant (remplace)", () => {
    const shown = toastReducer(initialToastState, {
      type: "show",
      toast: toast("a", "premier"),
    });
    const again = toastReducer(shown, {
      type: "show",
      toast: toast("a", "second"),
    });
    assert.equal(again.items.length, 1);
    assert.equal(again.items[0].message, "second");
  });

  it(`plafonne l'affichage à ${MAX_TOASTS} toasts (les plus récents)`, () => {
    let state = initialToastState;
    for (const id of ["a", "b", "c", "d"]) {
      state = toastReducer(state, { type: "show", toast: toast(id) });
    }
    assert.equal(state.items.length, MAX_TOASTS);
    assert.deepEqual(
      state.items.map((item) => item.id),
      ["b", "c", "d"]
    );
  });

  it("retire un toast via dismiss", () => {
    const shown = toastReducer(initialToastState, {
      type: "show",
      toast: toast("a"),
    });
    const dismissed = toastReducer(shown, { type: "dismiss", id: "a" });
    assert.equal(dismissed.items.length, 0);
  });

  it("ignore le dismiss d'un id inconnu", () => {
    const shown = toastReducer(initialToastState, {
      type: "show",
      toast: toast("a"),
    });
    const same = toastReducer(shown, { type: "dismiss", id: "zzz" });
    assert.equal(same.items.length, 1);
  });

  it("vide tout via clear", () => {
    const shown = toastReducer(initialToastState, {
      type: "show",
      toast: toast("a"),
    });
    assert.equal(toastReducer(shown, { type: "clear" }).items.length, 0);
  });

  it("génère des identifiants uniques", () => {
    const ids = new Set([nextToastId(), nextToastId(), nextToastId()]);
    assert.equal(ids.size, 3);
  });

  it("conserve le libellé d'action (ex. Annuler)", () => {
    const state = toastReducer(initialToastState, {
      type: "show",
      toast: { ...toast("a"), actionLabel: "Annuler" },
    });
    assert.equal(state.items[0].actionLabel, "Annuler");
  });
});
