import test from "node:test";
import assert from "node:assert/strict";
import { getFamilyInvitationAvailability } from "./family-invitation.ts";

const future = "2026-09-10T00:00:00.000Z";
const now = new Date("2026-09-01T00:00:00.000Z");

test("an unused invitation accepts the matching email regardless of casing", () => {
  assert.equal(getFamilyInvitationAvailability({ acceptedAt: null, expiresAt: future, invitationEmail: " Parent@Example.com ", currentEmail: "parent@example.com", now }), "available");
});

test("an invitation rejects a different signed-in account", () => {
  assert.equal(getFamilyInvitationAvailability({ acceptedAt: null, expiresAt: future, invitationEmail: "parent@example.com", currentEmail: "other@example.com", now }), "email_mismatch");
});

test("used and expired invitations are unavailable", () => {
  assert.equal(getFamilyInvitationAvailability({ acceptedAt: now.toISOString(), expiresAt: future, invitationEmail: "parent@example.com", currentEmail: "parent@example.com", now }), "unavailable");
  assert.equal(getFamilyInvitationAvailability({ acceptedAt: null, expiresAt: "2026-08-31T23:59:59.000Z", invitationEmail: "parent@example.com", currentEmail: "parent@example.com", now }), "unavailable");
});
