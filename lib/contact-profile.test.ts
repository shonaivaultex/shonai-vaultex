import test from "node:test";
import assert from "node:assert/strict";
import { classifyContactProfile, type ContactProfileSettings } from "./contact-profile.ts";

const settings: ContactProfileSettings = {
  version: "contact-v1-beta", quick_upper_ms: 188, balanced_upper_ms: 222,
  junior_drop_height_cm: 20, youth_drop_height_cm: 30, elite_drop_height_cm: 30,
  masters_drop_height_cm: 30, status: "beta",
};

test("CONTACT PROFILE boundary values are stable", () => {
  assert.equal(classifyContactProfile(187, settings).code, "QUICK");
  assert.equal(classifyContactProfile(188, settings).code, "BALANCED");
  assert.equal(classifyContactProfile(221, settings).code, "BALANCED");
  assert.equal(classifyContactProfile(222, settings).code, "FORCE");
});

test("missing DJ is never guessed", () => {
  assert.equal(classifyContactProfile(null, settings).code, "NOT_MEASURED");
});
