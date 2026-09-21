import { test } from "node:test";
import assert from "node:assert/strict";
import { followingWeek, newPlans } from "./calendar-plan.ts";

const plan = { entry_date: "2026-12-27", entry_type: "school_practice", title: "学校練習", starts_at: null, ends_at: null, all_day: true };
test("copy crosses year boundary", () => {
  assert.equal(followingWeek(plan).entry_date, "2027-01-03");
});
test("skip duplicates in storage and within the batch", () => {
  assert.equal(newPlans([plan, plan], []).length, 1);
  assert.equal(newPlans([plan], [plan]).length, 0);
});
test("retain distinct plans on the same day", () => {
  assert.equal(newPlans([plan, { ...plan, title: "補強" }], []).length, 2);
});
test("copy timed plans preserves Japan time and duration", () => {
  const result = followingWeek({ ...plan, all_day: false, starts_at: "2026-12-27T17:00:00+09:00", ends_at: "2026-12-27T19:00:00+09:00" });
  assert.equal(result.starts_at, "2027-01-03T08:00:00.000Z");
  assert.equal(result.ends_at, "2027-01-03T10:00:00.000Z");
  assert.equal(newPlans([result], [{ ...result, starts_at: "2027-01-03T17:00:00+09:00" }]).length, 0);
});
