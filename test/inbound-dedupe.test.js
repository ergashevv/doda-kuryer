import assert from "node:assert/strict";
import { test } from "node:test";
import {
  allowStartCommand,
  inboundDedupeMiddleware,
} from "../src/bk/inboundDedupe.js";

test("allowStartCommand: second call within window is false", () => {
  const uid = 900001;
  assert.equal(allowStartCommand(uid), true);
  assert.equal(allowStartCommand(uid), false);
});

test("inboundDedupeMiddleware: same update_id does not call next twice", async () => {
  const mw = inboundDedupeMiddleware();
  let n = 0;
  const ctx = { update: { update_id: 424242 } };
  await mw(ctx, async () => {
    n++;
  });
  await mw(ctx, async () => {
    n++;
  });
  assert.equal(n, 1);
});
