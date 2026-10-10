# Design — Arsenal à choix + passifs (Option A)

Date : 2026-10-10
Statut : validé par user (4/4 sections OK)
Scope : moyen ambitieux — loot + 3 armes + 3 passifs, sans gros refactor

## 1. Contexte

Jeu actuel (`src/scenes/GameScene.js`) : twin-stick top-down, 2 armes
`pistol`/`shotgun`, 1 coffre unique salle 1 qui force la pompe, switch `X`,
+1 vie / +1 blank par porte, 3 salles seedées (`src/rng.js`), boss 3 phases.
Problème : toujours le même build.

Objectif prio user : plus de profondeur > fun nerveux / équilibrage / onboarding.
Focus : armes & builds. Budget : moyen.

## 2. Arsenal & slots (Section 1 validée)

Garder système data-driven `weapons`. Ajouter `dmg`, `pierce`, `explode`.

- `pistol` : mag 6, 200ms, dmg 1, précis, speed 500, reload 1000 — référence
- `shotgun` : mag 2, 5 pellets spread 0.36, 700ms, dmg 1/pellet, speed 460, reload 1600
- `smg` NEW : mag 12, 90ms, spread 0.08, dmg 1, speed 550, reload 1200
- `rail` NEW : mag 4, 600ms, speed 900, dmg 3 + `pierce:true`, reload 1400
- `grenades` NEW : mag 3, 800ms, speed 320, dmg 2 + `explode:70px`, reload 1800

Slots : 2 max, `X` switch. Remplacer `shotgunUnlocked:boolean` par
`unlocked:['pistol']`. Ramasser = remplace arme courante, backup gardé.
`ammoByWeapon` conserve munitions. `shoot()` lit `st.dmg/pierce/explode`.
`bulletHitEnemy()` applique `dmg`, si `pierce` ne détruit pas (Set anti-double-hit),
si `explode` : burst + dégâts zone.

## 3. Coffres à choix + loot seedé (Section 2 validée)

1 coffre par salle (S1 + S2, pas en S3). Reuse textures `chest`/`chestOpen`.

Loot :
- S1 fixe : `shotgun` vs `smg` (onboarding stable)
- S2 seedé via `generateRun()` : 1 arme parmi `[rail, grenades]` vs 1 passif parmi `[crit, bottes, coeur]`
- Même seed = même choix (philo `mulberry32` de `rng.js`).

Flow :
1. `spawnRoom(i)` pose coffre sous spawn. Verrouillé tant que `doorOpen==false`
   (alpha + texte « Nettoie la salle »). S1 : déverrouillé dès le départ pour tuto.
2. Overlap quand déverrouillé → flag `choiceOpen` bloque move/shoot/patterns
   (comme `shopOpen`) + modal `[1] option A / [2] option B` + 1 ligne stats.
3. `1/2` → `unlockWeapon()` ou `applyPassive()`, `sfx('chest')`,
   texture `chestOpen`, resume. Nouvelle arme full chargeur.

Edge : restart reset `chestOpened`, `unlocked`, `choiceOpen`. Resize repositionne
modal. Mort pendant modal → ferme modal. `X` avec 1 arme = no-op.

## 4. Passifs — 1 seul par run (Section 3 validée)

`this.passive = null | 'crit' | 'boots' | 'heart'`. Pas de stacking, pas d'inventaire.

- `crit` : 15% x2 dégâts, roll dans `damageEnemy()`, `floatText('CRIT')` jaune
- `boots` : `playerSpeed 260 → 291` (+12%) à l'acquisition
- `heart` : `maxLives+1` et `lives+1` immédiat, respecte plafond `metaStats()`

HUD : ligne `Passif: — / CRIT 15% / BOTTES +12% / COEUR +1` sous `blanksText`,
couleur `#a3e635`. Équilibrage : ~1 hit ou ~15% DPS en plus sur boss 24HP,
pas de choix dominant, pas de toucher HP ennemis ni `meta.js`.

## 5. HUD, fichiers, tests (Section 4 validée)

HUD : `weaponText` montre arme + backup (`POMPE [X] + RAIL`). `ammoText` inchangé.
Modal `depth 60` comme shop.

Fichiers :
- `src/rng.js` : `generateRun()` retourne `loot:{s1,s2}`
- `src/scenes/GameScene.js` : `weapons`+5, `unlocked[]`, `passive`, coffre/salle,
  modal `1/2`, `dmg/pierce/explode`
- Inchangés : `BootScene.js`, `meta.js`, `sfx.js` (reuse sons)

Tests manuels (pas de framework) :
1. Seed fixe → même choix S2
2. S1 clear → coffre déverrouille → `1` pompe full, `X` switch OK
3. S2 passif : crit ~15% sur 50 tirs, boots vitesse, coeur +1 vie
4. Rail traverse 2 chasers, grenade AoE groupe, boss 24HP tombable
5. `npm run build` OK

Hors-scope : raretés, stacking, 3e slot, shop de run.

## 6. Self-review spec

- Placeholders : aucun TBD/TODO — stats, loot, HUD chiffrés ci-dessus.
- Cohérence : 2 slots + remplace courant compatible avec `ammoByWeapon` existant ;
  `choiceOpen` bloque comme `shopOpen` ; loot seedé compatible `generateRun`.
- Scope : 1 seul passif, 3 armes, 2 coffres → tient dans 1 plan d'implémentation.
- Ambiguïtés levées : S1 déverrouillé d'emblée, S2 après clear ; nouvelle arme full ;
  pierce avec Set ; explode sans dégâts joueur.
