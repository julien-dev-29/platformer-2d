# Arsenal à choix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter 3 armes (smg/rail/grenades) + coffres à choix S1/S2 + 1 passif par run sans casser le run 3 salles existant.

**Architecture:** Extraire `WEAPONS`/`PASSIVES` dans `src/weapons.js` pur (testable sans Phaser), étendre `generateRun()` avec `loot` seedé, brancher `dmg/pierce/explode` dans `GameScene`, ajouter modal `1/2` avec flag `choiceOpen`.

**Tech Stack:** Phaser ^4.0.0, Vite ^5.4.0, WebAudio synth maison (`src/sfx.js`), tests via `node --test` intégré (aucune dépendance ajoutée).

## Global Constraints

- 2 slots d'armes max, `X` switch, nouvelle arme remplace l'arme courante, backup gardé.
- 1 seul passif par run, pas de stacking, pas d'inventaire.
- S1 choix fixe `shotgun` vs `smg`, S2 choix seedé 1 arme parmi `[rail, grenades]` vs 1 passif parmi `[crit, boots, heart]`.
- Même seed = même choix (philo `mulberry32` de `src/rng.js`).
- Aucun changement dans `BootScene.js`, `meta.js`, `sfx.js` (reuse textures `chest`/`chestOpen` et son `chest`).
- `npm run build` doit passer après chaque tâche.

---

### Task 1: Loot seedé dans rng.js

**Files:**
- Modify: `src/rng.js`
- Test: `test/loot.test.mjs`

**Interfaces:**
- Consumes: `makeRng(seed)` existant dans `src/rng.js`
- Produces: `generateRun(seed) -> rooms Array + rooms.loot = { s1:[shotgun,smg], s2weapon:string, s2passive:string }`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/loot.test.mjs`
Expected: FAIL with `a.loot is undefined` ou `Cannot read properties of undefined`

- [ ] **Step 3: Write minimal implementation**

```js
// dans src/rng.js, fin de generateRun(seed), avant return :
const rooms = [
  { /* S1 inchangé */ chasers: chasers(2 + (rng() < 0.5 ? 1 : 0)), chaserSpeed: 100, chaserHP: 2, shooters: shooters(1), shooterHP: 8, interval: jit(1200) },
  { /* S2 inchangé */ chasers: chasers(3 + (rng() < 0.5 ? 1 : 0)), chaserSpeed: 130, chaserHP: 2, shooters: shooters(1 + (rng() < 0.25 ? 1 : 0)), shooterHP: 8, interval: jit(950) },
  { /* S3 inchangé */ chasers: chasers(2 + (rng() < 0.5 ? 1 : 0)), chaserSpeed: 140, chaserHP: 3, shooters: [], boss: {pos: [0.44 + rng() * 0.12, 0.24], hp: 24}, interval: jit(1000) },
];
// NOTE: garder les appels chasers()/shooters()/jit() existants dans l'ordre exact,
// ajouter APRES la construction des 3 salles :
const s2weapons = ['rail', 'grenades'];
const s2passives = ['crit', 'boots', 'heart'];
rooms.loot = {
  s1: ['shotgun', 'smg'],
  s2weapon: s2weapons[Math.floor(rng() * s2weapons.length)],
  s2passive: s2passives[Math.floor(rng() * s2passives.length)],
};
return rooms;
```

Conserver les 3 objets salle existants à l'identique, ajouter uniquement le bloc `rooms.loot`. Ne pas réordonner les appels `rng()` avant (sinon les positions changent).

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/loot.test.mjs`
Expected: PASS (1 passed)

- [ ] **Step 5: Commit**

```bash
git add src/rng.js test/loot.test.mjs
git commit -m "feat: loot seede S1/S2 dans generateRun"
```

### Task 2: Extraire WEAPONS + PASSIVES + slots

**Files:**
- Create: `src/weapons.js`
- Modify: `src/scenes/GameScene.js:1-37`
- Test: `test/weapons.test.mjs`

**Interfaces:**
- Consumes: `rooms.loot` de Task 1
- Produces: `WEAPONS` (5 entrées avec `{name,magSize,pellets,spread,cooldown,speed,reload,tint,dmg,pierce,explode}`), `PASSIVES` (`crit,boots,heart`), `GameScene.unlocked:Array`, `GameScene.passive:null|string`

