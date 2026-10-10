// Méta-progression roguelite : éclats persistants + améliorations (localStorage).
const KEY = 'gungeon-meta-v1';

export const UPGRADES = [
  {id: 'vitality', name: 'Vitalité', desc: '+1 vie max', max: 3, costs: [60, 120, 240]},
  {id: 'pockets', name: 'Poches', desc: '+1 blank de départ', max: 2, costs: [50, 120]},
  {id: 'roll', name: 'Roulade', desc: '+25% invincibilité', max: 2, costs: [60, 140]},
  {id: 'hands', name: 'Mains rapides', desc: 'reload −20%', max: 2, costs: [60, 140]},
];

function blank() {
  return {shards: 0, levels: {vitality: 0, pockets: 0, roll: 0, hands: 0}};
}

function sanitize(raw) {
  const m = blank();
  if (!raw || typeof raw !== 'object') return m;
  if (Number.isFinite(raw.shards) && raw.shards >= 0) m.shards = Math.floor(raw.shards);
  if (raw.levels && typeof raw.levels === 'object') {
    for (const u of UPGRADES) {
      const v = raw.levels[u.id];
      if (Number.isInteger(v)) m.levels[u.id] = Math.max(0, Math.min(u.max, v));
    }
  }
  return m;
}

export function loadMeta() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    return sanitize(JSON.parse(raw));
  } catch {
    return blank();
  }
}

export function saveMeta(m) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sanitize(m)));
  } catch {
    // stockage indisponible : la session continue sans persistance
  }
}

export function addShards(n) {
  const m = loadMeta();
  if (n > 0) {
    m.shards += Math.floor(n);
    saveMeta(m);
  }
  return m.shards;
}

export function levelOf(id) {
  return loadMeta().levels[id] ?? 0;
}

export function costOf(id) {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return null;
  const lvl = levelOf(id);
  if (lvl >= def.max) return null;
  return def.costs[lvl];
}

export function buyUpgrade(id) {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return {ok: false, reason: 'unknown'};
  const m = loadMeta();
  const lvl = m.levels[id] ?? 0;
  if (lvl >= def.max) return {ok: false, reason: 'max'};
  const cost = def.costs[lvl];
  if (m.shards < cost) return {ok: false, reason: 'funds'};
  m.shards -= cost;
  m.levels[id] = lvl + 1;
  saveMeta(m);
  return {ok: true, level: lvl + 1, shards: m.shards};
}

// Bonus appliqués au début de chaque run.
export function metaStats() {
  const m = loadMeta();
  const l = m.levels;
  return {
    lives: 3 + (l.vitality ?? 0),
    maxLives: 5 + (l.vitality ?? 0),
    blanks: 2 + (l.pockets ?? 0),
    dodgeMul: 1 + 0.25 * (l.roll ?? 0),
    reloadMul: Math.pow(0.8, l.hands ?? 0),
    shards: m.shards,
  };
}
