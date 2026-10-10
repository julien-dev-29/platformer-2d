# Design — Nouveaux ennemis progressifs (Option A data-driven)

Date : 2026-10-10
Statut : validé par user (4/4 sections OK)
Scope : 3 nouveautés (splitter, turret, élites), distribution progressive S1/S2/S3

## 1. Contexte

Run actuel : 3 types (`chaser` vitesse 100 HP2, `shooter` immobile HP8,
boss 24HP 3 phases), patterns visé/éventail/anneau/spirale, spawn seedé
(`src/rng.js`), arsenal à choix en place (5 armes, 1 passif).
Problème : bestiaire fixe, chaque run se combat pareil.

Choix user : slime diviseur + tourelle rotative + élites, distribution
progressive (S1 slime, S2 tourelle, S3 élites + boss). Approche A :
nouveaux `type` dans le système existant (B classes séparées rejeté :
risque régression ; C réduit rejeté : moitié de la variété).

## 2. Comportements & stats (Section 1 validée)

Même pattern que l'existant : `setData('type')`, `hp`, `speed`.

- `splitter` (S1) : HP 3, vitesse 80. Mort → 2 `mini` (HP 1, vitesse 170,
  score 15) à ±20px. Splitter = 40 pts (70 totaux si tout nettoyé).
- `turret` (S2) : HP 6, immobile. Salves rotatives (voir §4), score 75.
- `elite` (S3, flag pas type) : sur chaser/shooter — HP x2 arrondi sup,
  scale 1.3, teinte or, score x2, vitesse +10%. Réutilise le comportement
  du type de base, zéro logique de mouvement nouvelle.
- `mini` : HP 1, vitesse 170, score 15. Meurt à tout (dash, blank, 1 balle).

Interactions conservées : dash 1 dmg, blank 1 dmg, rail perce, grenades AoE.

## 3. Spawn progressif seedé (Section 2 validée)

Extension de `generateRun(seed)`, même seed = même disposition :

- S1 : 1 `splitter` + chasers réduits d'1. Scatter existant, zones
  spawn/chest évitées.
- S2 : 1 `turret` en haut (zone shooters `0.2–0.8 / 0.15–0.3`) + chasers
  normaux.
- S3 : 50% des chasers/shooters en `elite:true` (min 1, seedé) + boss
  inchangé. Renforts de phase : 50% élite (RNG gameplay libre).

`spawnRoom(i)` : branches `splitter` (chaser lent) et `turret` (shooter
immobile, data `angle` propre), flag élite appliqué après création.
Chaser/shooter/boss inchangés.

## 4. Patterns & boucle (Section 3 validée)

- `activeShooters()` : inclut `turret`. Exclut splitter/minis (mêlée).
- Nouveau `fireRotating(s)` : 3 balles, `angle += 0.5` par salve, vitesse
  170, teinte orange. Pas de pulse télégraphié, pas de shake, pas de
  spirale pour la tourelle.
- `update()` : splitter → `moveTo` 80 ; mini → `moveTo` 170 ;
  turret → vélocité 0.
- `damageEnemy(enemy, dmg)` : splitter à hp<=0 → `spawnMinis(x, y)` avant
  `destroy()`. Élites : `bonus * 2` + `floatText` or.
- Blank : inchangé (tue minis, 1 dmg au reste).

## 5. Visuels, score, edge-cases, tests (Section 4 validée)

Visuels (zéro nouvel art, `BootScene.js` untouched, textures teintées) :
splitter `enemy` scale 1.4 vert `0x4ade80` ; mini `enemy` scale 0.7 vert
clair ; turret `shooter` orange `0xfb923c` + rotation sprite vers `angle` ;
élite scale 1.3 + or `0xffd700`.

Score : splitter 40, mini 15, turret 75, élite x2. `shards = score/10`
inchangé.

Fichiers : `src/rng.js` (spawn + flag élite), `src/scenes/GameScene.js`
(types, `fireRotating`, `spawnMinis`, score). Rien d'autre.

Edge-cases : minis clampés + `collideWorldBounds` ; splitter tué par
blank/grenade → minis quand même ; `maxEnemyBullets` 130 inchangé ;
restart reset via `create()` ; minis comptent dans `countActive` (porte
après nettoyage total).

Tests : `node --test` déterminisme spawn (types/positions/élites),
`npm run build` + recette manuelle (split S1, salves rotatives S2,
élites or S3).

Hors-scope : pas de 4e type, pas de phase boss 4, pas de nouveau sprite,
pas de changement aux patterns existants.

## 6. Self-review spec

- Placeholders : aucun TBD/TODO — stats, zones, scores, teintes chiffrés.
- Cohérence : flag élite (pas type) compatible `update`/`shooterLoop` ;
  minis dans `countActive` compatible porte ; tourelle hors spirale
  compatible `maxEnemyBullets`.
- Scope : 3 comportements + spawn + score → 1 plan d'implémentation.
- Ambiguïtés levées : S1 déverrouillé d'emblée pour le splitter (cohérent
  coffres) ; renforts boss en RNG libre documenté comme voulu ;
  `heart` et plantes existantes non impactées.
