import { test, expect } from "vitest";
import { RunState } from "../src/state/runState";

test("takehit", () => {
  const runState = new RunState({ lives: 5, blanks: 7 });

  expect(runState.takeHit()).toBe(4);

  const blanks = runState.addBlank(3);

  expect(runState.blanks).toBe(3);
});
