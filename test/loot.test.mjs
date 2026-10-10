// test/loot.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRun } from '../src/rng.js';

test('loot S1 fixe et S2 seede deterministe', () => {
  const a = generateRun(12345);
  const b = generateRun(12345);
  assert.deepEqual(a.loot.s1, ['shotgun', 'smg']);
  assert.ok(['rail', 'grenades'].includes(a.loot.s2weapon));
  assert.ok(['crit', 'boots', 'heart'].includes(a.loot.s2passive));
  assert.deepEqual(a.loot, b.loot);
});
