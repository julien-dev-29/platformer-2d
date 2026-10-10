// RNG seedé (mulberry32) : même seed = mêmes salles.
// Le RNG de gameplay (spread, spirales) reste volontairement libre.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedString(seed) {
  return (seed >>> 0).toString(36).toUpperCase().slice(-6).padStart(4, '0');
}

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

// Répartit n points dans un rectangle, avec distances minimales.
// avoid = [[x, y, rayon], ...]. Repli : remplit sans contraintes si bloqué.
function scatter(rng, n, xMin, xMax, yMin, yMax, avoid, minDist) {
  const pts = [];
  let guard = 0;
  while (pts.length < n && guard++ < 80) {
    const p = [xMin + rng() * (xMax - xMin), yMin + rng() * (yMax - yMin)];
    const ok =
      pts.every((q) => dist(q, p) > minDist) &&
      avoid.every((a) => dist([a[0], a[1]], p) > a[2]);
    if (ok) pts.push(p);
  }
  while (pts.length < n) {
    pts.push([xMin + rng() * (xMax - xMin), yMin + rng() * (yMax - yMin)]);
  }
  return pts;
}

// Génère les 3 configs de salles (positions en fractions 0..1).
// Forme identique à l'ancien format en dur (spawnRoom inchangé).
export function generateRun(seed) {
  const rng = makeRng(seed);
  const jit = (base) => Math.round(base * (0.9 + rng() * 0.2));
  const spawn = [0.5, 0.5, 0.2];
  const chest = [0.5, 0.62, 0.14];

  const chasers = (n) =>
    scatter(rng, n, 0.12, 0.88, 0.55, 0.85, [spawn, chest], 0.16);
  const shooters = (n) =>
    scatter(rng, n, 0.2, 0.8, 0.15, 0.3, [spawn], 0.2);

  const rooms = [
    {
      chasers: chasers(2 + (rng() < 0.5 ? 1 : 0)),
      chaserSpeed: 100,
      chaserHP: 2,
      shooters: shooters(1),
      shooterHP: 8,
      interval: jit(1200),
    },
    {
      chasers: chasers(3 + (rng() < 0.5 ? 1 : 0)),
      chaserSpeed: 130,
      chaserHP: 2,
      shooters: shooters(1 + (rng() < 0.25 ? 1 : 0)),
      shooterHP: 8,
      interval: jit(950),
    },
    {
      chasers: chasers(2 + (rng() < 0.5 ? 1 : 0)),
      chaserSpeed: 140,
      chaserHP: 3,
      shooters: [],
      boss: {pos: [0.44 + rng() * 0.12, 0.24], hp: 24},
      interval: jit(1000),
    },
  ];
  const s2weapons = ['rail', 'grenades'];
  const s2passives = ['crit', 'boots', 'heart'];
  rooms.loot = {
    s1: ['shotgun', 'smg'],
    s2weapon: s2weapons[Math.floor(rng() * s2weapons.length)],
    s2passive: s2passives[Math.floor(rng() * s2passives.length)],
  };
  return rooms;
}
