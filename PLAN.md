# PLAN — Refactor GameScene (spaghetti → systèmes)

Objectif : passer `src/scenes/GameScene.js` (~1432 lignes, ~40 méthodes) à ~250 lignes d'orchestration, sans changer le gameplay. Sauf 1 bug fix volontaire : `blanks` écrasé.

Décisions verrouillées :
1. Scope complet
2. Archi en classes `XxxSystem(scene, run, deps)`
3. Fix bug `blanks = 2` qui écrase `meta.blanks` (GameScene.js:93 vs :104)
4. HUD « au mieux » : container responsive fixe, suppression de `handleResize` manuel

---

## 0. État des lieux (point de départ)

Sain (ne pas toucher sauf import config) :
- `src/rng.js` (87l) — seed, scatter, generateRun
- `src/meta.js` (93l) — shards, UPGRADES, metaStats
- `src/weapons.js` (13l) — WEAPONS, PASSIVES
- `src/sfx.js` (131l) — WebAudio blips
- `src/main.js` (26l) — config Phaser

À refactorer :
- `src/scenes/GameScene.js` — god-class : init dupliquée, update 145 lignes (361-505), combat dispersé (shoot, damage, patterns, boss), UI dupliquée (HUD + choice + shop), rooms/transitions mélangées
- `src/scenes/BootScene.js` (243l) — `makePlaceholders()` monolithe, 10 textures en une méthode

Tests existants : `test/loot.test.mjs`, `test/weapons.test.mjs` (`node --test`)

---

## 1. Architecture cible

```
src/
  config.js
  state/runState.js
  systems/
    effects.js
    hud.js
    player.js
    weaponsSystem.js
    patterns.js
    enemies.js
    boss.js
    chest.js
    shop.js
    rooms.js
  textures/
    index.js
    player.js / enemy.js / shooter.js / boss.js / chest.js / bullet.js / spark.js / wall.js
  scenes/
    BootScene.js (allégé)
    GameScene.js (~250l, orchestrateur)
```