- [ ] **Step 1: Write the failing test**

```js
// test/weapons.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { WEAPONS, PASSIVES } from '../src/weapons.js';

test('5 armes avec stats valides', () => {
  assert.deepEqual(Object.keys(WEAPONS).sort(), ['grenades', 'pistol', 'rail', 'shotgun', 'smg']);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/weapons.test.mjs`
Expected: FAIL with `Cannot find module '../src/weapons.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/weapons.js (nouveau fichier pur, sans Phaser)
export const WEAPONS = {
  pistol:   { name: 'PISTOLET',    magSize: 6,  pellets: 1, spread: 0,    cooldown: 200, speed: 500, reload: 1000, tint: 0x00eeff, dmg: 1, pierce: false, explode: 0 },
  shotgun:  { name: 'POMPE',       magSize: 2,  pellets: 5, spread: 0.36, cooldown: 700, speed: 460, reload: 1600, tint: 0xff9500, dmg: 1, pierce: false, explode: 0 },
  smg:      { name: 'MITRAILLETTE',magSize: 12, pellets: 1, spread: 0.08, cooldown: 90,  speed: 550, reload: 1200, tint: 0x7CFC00, dmg: 1, pierce: false, explode: 0 },
  rail:     { name: 'RAIL',        magSize: 4,  pellets: 1, spread: 0,    cooldown: 600, speed: 900, reload: 1400, tint: 0xc084fc, dmg: 3, pierce: true,  explode: 0 },
  grenades: { name: 'GRENADEUR',   magSize: 3,  pellets: 1, spread: 0,    cooldown: 800, speed: 320, reload: 1800, tint: 0xfde047, dmg: 2, pierce: false, explode: 70 },
};
export const PASSIVES = {
  crit:  { name: 'CRIT 15%',  desc: '15% chance x2 dégâts' },
  boots: { name: 'BOTTES +12%', desc: '+12% vitesse' },
  heart: { name: 'COEUR +1',   desc: '+1 vie max et +1 vie' },
};
```

```js
// src/scenes/GameScene.js:1 — ajouter import
import { WEAPONS, PASSIVES } from '../weapons.js';
// constructor: remplacer le bloc this.weapons = {...} par :
this.weapons = WEAPONS;
this.unlocked = ['pistol'];
this.passive = null;
this.choiceOpen = false;
// create(): après reset armes, remplacer shotgunUnlocked par :
this.unlocked = ['pistol'];
this.passive = null;
this.choiceOpen = false;
```

Garder `currentWeapon`, `ammoByWeapon`, `magSize`, `reloadTime`, `fireCooldown` tels quels. Supprimer `shotgunUnlocked`, le remplacer partout par `unlocked.includes(id)`.

- [ ] **Step 4: Run tests to verify**

Run: `node --test test/weapons.test.mjs test/loot.test.mjs`
Expected: PASS (2 files, 2 passed)
Run: `npm run build`
Expected: `vite build` OK, `dist/` généré

- [ ] **Step 5: Commit**

```bash
git add src/weapons.js src/scenes/GameScene.js test/weapons.test.mjs
git commit -m "feat: extrait WEAPONS/PASSIVES + slots unlocked"
```

### Task 3: Dégâts dmg/pierce/explode

**Files:**
- Modify: `src/scenes/GameScene.js:444-478,583-623` (`shoot`, `bulletHitWall`, `bulletHitEnemy`, `damageEnemy`)
- Test: manuel + `npm run build`

**Interfaces:**
- Consumes: `WEAPONS[id].dmg/pierce/explode` de Task 2
- Produces: `damageEnemy(enemy, dmg)` avec crit hookable, `bullet.getData('hitIds')` pour pierce, `explodeAround(x,y,radius,dmg)` pour grenades

- [ ] **Step 1: Write the failing check (build de référence)**

Run: `npm run build`
Expected: PASS avant modif (référence)

- [ ] **Step 2: Implémenter dmg/pierce/explode (minimal)**

