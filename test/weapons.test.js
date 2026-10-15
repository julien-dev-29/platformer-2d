import { test, assert } from "vitest";
import { WEAPONS, PASSIVES } from "../src/weapons.js";

test("5 armes avec stats valides", () => {
  assert.deepEqual(Object.keys(WEAPONS).sort(), [
    "grenades",
    "pistol",
    "rail",
    "shotgun",
    "smg",
  ]);
  for (const [id, w] of Object.entries(WEAPONS)) {
    assert.ok(w.magSize > 0, id);
    assert.ok(w.cooldown >= 90, id);
    assert.ok(w.dmg >= 1, id);
  }
  assert.equal(WEAPONS.rail.dmg, 3);
  assert.equal(WEAPONS.rail.pierce, true);
  assert.equal(WEAPONS.grenades.explode, 70);
  assert.ok(PASSIVES.crit && PASSIVES.boots && PASSIVES.heart);
});
