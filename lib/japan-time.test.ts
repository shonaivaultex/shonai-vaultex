import test from "node:test";
import assert from "node:assert/strict";
import { addMonthsToMonthKey, japanMonthKey } from "./japan-time.ts";

test("FAMILY month follows Japan time at the UTC month boundary", () => {
  assert.equal(japanMonthKey("2026-08-31T14:59:00.000Z"), "2026-08");
  assert.equal(japanMonthKey("2026-08-31T15:00:00.000Z"), "2026-09");
});

test("month arithmetic remains stable across years", () => {
  assert.equal(addMonthsToMonthKey("2026-01", -1), "2025-12");
  assert.equal(addMonthsToMonthKey("2026-12", 1), "2027-01");
});
