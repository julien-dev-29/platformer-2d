import Phaser from 'phaser';
import { initAudio, toggleMute, sfx } from '../sfx.js';
import { UPGRADES, addShards, buyUpgrade, costOf, levelOf, metaStats } from '../meta.js';
import { generateRun, seedString } from '../rng.js';
import { WEAPONS, PASSIVES } from '../weapons.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
    this.playerSpeed = 260;
    this.bulletSpeed = 500;
    this.fireCooldown = 200;
    this.lastFired = 0;
    this.magSize = 6;
    this.reloadTime = 1000;
    this.dodgeSpeed = 600;
    this.dodgeTime = 180;
    this.dodgeInvincibleTime = 300;
    this.shooterInterval = 1200;
    this.spiralInterval = 130;
    this.spiralAngle = 0;
    this.maxEnemyBullets = 130;
    this.patternIndex = 0;
    // Armes : stats par arme, munitions conservées au switch
    this.weapons = WEAPONS;
    this.unlocked = ['pistol'];
    this.passive = null;
    this.choiceOpen = false;
    this.currentWeapon = 'pistol';
    this.ammoByWeapon = { pistol: 6, shotgun: 2 };
    this.blanks = 2;
    this.maxLives = 5;
    this.maxBlanks = 3;
    this.roomIndex = 0;
    this.doorOpen = false;
    this.transitioning = false;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;
    this.physics.world.gravity.y = 0;
    this.physics.world.setBounds(0, 0, W, H);
    // Reset échelles de temps (ralenti danger d'un run précédent)
    this.time.timeScale = 1;
    this.physics.world.timeScale = 1;
    this.dangerSlow = false;
    this.hitStopping = false;

    // Audio : init au premier geste (autoplay), M = mute
    this.input.once('pointerdown', initAudio);
    this.input.keyboard.once('keydown', initAudio);

    // Arène : 4 murs
    this.walls = this.physics.add.staticGroup();
    this.wallTop = this.walls.create(W / 2, 16, 'ground').setScale(W / 64, 1).refreshBody();
    this.wallBottom = this.walls.create(W / 2, H - 16, 'ground').setScale(W / 64, 1).refreshBody();
    this.wallLeft = this.walls.create(16, H / 2, 'ground').setScale(1, H / 32).refreshBody();
    this.wallRight = this.walls.create(W - 16, H / 2, 'ground').setScale(1, H / 32).refreshBody();

    // Joueur au centre
    this.player = this.physics.add.sprite(W / 2, H / 2, 'player');
    this.player.setCollideWorldBounds(true);
    if (this.player.body) this.player.body.allowGravity = false;
    this.physics.add.collider(this.player, this.walls);

    this.score = 0;
    this.hasWon = false;
    this.gameOver = false;
    // Stats de méta-progression (reset complet à chaque run)
    const meta = metaStats();
    this.lives = meta.lives;
    this.maxLives = meta.maxLives;
    this.blanks = meta.blanks;
    this.dodgeInvincibleTime = Math.round(300 * meta.dodgeMul);
    this.reloadMul = meta.reloadMul;
    this.shopOpen = false;
    this.shardsCredited = false;
    this.runShards = 0;
    this.roomIndex = 0;
    this.doorOpen = false;
    this.transitioning = false;
    this.patternIndex = 0;
    this.spiralAngle = 0;
    this.blanks = 2;
    // Reset armes (le restart ne repasse pas par le constructor)
    this.currentWeapon = 'pistol';
    this.ammoByWeapon = { pistol: 6, shotgun: 2 };
    this.unlocked = ['pistol'];
    this.passive = null;
    this.choiceOpen = false;
    this.magSize = 6;
    this.reloadTime = Math.round(1000 * this.reloadMul);
    this.fireCooldown = 200;
    this.ammo = 6;
    this.reloading = false;
    this.isDodging = false;
    this.invincibleUntil = 0;

    // Run procédural : nouvelle seed à chaque create() (= chaque run)
    this.seed = (Date.now() ^ ((Math.random() * 0xffffffff) >>> 0)) >>> 0;
    this.seedShort = seedString(this.seed);

    // Configs des 3 salles générées (positions relatives)
    this.rooms = generateRun(this.seed);

    this.scoreText = this.add.text(16, 36, 'Score: 0', { fontSize: '20px', color: '#fff' }).setScrollFactor(0);
    this.livesText = this.add.text(16, 62, `Vies: ${this.lives}`, { fontSize: '20px', color: '#fff' }).setScrollFactor(0);
    this.ammoText = this.add.text(16, 88, `Munitions: 6/6`, { fontSize: '20px', color: '#fff' }).setScrollFactor(0);
    this.weaponText = this.add.text(16, 114, 'PISTOLET [X]', { fontSize: '20px', color: '#7dd3fc' }).setScrollFactor(0);
    this.blanksText = this.add.text(16, 140, `Blanks: ${this.blanks} [E]`, { fontSize: '20px', color: '#f0abfc' }).setScrollFactor(0);
    this.shardsText = this.add.text(W - 16, 62, `◆ ${meta.shards}`, { fontSize: '20px', color: '#fde047' }).setOrigin(1, 0).setScrollFactor(0);
    this.roomText = this.add.text(W - 16, 36, `SALLE 1/3 · #${this.seedShort}`, { fontSize: '20px', color: '#fdba74' }).setOrigin(1, 0).setScrollFactor(0);
    this.doorText = this.add.text(W / 2, 52, '↑ PORTE OUVERTE — MONTE ↑', { fontSize: '20px', color: '#4ade80' }).setOrigin(0.5).setVisible(false).setScrollFactor(0);
    // Barre HP du boss (cachée hors S3)
    this.bossBarBg = this.add.rectangle(W / 2, 22, 324, 16, 0x111111).setOrigin(0.5).setVisible(false).setScrollFactor(0);
    this.bossBarFill = this.add.rectangle(W / 2 - 160, 22, 320, 12, 0xa855f7).setOrigin(0, 0.5).setVisible(false).setScrollFactor(0);
    this.bossBarLabel = this.add.text(W / 2, 22, 'GRAND MAGE', { fontSize: '12px', color: '#fff' }).setOrigin(0.5).setVisible(false).setScrollFactor(0);

    // Zone de porte au mur nord
    this.doorZone = this.add.zone(W / 2, 44, 150, 48);
    this.physics.add.existing(this.doorZone, true);
    this.physics.add.overlap(this.player, this.doorZone, this.enterDoor, null, this);

    // Coffre de la pompe, sous le spawn (salle 1)
    this.chest = this.physics.add.staticSprite(W / 2, H * 0.62, 'chest');
    this.chestOpened = false;
    this.physics.add.overlap(this.player, this.chest, this.openChest, null, this);

    // Ennemis de la salle 1
    this.enemies = this.physics.add.group();
    this.spawnRoom(0);
    this.physics.add.collider(this.enemies, this.walls);
    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);

    // Balles ennemies
    this.enemyBullets = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.collider(this.enemyBullets, this.walls, (b) => b.destroy());
    this.physics.add.overlap(this.player, this.enemyBullets, this.hitByEnemyBullet, null, this);
    this.patternIndex = 0;
    this.shooterTimer = this.time.addEvent({
      delay: this.shooterInterval,
      loop: true,
      callback: this.shooterLoop,
      callbackScope: this,
    });
    this.spiralTimer = this.time.addEvent({
      delay: this.spiralInterval,
      loop: true,
      callback: this.fireSpiral,
      callbackScope: this,
    });

    // Voile psychédélique : teinte dérivante derrière tout
    this.psyOverlay = this.add.rectangle(0, 0, W, H, 0xff00ff).setOrigin(0).setAlpha(0.07).setDepth(-1);

    // Projectiles vers la souris
    this.bullets = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.collider(this.bullets, this.walls, this.bulletHitWall, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.bulletHitEnemy, null, this);
    this.input.on('pointerdown', this.shoot, this);

    // Contrôles : ZQSD/AZERTY + WASD/QWERTY + souris, R reload, Shift/Espace dodge, E blank, X switch, M son
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysWASD = this.input.keyboard.addKeys('W,A,S,D,Z,Q,R,E,X,M,SPACE,SHIFT');
    this.keysShop = this.input.keyboard.addKeys('ONE,TWO,THREE,FOUR');

    this.helpText = this.add.text(16, 16, 'ZQSD/WASD bouger | Clic tirer | R recharger | Shift roulade | E blank | X arme | M son', { fontSize: '14px', color: '#aaa' }).setScrollFactor(0);
    this.soundText = this.add.text(W - 16, H - 16, '♪ ON [M]', { fontSize: '16px', color: '#aaa' }).setOrigin(1, 1).setScrollFactor(0);

    this.scale.off('resize', this.handleResize, this);
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.handleResize, this);
      this.input.off('pointerdown', this.shoot, this);
      if (this.shooterTimer) this.shooterTimer.remove(false);
      if (this.spiralTimer) this.spiralTimer.remove(false);
    });
  }

  handleResize(gameSize) {
    const W = gameSize.width;
    const H = gameSize.height;
    this.physics.world.setBounds(0, 0, W, H);
    if (!this.wallTop) return;
    this.wallTop.setPosition(W / 2, 16).setScale(W / 64, 1).refreshBody();
    this.wallBottom.setPosition(W / 2, H - 16).setScale(W / 64, 1).refreshBody();
    this.wallLeft.setPosition(16, H / 2).setScale(1, H / 32).refreshBody();
    this.wallRight.setPosition(W - 16, H / 2).setScale(1, H / 32).refreshBody();
    if (this.psyOverlay) this.psyOverlay.setSize(W, H).setPosition(0, 0);
    if (this.doorZone) this.doorZone.setPosition(W / 2, 44);
    if (this.doorText) this.doorText.setPosition(W / 2, 52);
    if (this.roomText) this.roomText.setPosition(W - 16, 36);
    if (this.shardsText) this.shardsText.setPosition(W - 16, 62);
    if (this.soundText) this.soundText.setPosition(W - 16, H - 16);
    if (this.bossBarBg) this.bossBarBg.setPosition(W / 2, 22);
    if (this.bossBarFill) this.bossBarFill.setPosition(W / 2 - 160, 22);
    if (this.bossBarLabel) this.bossBarLabel.setPosition(W / 2, 22);
    if (this.winText) this.winText.setPosition(W / 2, H / 2);
    if (this.loseText) this.loseText.setPosition(W / 2, H / 2);
  }

  update(time) {
    if (!this.player || !this.player.body) return;

    // Dérive psychédélique du fond
    if (this.psyOverlay) {
      const c = Phaser.Display.Color.HSVToRGB((time * 0.00004) % 1, 0.7, 0.35);
      this.psyOverlay.setFillStyle(c.color);
    }

    // Dodge en cours : on garde la vitesse du dash
    if (!this.isDodging) {
      let vx = 0;
      let vy = 0;
      const up = this.cursors.up.isDown || this.keysWASD.W.isDown || this.keysWASD.Z.isDown;
      const down = this.cursors.down.isDown || this.keysWASD.S.isDown;
      const left = this.cursors.left.isDown || this.keysWASD.A.isDown || this.keysWASD.Q.isDown;
      const right = this.cursors.right.isDown || this.keysWASD.D.isDown;
      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;
      if (vx !== 0 && vy !== 0) {
        vx *= Math.SQRT1_2;
        vy *= Math.SQRT1_2;
      }
      this.player.setVelocity(vx * this.playerSpeed, vy * this.playerSpeed);

      // Déclenche la roulade
      if (
        Phaser.Input.Keyboard.JustDown(this.keysWASD.SPACE) ||
        Phaser.Input.Keyboard.JustDown(this.keysWASD.SHIFT) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.space) ||
        Phaser.Input.Keyboard.JustDown(this.cursors.shift)
      ) {
        if (vx !== 0 || vy !== 0) {
          this.startDodge(vx, vy, time);
        }
      }
    }

    // Vise la souris
    const pointer = this.input.activePointer;
    if (pointer) {
      this.player.setRotation(Math.atan2(pointer.worldY - this.player.y, pointer.worldX - this.player.x));
    }

    // Reload manuel (ou restart si partie finie)
    if (Phaser.Input.Keyboard.JustDown(this.keysWASD.R)) {
      if (this.hasWon || this.gameOver) {
        this.scene.restart();
      } else {
        this.startReload();
      }
    }

    // Blank anti-balles (E)
    if (Phaser.Input.Keyboard.JustDown(this.keysWASD.E)) {
      this.fireBlank();
    }

    // Switch d'arme (X)
    if (Phaser.Input.Keyboard.JustDown(this.keysWASD.X)) {
      this.switchWeapon();
    }

    // Mute (M)
    if (Phaser.Input.Keyboard.JustDown(this.keysWASD.M)) {
      const muted = toggleMute();
      this.soundText.setText(muted ? '♪ OFF [M]' : '♪ ON [M]');
    }

    // Boutique : touches 1-4 (uniquement sur écran de fin)
    if (this.shopOpen) {
      const numKeys = [this.keysShop.ONE, this.keysShop.TWO, this.keysShop.THREE, this.keysShop.FOUR];
      numKeys.forEach((k, i) => {
        if (k && Phaser.Input.Keyboard.JustDown(k)) this.buyFromShop(i);
      });
    }

    // Chasers foncent, tireurs fixes, boss en dérive lente
    this.enemies.getChildren().forEach((e) => {
      if (!e.active || !e.body) return;
      const t = e.getData('type');
      if (t === 'shooter') {
        e.setVelocity(0, 0);
        return;
      }
      if (t === 'boss') {
        this.physics.moveTo(e, this.player.x, this.player.y, (e.getData('phase') ?? 1) === 3 ? 55 : 35);
        return;
      }
      this.physics.moveTo(e, this.player.x, this.player.y, e.getData('speed') ?? 100);
    });

    // Nettoie les projectiles hors écran
    const W = this.scale.width;
    const H = this.scale.height;
    this.bullets.getChildren().forEach((b) => {
      if (!b.active) return;
      if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
        b.destroy();
      }
    });
    this.enemyBullets.getChildren().forEach((b) => {
      if (!b.active) return;
      if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) {
        b.destroy();
      }
    });
  }

  burst(x, y, tint, n = 12, speed = 220) {
    const p = this.add.particles(x, y, 'spark', {
      speed: { min: speed * 0.35, max: speed },
      lifespan: 420,
      quantity: n,
      scale: { start: 1.4, end: 0 },
      tint,
      blendMode: 'ADD',
      emitting: false,
    });
    p.explode(n, x, y);
    this.time.delayedCall(650, () => p.destroy());
  }

  floatText(x, y, str, color = '#fde047') {
    const t = this.add.text(x, y - 12, str, { fontSize: '18px', color }).setOrigin(0.5).setScrollFactor(0);
    this.tweens.add({ targets: t, y: y - 44, alpha: 0, duration: 750, onComplete: () => t.destroy() });
  }

  hitStop(ms) {
    if (this.hasWon || this.gameOver || this.transitioning || this.hitStopping) return;
    this.hitStopping = true;
    this.physics.pause();
    this.time.delayedCall(ms, () => {
      this.hitStopping = false;
      if (!this.hasWon && !this.gameOver) this.physics.resume();
    });
  }

  setDanger(on) {
    if (on === this.dangerSlow) return;
    this.dangerSlow = on;
    this.time.timeScale = on ? 0.55 : 1;
    this.physics.world.timeScale = on ? 0.55 : 1;
    this.livesText.setColor(on ? '#ef4444' : '#ffffff');
  }

  startDodge(dx, dy, time) {
    if (this.isDodging || this.gameOver || this.hasWon) return;
    this.isDodging = true;
    this.dashHit = new Set();
    sfx('dodge');
    this.invincibleUntil = (time ?? this.time.now) + this.dodgeInvincibleTime;
    this.player.setVelocity(dx * this.dodgeSpeed, dy * this.dodgeSpeed);
    this.player.setAlpha(0.5);
    this.time.delayedCall(this.dodgeTime, () => {
      this.isDodging = false;
      if (this.player.active) {
        this.player.setAlpha(1);
        this.player.setVelocity(0, 0);
      }
    });
  }

  currentWeaponStats() {
    return this.weapons[this.currentWeapon];
  }

  syncWeaponHUD() {
    const st = this.currentWeaponStats();
    this.ammoText.setText(`Munitions: ${this.ammo}/${st.magSize}`);
    this.weaponText.setText(`${st.name} [X]`);
  }

  switchWeapon() {
    if (this.gameOver || this.hasWon || this.reloading) return;
    if (!this.unlocked.includes('shotgun')) return;
    this.ammoByWeapon[this.currentWeapon] = this.ammo;
    this.currentWeapon = this.currentWeapon === 'pistol' ? 'shotgun' : 'pistol';
    const st = this.currentWeaponStats();
    this.ammo = this.ammoByWeapon[this.currentWeapon];
    this.magSize = st.magSize;
    this.reloadTime = Math.round(st.reload * this.reloadMul);
    this.fireCooldown = st.cooldown;
    this.syncWeaponHUD();
  }

  openChest() {
    if (this.chestOpened || this.gameOver || this.hasWon) return;
    this.chestOpened = true;
    this.chest.setTexture('chestOpen');
    if (!this.unlocked.includes('shotgun')) this.unlocked.push('shotgun');
    sfx('chest');
    // Bascule sur la pompe avec ses stats
    this.ammoByWeapon[this.currentWeapon] = this.ammo;
    this.currentWeapon = 'shotgun';
    const st = this.currentWeaponStats();
    this.ammo = this.ammoByWeapon.shotgun;
    this.magSize = st.magSize;
    this.reloadTime = Math.round(st.reload * this.reloadMul);
    this.fireCooldown = st.cooldown;
    this.syncWeaponHUD();
    const msg = this.add.text(this.scale.width / 2, this.scale.height / 2 - 60, 'POMPE DÉBLOQUÉE ! (X pour switcher)', { fontSize: '22px', color: '#fdba74' }).setOrigin(0.5).setScrollFactor(0);
    this.tweens.add({ targets: msg, alpha: 0, duration: 2000, onComplete: () => msg.destroy() });
  }

  fireBlank() {
    if (this.gameOver || this.hasWon) return;
    if (this.physics.world.isPaused) return;
    if (this.blanks <= 0) {
      this.tweens.add({ targets: this.blanksText, alpha: 0.2, duration: 90, yoyo: true, repeat: 3, onComplete: () => this.blanksText.setAlpha(1) });
      return;
    }
    this.blanks -= 1;
    this.blanksText.setText(`Blanks: ${this.blanks} [E]`);
    // Effet : flash + onde + shake, tout est effacé
    sfx('blank');
    this.cameras.main.flash(180, 255, 255, 255);
    this.cameras.main.shake(200, 0.006);
    const ring = this.add.circle(this.player.x, this.player.y, 10, 0xffffff, 0.6);
    this.tweens.add({ targets: ring, radius: Math.max(this.scale.width, this.scale.height), alpha: 0, duration: 450, onComplete: () => ring.destroy() });
    this.burst(this.player.x, this.player.y, 0xffffff, 24, 320);
    this.enemyBullets.getChildren().slice().forEach((b) => b.destroy());
    this.enemies.getChildren().slice().forEach((e) => {
      if (e.active) this.damageEnemy(e);
    });
    this.invincibleUntil = this.time.now + 1000;
  }

  startReload() {
    if (this.reloading || this.ammo === this.magSize || this.gameOver || this.hasWon) return;
    this.reloading = true;
    this.ammoText.setText('RECHARGEMENT...');
    this.time.delayedCall(this.reloadTime, () => {
      this.reloading = false;
      this.ammo = this.magSize;
      this.ammoByWeapon[this.currentWeapon] = this.ammo;
      this.ammoText.setText(`Munitions: ${this.ammo}/${this.magSize}`);
      sfx('reload');
    });
  }

  shoot(pointer) {
    if (this.gameOver || this.hasWon) return;
    if (this.physics.world.isPaused) return;
    if (this.reloading) return;
    const st = this.currentWeaponStats();
    if (this.ammo <= 0) {
      this.startReload();
      return;
    }
    const now = this.time.now;
    if (now - this.lastFired < st.cooldown) return;
    this.lastFired = now;
    this.ammo -= 1;
    this.ammoByWeapon[this.currentWeapon] = this.ammo;
    this.ammoText.setText(`Munitions: ${this.ammo}/${st.magSize}`);

    const base = Math.atan2(pointer.worldY - this.player.y, pointer.worldX - this.player.x);
    for (let i = 0; i < st.pellets; i += 1) {
      const off = st.pellets === 1 ? 0 : (i / (st.pellets - 1) - 0.5) * 2 * st.spread + (Math.random() - 0.5) * 0.04;
      const b = this.bullets.create(this.player.x, this.player.y, 'bullet');
      if (!b) continue;
      b.setActive(true).setVisible(true);
      b.setTint(st.tint);
      if (b.body) b.body.allowGravity = false;
      this.physics.velocityFromRotation(base + off, st.speed, b.body.velocity);
    }
    sfx(this.currentWeapon === 'shotgun' ? 'shotgun' : 'shoot');
    // Muzzle flash au bout du canon
    const mx = this.player.x + Math.cos(base) * 22;
    const my = this.player.y + Math.sin(base) * 22;
    const flash = this.add.image(mx, my, 'spark').setTint(st.tint).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2);
    this.tweens.add({ targets: flash, alpha: 0, scale: 0.4, duration: 60, onComplete: () => flash.destroy() });

    if (this.ammo <= 0) this.startReload();
  }

  activeShooters() {
    return this.enemies.getChildren().filter((e) => {
      if (!e.active) return false;
      const t = e.getData('type');
      return t === 'shooter' || t === 'boss';
    });
  }

  shooterLoop() {
    if (this.gameOver || this.hasWon || this.transitioning) return;
    if (this.physics.world.isPaused) return;
    this.activeShooters().forEach((s) => {
      // Pulse télégraphié avant la salve
      this.tweens.add({ targets: s, scaleX: '+=0.25', scaleY: '+=0.25', duration: 120, yoyo: true });
      const isBoss = s.getData('type') === 'boss';
      const phase = s.getData('phase') ?? 1;
      // P1 du boss : visé + salve uniquement
      const mod = isBoss && phase === 1 ? 2 : 3;
      const counter = s.getData('pattern') ?? 0;
      const pi = counter % mod;
      if (pi === 0) this.fireAimed(s);
      else if (pi === 1) this.fireSpread(s);
      else this.fireRing(s, isBoss && phase === 3);
      s.setData('pattern', counter + 1);
    });
  }

  spawnEnemyBullet(source, angle, speed, tint) {
    const kids = this.enemyBullets.getChildren();
    if (kids.length >= this.maxEnemyBullets) kids[0].destroy();
    const b = this.enemyBullets.create(source.x, source.y, 'enemyBullet');
    if (!b) return;
    b.setActive(true).setVisible(true);
    b.setBlendMode(Phaser.BlendModes.ADD);
    if (tint !== undefined) b.setTint(tint);
    if (b.body) b.body.allowGravity = false;
    this.physics.velocityFromRotation(angle, speed, b.body.velocity);
  }

  fireAimed(s) {
    const angle = Math.atan2(this.player.y - s.y, this.player.x - s.x);
    this.spawnEnemyBullet(s, angle, 200, 0x00eeff);
  }

  fireSpread(s) {
    const base = Math.atan2(this.player.y - s.y, this.player.x - s.x);
    [-0.26, 0, 0.26].forEach((off) => this.spawnEnemyBullet(s, base + off, 190, 0xffee00));
  }

  fireRing(s, dense) {
    const n = dense ? 8 : 10;
    for (let i = 0; i < n; i += 1) {
      this.spawnEnemyBullet(s, (i / n) * Math.PI * 2, 150, 0xff33cc);
    }
    for (let i = 0; i < n; i += 1) {
      this.spawnEnemyBullet(s, (i / n) * Math.PI * 2 + Math.PI / n, 150, 0x66ff66);
    }
    if (dense) {
      for (let i = 0; i < n; i += 1) {
        this.spawnEnemyBullet(s, (i / n) * Math.PI * 2 + Math.PI / (n * 2), 190, 0xffee00);
      }
    }
    this.cameras.main.shake(120, 0.004);
  }

  fireSpiral() {
    if (this.gameOver || this.hasWon || this.transitioning) return;
    if (this.physics.world.isPaused) return;
    this.activeShooters().forEach((s) => {
      const isBossP3 = s.getData('type') === 'boss' && (s.getData('phase') ?? 1) === 3;
      const arms = isBossP3 ? 4 : 2;
      const a = s.getData('spiral') ?? Math.random() * Math.PI * 2;
      for (let k = 0; k < arms; k += 1) {
        this.spawnEnemyBullet(s, a + (k * Math.PI * 2) / arms, 150, k % 2 === 0 ? 0x99ff33 : 0x33ff99);
      }
      s.setData('spiral', a + 0.35);
    });
  }

  hitByEnemyBullet(player, bullet) {
    bullet.destroy();
    if (this.gameOver || this.hasWon) return;
    if (this.time.now < this.invincibleUntil) return;
    this.lives -= 1;
    this.livesText.setText('Vies: ' + this.lives);
    this.player.setTint(0xff0000).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(150, () => {
      if (this.player.active) this.player.clearTint();
    });
    sfx('playerHurt');
    this.burst(this.player.x, this.player.y, 0xff3333, 8, 180);
    this.setDanger(this.lives === 1);
    this.invincibleUntil = this.time.now + 1000;
    if (this.lives <= 0) {
      this.gameOver = true;
      this.physics.pause();
      sfx('lose');
      this.loseText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 120, 'GAME OVER (R pour rejouer)', { fontSize: '28px', color: '#f00' }).setOrigin(0.5).setScrollFactor(0);
      this.creditRun();
      this.showShop();
    }
  }

  bulletHitWall(bullet) {
    bullet.destroy();
  }

  bulletHitEnemy(bullet, enemy) {
    bullet.destroy();
    if (!enemy.active) return;
    sfx('hit');
    this.damageEnemy(enemy);
  }

  damageEnemy(enemy) {
    if (!enemy.active || this.hasWon) return;
    const hp = (enemy.getData('hp') ?? 2) - 1;
    const isBoss = enemy.getData('type') === 'boss';
    if (hp <= 0) {
      const ex = enemy.x;
      const ey = enemy.y;
      enemy.destroy();
      const bonus = isBoss ? 500 : 50;
      this.score += bonus;
      this.scoreText.setText('Score: ' + this.score);
      sfx('enemyDie');
      this.burst(ex, ey, isBoss ? 0xc084fc : 0xff6666, isBoss ? 26 : 12, isBoss ? 320 : 220);
      this.floatText(ex, ey, `+${bonus}`, isBoss ? '#c084fc' : '#fde047');
      this.hitStop(isBoss ? 150 : 60);
      if (isBoss) this.hideBossBar();
      if (this.enemies.countActive(true) === 0 && !this.hasWon) {
        this.onRoomCleared();
      }
    } else {
      enemy.setData('hp', hp);
      enemy.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.time.delayedCall(150, () => {
        if (!enemy.active) return;
        enemy.clearTint();
        if (isBoss) this.applyBossTint(enemy);
      });
      if (isBoss) this.checkBossPhase(enemy, hp);
    }
  }

  bossPhaseColor(phase) {
    return phase === 3 ? 0xff4444 : phase === 2 ? 0xffaa33 : 0xffffff;
  }

  applyBossTint(enemy) {
    const phase = enemy.getData('phase') ?? 1;
    if (phase === 1) return;
    enemy.setTint(this.bossPhaseColor(phase));
  }

  checkBossPhase(enemy, hp) {
    const maxHP = enemy.getData('maxHP') ?? hp;
    const frac = hp / maxHP;
    const newPhase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
    if (newPhase === (enemy.getData('phase') ?? 1)) {
      this.updateBossBar();
      return;
    }
    enemy.setData('phase', newPhase);
    // Annonce + renfort, sans flash caméra
    sfx('phase');
    this.cameras.main.shake(180, 0.005);
    const label = newPhase === 2 ? 'PHASE 2 — IL S\'ÉNERVE !' : 'PHASE 3 — DÉLUGE !';
    const msg = this.add.text(this.scale.width / 2, this.scale.height / 2 - 100, label, { fontSize: '24px', color: '#f87171' }).setOrigin(0.5).setScrollFactor(0);
    this.tweens.add({ targets: msg, alpha: 0, duration: 1800, onComplete: () => msg.destroy() });
    // Renfort chaser (plafonné à 4)
    const chasers = this.enemies.getChildren().filter((e) => e.active && e.getData('type') === 'chaser');
    if (chasers.length < 4) {
      const cfg = this.rooms[this.roomIndex];
      const c = this.enemies.create(this.scale.width * (0.3 + Math.random() * 0.4), this.scale.height * 0.7, 'enemy');
      c.setCollideWorldBounds(true);
      c.setData('hp', cfg.chaserHP);
      c.setData('type', 'chaser');
      c.setData('speed', cfg.chaserSpeed);
      if (c.body) c.body.allowGravity = false;
    }
    this.time.delayedCall(160, () => {
      if (enemy.active) this.applyBossTint(enemy);
    });
    this.updateBossBar();
  }

  showBossBar() {
    this.bossBarBg.setVisible(true);
    this.bossBarFill.setVisible(true);
    this.bossBarLabel.setVisible(true);
    this.updateBossBar();
  }

  hideBossBar() {
    this.bossBarBg.setVisible(false);
    this.bossBarFill.setVisible(false);
    this.bossBarLabel.setVisible(false);
  }

  updateBossBar() {
    const boss = this.enemies.getChildren().find((e) => e.active && e.getData('type') === 'boss');
    if (!boss) {
      this.hideBossBar();
      return;
    }
    const frac = Math.max((boss.getData('hp') ?? 1) / (boss.getData('maxHP') ?? 1), 0);
    this.bossBarFill.displayWidth = Math.max(320 * frac, 0.001);
    const phase = boss.getData('phase') ?? 1;
    this.bossBarFill.setFillStyle(phase === 3 ? 0xef4444 : phase === 2 ? 0xfb923c : 0xa855f7);
  }

  spawnRoom(i) {
    const W = this.scale.width;
    const H = this.scale.height;
    const cfg = this.rooms[i];
    cfg.chasers.forEach(([fx, fy]) => {
      const e = this.enemies.create(W * fx, H * fy, 'enemy');
      e.setCollideWorldBounds(true);
      e.setData('hp', cfg.chaserHP);
      e.setData('type', 'chaser');
      e.setData('speed', cfg.chaserSpeed);
      if (e.body) e.body.allowGravity = false;
    });
    cfg.shooters.forEach(([fx, fy]) => {
      const s = this.enemies.create(W * fx, H * fy, 'shooter');
      s.setCollideWorldBounds(true);
      s.setData('hp', cfg.shooterHP);
      s.setData('type', 'shooter');
      s.setData('pattern', 0);
      s.setData('spiral', Math.random() * Math.PI * 2);
      if (s.body) {
        s.body.allowGravity = false;
        s.body.setImmovable(true);
      }
    });
    if (cfg.boss) {
      const [fx, fy] = cfg.boss.pos;
      const b = this.enemies.create(W * fx, H * fy, 'boss');
      b.setScale(1.7);
      b.setCollideWorldBounds(true);
      b.setData('hp', cfg.boss.hp);
      b.setData('maxHP', cfg.boss.hp);
      b.setData('type', 'boss');
      b.setData('pattern', 0);
      b.setData('spiral', Math.random() * Math.PI * 2);
      b.setData('phase', 1);
      if (b.body) {
        b.body.allowGravity = false;
        b.body.setImmovable(true);
      }
      this.showBossBar();
      const intro = this.add.text(W / 2, H / 2 - 60, 'LE GRAND MAGE VOUS DÉFIE !', { fontSize: '26px', color: '#c084fc' }).setOrigin(0.5).setScrollFactor(0);
      this.tweens.add({ targets: intro, alpha: 0, duration: 2200, onComplete: () => intro.destroy() });
    }
    if (this.shooterTimer) this.shooterTimer.delay = cfg.interval;
  }

  onRoomCleared() {
    if (this.hasWon || this.gameOver) return;
    if (this.roomIndex >= this.rooms.length - 1) {
      this.hasWon = true;
      const label = this.rooms[this.roomIndex].boss ? 'BOSS VAINCU — RUN TERMINÉ ! (R pour rejouer)' : 'RUN TERMINÉ ! (R pour rejouer)';
      sfx('win');
      this.winText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 120, label, { fontSize: '26px', color: '#0f0' }).setOrigin(0.5).setScrollFactor(0);
      this.physics.pause();
      this.creditRun();
      this.showShop();
    } else {
      this.doorOpen = true;
      this.doorText.setVisible(true);
    }
  }

  creditRun() {
    if (this.shardsCredited) return 0;
    this.shardsCredited = true;
    const n = Math.floor(this.score / 10);
    const total = addShards(n);
    this.runShards = n;
    this.shardsText.setText(`◆ ${total}`);
    return n;
  }

  showShop() {
    if (this.shopOpen) return;
    this.shopOpen = true;
    const W = this.scale.width;
    const H = this.scale.height;
    this.shopBg = this.add.rectangle(W / 2, H / 2 + 60, 620, 300, 0x0a0a18, 0.93).setScrollFactor(0).setDepth(50);
    this.shopBg.setStrokeStyle(2, 0xc084fc);
    this.refreshShop();
  }

  refreshShop() {
    if (this.shopLines) this.shopLines.forEach((t) => t.destroy());
    this.shopLines = [];
    this.shopUpgradeTexts = [];
    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const top = H / 2 - 50;
    const mk = (str, y, size = 20, color = '#fff') => {
      const t = this.add.text(cx, y, str, { fontSize: `${size}px`, color }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
      this.shopLines.push(t);
      return t;
    };
    mk('— BOUTIQUE (R pour relancer) —', top, 22, '#f0abfc');
    mk(`◆ Éclats : ${metaStats().shards}  (+${this.runShards} ce run)`, top + 32, 20, '#fde047');
    UPGRADES.forEach((def, i) => {
      const lvl = levelOf(def.id);
      const cost = costOf(def.id);
      const right = lvl >= def.max ? 'MAX' : `${cost} ◆`;
      const line = `${i + 1}. ${def.name} Nv${lvl} — ${def.desc} — ${right}`;
      this.shopUpgradeTexts.push(mk(line, top + 64 + i * 30, 20, lvl >= def.max ? '#64748b' : '#fff'));
    });
    mk('Touches 1-4 pour acheter', top + 64 + 4 * 30 + 8, 18, '#94a3b8');
  }

  buyFromShop(i) {
    const def = UPGRADES[i];
    if (!def || !this.shopOpen) return;
    const res = buyUpgrade(def.id);
    if (res.ok) {
      sfx('chest');
      this.refreshShop();
    } else if (this.shopUpgradeTexts && this.shopUpgradeTexts[i]) {
      const t = this.shopUpgradeTexts[i];
      this.tweens.add({ targets: t, alpha: 0.2, duration: 90, yoyo: true, repeat: 3, onComplete: () => t.setAlpha(1) });
    }
  }

  enterDoor() {
    if (!this.doorOpen || this.transitioning || this.gameOver || this.hasWon) return;
    this.transitioning = true;
    sfx('door');
    // Sécurise la traversée : plus aucune balle, invincibilité temporaire
    this.enemyBullets.getChildren().slice().forEach((b) => b.destroy());
    this.invincibleUntil = this.time.now + 1500;
    this.cameras.main.fadeOut(250);
    this.time.delayedCall(260, () => {
      this.roomIndex += 1;
      this.bullets.getChildren().slice().forEach((b) => b.destroy());
      this.enemyBullets.getChildren().slice().forEach((b) => b.destroy());
      this.player.setPosition(this.scale.width / 2, this.scale.height - 100).setVelocity(0, 0);
      // Récompenses de salle (plafonnées)
      this.lives = Math.min(this.lives + 1, this.maxLives);
      this.livesText.setText('Vies: ' + this.lives);
      this.setDanger(false);
      this.blanks = Math.min(this.blanks + 1, this.maxBlanks);
      this.blanksText.setText(`Blanks: ${this.blanks} [E]`);
      // Recharge complète de l'arme courante
      this.ammo = this.magSize;
      this.ammoByWeapon[this.currentWeapon] = this.ammo;
      this.syncWeaponHUD();
      this.spawnRoom(this.roomIndex);
      this.roomText.setText(`SALLE ${this.roomIndex + 1}/3 · #${this.seedShort}`);
      this.doorOpen = false;
      this.doorText.setVisible(false);
      this.transitioning = false;
      this.cameras.main.fadeIn(250);
    });
  }

  hitEnemy(player, enemy) {
    if (this.gameOver || this.hasWon) return;
    // Dash offensif : la roulade blesse (1 fois par ennemi par roulade)
    if (this.isDodging) {
      if (!this.dashHit.has(enemy)) {
        this.dashHit.add(enemy);
        this.damageEnemy(enemy);
      }
      return;
    }
    if (this.time.now < this.invincibleUntil) return;
    this.lives -= 1;
    this.livesText.setText('Vies: ' + this.lives);
    this.player.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.time.delayedCall(150, () => {
      if (this.player.active) this.player.clearTint();
    });
    sfx('playerHurt');
    this.burst(this.player.x, this.player.y, 0xff3333, 8, 180);
    this.setDanger(this.lives === 1);
    // Petite invincibilité post-hit pour éviter la mort instantanée
    this.invincibleUntil = this.time.now + 1000;
    if (this.lives <= 0) {
      this.gameOver = true;
      this.physics.pause();
      sfx('lose');
      this.loseText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 120, 'GAME OVER (R pour rejouer)', { fontSize: '28px', color: '#f00' }).setOrigin(0.5).setScrollFactor(0);
      this.creditRun();
      this.showShop();
    }
  }
}