```js
// shoot(): remplacer `this.ammo` decrement + boucle pellets pour stocker dmg :
// après `const b = this.bullets.create(...)` ajouter :
b.setData('dmg', st.dmg);
b.setData('pierce', !!st.pierce);
b.setData('explode', st.explode || 0);
b.setData('hitIds', []);

// bulletHitEnemy(bullet, enemy) :
bulletHitEnemy(bullet, enemy) {
  const explode = bullet.getData('explode') || 0;
  if (explode > 0) {
    const x = bullet.x, y = bullet.y;
    bullet.destroy();
    sfx('hit');
    this.burst(x, y, 0xfde047, 16, 260);
    this.cameras.main.shake(120, 0.004);
    this.enemies.getChildren().forEach((e) => {
      if (!e.active) return;
      if (Phaser.Math.Distance.Between(x, y, e.x, e.y) <= explode) {
        this.damageEnemy(e, bullet.getData('dmg') || 1);
      }
    });
    return;
  }
  const pierce = bullet.getData('pierce');
  if (pierce) {
    const hitIds = bullet.getData('hitIds') || [];
    if (hitIds.includes(enemy)) return;
    hitIds.push(enemy);
    bullet.setData('hitIds', hitIds);
    sfx('hit');
    this.damageEnemy(enemy, bullet.getData('dmg') || 1);
    return; // ne détruit pas
  }
  bullet.destroy();
  if (!enemy.active) return;
  sfx('hit');
  this.damageEnemy(enemy, bullet.getData('dmg') || 1);
}

// damageEnemy(enemy, dmg=1) : remplacer `const hp = (enemy.getData('hp') ?? 2) - 1;` par :
damageEnemy(enemy, dmg = 1) {
  if (!enemy.active || this.hasWon) return;
  const hp = (enemy.getData('hp') ?? 2) - dmg;
  // ... reste identique (destroy, score, hitStop, boss bar, onRoomCleared)
}

// fireBlank(): remplacer `this.damageEnemy(e)` par `this.damageEnemy(e, 1)`
```

- [ ] **Step 3: Vérifier build + playtest ciblé**

Run: `npm run build`
Expected: PASS
Manuel : `npm run dev` → S1 → coffre (encore ancien comportement pompe) → tirer pompe OK → `X` no-op si 1 arme → rail (via console `this.currentWeapon` forcé si besoin) traverse 2 chasers → grenade AoE groupe.

