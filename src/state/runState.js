import { WEAPONS } from "../weapons.js";

export class RunState {
  constructor(meta) {
    this.lives = meta.lives;
    this.maxLives = meta.maxLives;
    this.blanks = meta.blanks; // FIX : plus écrasé par `= 2`
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
  takeHit() {
    this.lives -= 1;
    return this.lives;
  }
  heal(n) {
    this.lives = Math.min(this.lives + n, this.maxLives);
  }
  addBlank(n) {
    this.blanks = Math.min(this.blanks + n, this.maxBlanks);
  }
  addScore(n) {
    this.score += n;
  }
  // switchWeapon(), unlockWeapon(id) avec logique 2 slots (cf GameScene 719-725)
}