Conventions :
- Chaque System : `constructor(scene, run, deps)` — pas d'état dupliqué, lit/écrit via `run: RunState`
- Logique pure (dégâts, slots d'armes, coûts) reste hors Phaser → testable `node:test`
- `shooterTimer / spiralTimer` + cleanup `SHUTDOWN` restent dans GameScene (ne pas déplacer)
- `physics.pause()` pendant hitStop/choice/win : exposer `isBlocked()` via RunState/Effects

---

## 2. Étape 0 — Filet de sécurité

- [ ] `git checkout -b refactor/declutter-gamescene`
- [ ] `npm test` vert
- [ ] `npm run dev` + screenshots S1/S2/S3 pour comparaison
- [ ] Règle : 1 étape = 1 commit jouable

---

## 3. Étape 1 — `src/config.js` (30 min)

Centraliser tout le tuning actuellement en dur dans GameScene 17-30 + valeurs dispersées.

```js
// src/config.js
export const BALANCE = {
  playerSpeed: 260,
  dodgeSpeed: 600,
  dodgeTime: 180,
  baseDodgeInv: 300,
  shooterInterval: 1200,
  spiralInterval: 130,
  maxEnemyBullets: 130,
  maxBlanksBase: 3,
};
export const UI = {
  depths: { hud: 40, shop: 50, choice: 60 },
  colors: { hudWeapon: "#7dd3fc", hudBlank: "#f0abfc", hudPassive: "#a3e635" },
};
```

- [ ] Lister via `grep -n "260\|600\|180\|300\|1200\|130" src/scenes/GameScene.js`
- [ ] Vérif : `node -e "import('./src/config.js').then(m=>console.log(m.BALANCE))"`
- [ ] Commit (GameScene l'utilisera étape 3+)

---

## 4. Étape 2 — `src/state/runState.js` + fix blanks (1h)

Remplace la double init constructor 17-44 + create 86-118.

```js
// src/state/runState.js
import { WEAPONS } from "../weapons.js";

export class RunState {
  constructor(meta) {
    this.lives = meta.lives;
    this.maxLives = meta.maxLives;
    this.blanks = meta.blanks;      // FIX : plus écrasé par `= 2`
    this.maxBlanks = 3;
    this.currentWeapon = "pistol";
    this.unlocked = ["pistol"];
    this.ammoByWeapon = { pistol: WEAPONS.pistol.magSize };
    this.ammo = WEAPONS.pistol.magSize;
    this.passive = null;
    this.score = 0;
    this.runShards = 0;
    this.roomIndex = 0;
    this.doorOpen = false;
    this.choiceOpen = false;
    this.shopOpen = false;
    // + reloadMul, dodgeMul depuis meta, magSize, fireCooldown, etc.
  }
  takeHit() { this.lives -= 1; return this.lives; }
  heal(n) { this.lives = Math.min(this.lives + n, this.maxLives); }
  addBlank(n) { this.blanks = Math.min(this.blanks + n, this.maxBlanks); }
  addScore(n) { this.score += n; }
  // switchWeapon(), unlockWeapon(id) avec logique 2 slots (cf GameScene 719-725)
}
```

Actions :
- [ ] Créer classe + déplacer init
- [ ] GameScene : `this.run = new RunState(metaStats())`, remplacer `this.lives` → `this.run.lives` (grep `this\.(lives|blanks|ammo|unlocked|currentWeapon|passive|score|roomIndex|doorOpen|choiceOpen)` ~80 hits, par paquets)
- [ ] Créer `test/runState.test.mjs` : init meta, takeHit, addBlank cappé, unlock garde 2 slots
- [ ] `npm test` + `npm run dev` (vies/blanks méta OK)
- [ ] Commit

---

## 5. Étape 3 — `src/systems/effects.js` (30 min)

Copie à l'identique GameScene 507-552.

```js
export class EffectsSystem {
  constructor(scene) { this.s = scene; this.dangerSlow = false; this.hitStopping = false; }
  burst(x, y, tint, n = 12, speed = 220) { /* ... */ }
  floatText(x, y, str, color = "#fde047") { /* ... */ }
  hitStop(ms) { /* ... */ }
  setDanger(on) { /* ... */ }
}
```

- [ ] `this.fx = new EffectsSystem(this)` dans create(), remplacer `this.burst` → `this.fx.burst` (idem floatText/hitStop/setDanger)
- [ ] Playtest : tuer chaser → hitStop + particules
- [ ] Commit

---

## 6. Étape 4 — `src/systems/hud.js` (2h)

Remplace HUD 127-186 + `handleResize` 318-359 + `syncWeaponHUD` 576-583.

```js
export class HudSystem {
  constructor(scene, run) { this.s = scene; this.run = run; }
  create() {
    this.root = this.s.add.container(0, 0).setDepth(40).setScrollFactor(0);
    // crée scoreText, livesText, ammoText, weaponText, blanksText, passiveText,
    // shardsText, roomText, doorText, bossBarBg/Fill/Label → ajoute au root
  }
  syncAll() { /* ... */ }
  syncLives() { /* ... */ }
  syncAmmo() { /* ... */ }
  // updateBossBar(boss), showBossBar(), hideBossBar()
  layout(w, h) { /* seul endroit avec setPosition : left x=16, right x=W-16, center x=W/2 */ }
}
```

- [ ] 4a : déplacement sans changer positions → jeu identique
- [ ] 4b : `scale.on('resize', (gs)=>hud.layout(gs.width, gs.height))`, supprimer positionnement champ par champ. `doorText/winText/choice/shop` centrés via `layoutCenter()`
- [ ] Vérif resize fenêtre, pas d'exception `wallTop null`
- [ ] Commit

---

## 7. Étape 5 — Combat (3h, ordre imposé)

### 5a. `weaponsSystem.js`
Déplace GameScene 572-813 : `currentStats, switch, unlock, applyPassive, startReload, shoot, fireBlank`
- Test : X switch, R reload manuel/auto, E blank efface tout + i-frame 1s

### 5b. `patterns.js`
Déplace 873-974 : `activeShooters, shooterLoop, spawnEnemyBullet, fireAimed, fireSpread, fireRing, fireSpiral`
- Garder cap `maxEnemyBullets` + pulse télégraphié 120ms
- Test : S1 tireur seul → aimed/spread/ring visibles

### 5c. `enemies.js` + `boss.js`
- `enemies.js` : `spawnRoom, damageEnemy, hitByEnemyBullet, hitEnemy, bulletHitEnemy/Wall` (976-1090, 1184-1239, 1392-1431)
- `boss.js` : `bossPhaseColor, applyBossTint, checkBossPhase, show/hide/updateBossBar` (1092-1182)
- `damageEnemy` appelle `onRoomCleared + hitStop + floatText` → injecter `deps { fx, hud, onCleared }`
- Test : boss P1→P2→P3, renfort chaser, barre couleur change

Commits séparés 5a / 5b / 5c.

---

## 8. Étape 6 — Fin GameScene (2h)

### 6a. `player.js`
Mouvement ZQSD/WASD + normalisation SQRT1_2 + `startDodge` + visée souris (380-425, 554-570)

### 6b. `chest.js`
`spawnChestForRoom, openChest, showChoice, closeChoice, resolveChoice` (600-711). Garder guard `roomIndex===1 && !doorOpen`.

### 6c. `shop.js` + `rooms.js`
- shop : `showShop, refreshShop, buyFromShop, creditRun` (1265-1343)
- rooms : `onRoomCleared, enterDoor` (1241-1264, 1345-1390) — fade 250ms + `invincibleUntil+1500` + récompenses `lives+1, blanks+1, ammo=magSize`

Cible GameScene finale (~250l) :
```js
create() {
  this.run = new RunState(metaStats());
  this.fx = new EffectsSystem(this);
  this.hud = new HudSystem(this, this.run); this.hud.create();
  // player, weapons, enemies, patterns, boss, chest, shop, rooms...
  // walls, doorZone overlap, timers, inputs, SHUTDOWN cleanup
}
update(t) { /* guards choice/gameOver → player.move → enemies.ai → cleanup hors-écran */ }
```

---

## 9. Étape 7 — `BootScene` / textures (45 min)

```
src/textures/index.js       → makeAll(scene)
src/textures/player.js      → export function drawPlayer(g)
src/textures/enemy.js       → drawEnemy
src/textures/shooter.js / boss.js / chest.js / bullet.js / spark.js / wall.js
```

- [ ] Découper `makePlaceholders()` (BootScene 13-242) sans changer visuel
- [ ] `BootScene.create()` devient `makeAll(this); this.scene.start('Game')`
- [ ] Commit

---

## 10. Vérification finale

- [ ] `npm test` vert
- [ ] `npm run build` OK
- [ ] Playtest :
  - [ ] S1 : bouger, tirer, reload auto/manuel, coffre [1]/[2], clear → porte verte
  - [ ] Porte → S2 : +1 vie +1 blank, recharge full, invincible 1.5s
  - [ ] S2 : coffre arme vs passif, clear → porte
  - [ ] S3 : intro boss, P2/P3 annonces, blank efface, mort → GAME OVER + shards, win → boutique
  - [ ] Boutique 1-4 achète, persiste après R ; M mute ; Shift dodge i-frames + dash offensif ; resize sans crash
- [ ] `git diff --stat` : GameScene < 350 lignes

---

## 11. Ordre de commits

1. `config`
2. `runState + test` (avec fix blanks)
3. `effects`
4. `hud` (4a puis 4b)
5. `weapons`
6. `patterns`
7. `enemies/boss`
8. `player/chest/shop/rooms`
9. `textures`
10. `cleanup`

Pièges : timers + SHUTDOWN restent dans GameScene ; `physics.pause()` guards à conserver ; ne jamais changer WEAPONS/balance dans ce refactor.