- [ ] **Step 4: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: dmg/pierce/explode sur balles joueur"
```

### Task 4: Coffres à choix S1/S2 + modal 1/2 + HUD armes

**Files:**
- Modify: `src/scenes/GameScene.js:98-130,376-406,764-842` (`create`, `switchWeapon`, `openChest`, `spawnRoom`, `enterDoor`, HUD)
- Test: manuel + `npm run build`

**Interfaces:**
- Consumes: `rooms.loot` (Task 1), `WEAPONS`/`unlocked` (Task 2)
- Produces: `showChoice(optionA, optionB, cb)`, `unlockWeapon(id)`, `chest` par salle avec `locked` flag

- [ ] **Step 1: Implémenter coffre par salle + modal**

```js
// create(): remplacer bloc chest unique par :
this.loot = this.rooms.loot; // rooms vient de Task 1
this.chestOpenedByRoom = {};
this.spawnChestForRoom(0);
// spawnChestForRoom(i) :
spawnChestForRoom(i) {
  if (this.chest) this.chest.destroy();
  if (i > 1) return; // pas de coffre S3 boss
  const W = this.scale.width, H = this.scale.height;
  this.chest = this.physics.add.staticSprite(W / 2, H * 0.62, 'chest');
  this.chestOpened = !!this.chestOpenedByRoom[i];
  if (this.chestOpened) this.chest.setTexture('chestOpen');
  else this.chest.setTexture('chest');
  this.physics.add.overlap(this.player, this.chest, this.openChest, null, this);
}
// openChest(): remplacer tout par choix :
openChest() {
  if (this.chestOpened || this.gameOver || this.hasWon || this.choiceOpen) return;
  if (this.roomIndex === 1 && !this.doorOpen) return; // S2 verrouillé jusqu'au clear (S1 ouvert d'emblée)
  // S1: shotgun vs smg, S2: s2weapon vs s2passive
  const opts = this.roomIndex === 0
    ? [{kind:'weapon', id:this.loot.s1[0]}, {kind:'weapon', id:this.loot.s1[1]}]
    : [{kind:'weapon', id:this.loot.s2weapon}, {kind:'passive', id:this.loot.s2passive}];
  this.showChoice(opts);
}
// showChoice(opts): modal depth 60, flag choiceOpen bloque update/shoot :
showChoice(opts) {
  this.choiceOpen = true;
  const W = this.scale.width, H = this.scale.height;
  const cx = W / 2, cy = H / 2;
  this.choiceBg = this.add.rectangle(cx, cy, 520, 200, 0x0a0a18, 0.95).setScrollFactor(0).setDepth(60);
  this.choiceBg.setStrokeStyle(2, 0xfde047);
  const label = (o, n) => o.kind === 'weapon'
    ? `${n}. ${WEAPONS[o.id].name} — ${WEAPONS[o.id].magSize} coups / ${WEAPONS[o.id].cooldown}ms`
    : `${n}. ${PASSIVES[o.id].name} — ${PASSIVES[o.id].desc}`;
  this.choiceLines = [
    this.add.text(cx, cy - 50, 'COFFRE — choisis [1] ou [2]', { fontSize: '22px', color: '#fde047' }).setOrigin(0.5).setDepth(61),
    this.add.text(cx, cy - 10, label(opts[0], 1), { fontSize: '20px', color: '#fff' }).setOrigin(0.5).setDepth(61),
    this.add.text(cx, cy + 25, label(opts[1], 2), { fontSize: '20px', color: '#fff' }).setOrigin(0.5).setDepth(61),
  ];
  this.pendingChoice = opts;
}
// update(): ajouter après bloc shop 1-4 :
if (this.choiceOpen) {
  if (Phaser.Input.Keyboard.JustDown(this.keysShop.ONE)) this.resolveChoice(0);
  else if (Phaser.Input.Keyboard.JustDown(this.keysShop.TWO)) this.resolveChoice(1);
  return; // bloque move/shoot pendant le choix (placer en début de update après garde player/body)
}
resolveChoice(idx) {
  const opt = this.pendingChoice[idx];
  if (!opt) return;
  if (opt.kind === 'weapon') this.unlockWeapon(opt.id);
  else this.applyPassive(opt.id);
  this.chestOpenedByRoom[this.roomIndex] = true;
  this.chestOpened = true;
  this.chest.setTexture('chestOpen');
  sfx('chest');
  this.choiceBg.destroy();
  this.choiceLines.forEach((t) => t.destroy());
  this.choiceOpen = false;
}
unlockWeapon(id) {
  this.ammoByWeapon[this.currentWeapon] = this.ammo;
  if (!this.unlocked.includes(id)) this.unlocked.push(id);
  if (!this.ammoByWeapon[id]) this.ammoByWeapon[id] = WEAPONS[id].magSize;
  // Si 3 armes débloquées au total, drop la plus ancienne non-courante pour rester à 2 slots :
  while (this.unlocked.length > 2) {
    const drop = this.unlocked.find((u) => u !== this.currentWeapon && u !== id) || this.unlocked.find((u) => u !== id);
    delete this.ammoByWeapon[drop];
    this.unlocked = this.unlocked.filter((u) => u !== drop);
  }
  this.currentWeapon = id;
  const st = WEAPONS[id];
  this.ammo = this.ammoByWeapon[id];
  this.magSize = st.magSize;
  this.reloadTime = Math.round(st.reload * this.reloadMul);
  this.fireCooldown = st.cooldown;
  this.syncWeaponHUD();
}
// enterDoor(): après spawnRoom(roomIndex), ajouter spawnChestForRoom(roomIndex)
// syncWeaponHUD(): afficher backup :
syncWeaponHUD() {
  const st = WEAPONS[this.currentWeapon];
  const backup = this.unlocked.find((u) => u !== this.currentWeapon);
  this.ammoText.setText(`Munitions: ${this.ammo}/${st.magSize}`);
  this.weaponText.setText(backup ? `${st.name} [X] + ${WEAPONS[backup].name}` : `${st.name} [X]`);
}
// switchWeapon(): remplacer garde shotgunUnlocked par cycle unlocked[] :
switchWeapon() {
  if (this.gameOver || this.hasWon || this.reloading || this.choiceOpen) return;
  if (this.unlocked.length < 2) return;
  this.ammoByWeapon[this.currentWeapon] = this.ammo;
  const i = this.unlocked.indexOf(this.currentWeapon);
  this.currentWeapon = this.unlocked[(i + 1) % this.unlocked.length];
  const st = WEAPONS[this.currentWeapon];
  this.ammo = this.ammoByWeapon[this.currentWeapon];
  this.magSize = st.magSize;
  this.reloadTime = Math.round(st.reload * this.reloadMul);
  this.fireCooldown = st.cooldown;
  this.syncWeaponHUD();
}
```

Nettoyage `SHUTDOWN` : détruire `choiceBg`/`choiceLines` comme `shopBg`.

- [ ] **Step 2: Vérifier**

Run: `npm run build`
Expected: PASS
Manuel : S1 coffre ouvert d'emblée → `1` pompe full → `X` switch pistol/pompe → porte → S2 clear → coffre débloqué → `1` arme ou `2` passif → porte → S3 pas de coffre.

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: coffres a choix S1/S2 + modal 1/2"
```

### Task 5: Passifs + HUD final + équilibrage + recette

**Files:**
- Modify: `src/scenes/GameScene.js:105-116,594-623,844-874` (HUD, `damageEnemy` crit, `applyPassive`, `hitEnemy`)
- Test: `npm run build` + recette manuelle complète

**Interfaces:**
- Consumes: `showChoice/resolveChoice` (Task 4), `PASSIVES` (Task 2)
- Produces: `applyPassive(id)`, HUD `passiveText`, run complet S1→S2→S3 rejouable

- [ ] **Step 1: Implémenter passifs**

```js
// create(): après blanksText, ajouter :
this.passiveText = this.add.text(16, 166, 'Passif: —', { fontSize: '20px', color: '#a3e635' }).setScrollFactor(0);
// applyPassive(id) :
applyPassive(id) {
  this.passive = id;
  if (id === 'boots') this.playerSpeed = Math.round(this.playerSpeed * 1.12);
  if (id === 'heart') { this.maxLives += 1; this.lives = Math.min(this.lives + 1, this.maxLives); this.livesText.setText('Vies: ' + this.lives); }
  this.passiveText.setText(`Passif: ${PASSIVES[id].name}`);
}
// damageEnemy(enemy, dmg=1): ajouter roll crit en tête :
damageEnemy(enemy, dmg = 1) {
  if (!enemy.active || this.hasWon) return;
  let final = dmg;
  if (this.passive === 'crit' && Math.random() < 0.15) {
    final = dmg * 2;
    this.floatText(enemy.x, enemy.y, 'CRIT', '#fde047');
  }
  const hp = (enemy.getData('hp') ?? 2) - final;
  // ... suite identique Task 3
}
// update(): étendre garde choiceOpen : `if (this.choiceOpen) { ...choix...; return; }` avant move/shoot,
// et bloquer shoot() : `if (this.choiceOpen) return;` en tête de shoot(), fireBlank(), startDodge().
// enterDoor() récompenses inchangées (+1 vie/+1 blank). handleResize() : repositionner passiveText + modal si ouvert.
```

- [ ] **Step 2: Build + recette complète**

Run: `npm run build`
Expected: PASS
Recette : `npm run dev` → run complet : S1 choix smg → S2 choix rail vs crit → prendre crit → vérifier `Passif: CRIT 15%` → ~15% crits sur 50 tirs → restart `R` → `unlocked=['pistol']`, `passive=null`, `Passif: —` → boots donne vitesse visible → heart +1 vie → boss 24HP tombable avec chaque arme → win + shop + lose + shop OK → resize fenêtre : HUD/modal restent placés.

- [ ] **Step 3: Commit final**

```bash
git add src/scenes/GameScene.js
git commit -m "feat: passifs crit/bottes/coeur + HUD"
```

## Self-Review

- Spec coverage : §2 arsenal → Task 2+3, §3 coffres/loot → Task 1+4, §4 passifs → Task 5, §5 HUD/tests → Task 4+5. Aucun gap.
- Placeholders : aucun TBD/TODO, code complet par étape, commandes exactes (`node --test`, `npm run build`, `npm run dev`).
- Type consistency : `WEAPONS[id] = {name,magSize,pellets,spread,cooldown,speed,reload,tint,dmg,pierce,explode}`, `loot={s1,s2weapon,s2passive}`, `unlocked:Array<string>`, `passive:null|crit|boots|heart`, `damageEnemy(enemy,dmg=1)`, `unlockWeapon(id)`, `applyPassive(id)`, `showChoice/resolveChoice` — noms identiques dans toutes les tâches.
