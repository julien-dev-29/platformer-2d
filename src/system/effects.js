export class EffectsSystem {
  constructor(scene) {
    this.s = scene;
    this.dangerSlow = false;
    this.hitStopping = false;
  }

  burst(x, y, tint, n = 12, speed = 220) {
    const p = this.s.add.particles(x, y, "spark", {
      speed: { min: speed * 0.35, max: speed },
      lifespan: 420,
      quantity: n,
      scale: { start: 1.4, end: 0 },
      tint,
      blendMode: "ADD",
      emitting: false,
    });
    p.explode(n, x, y);
    this.s.time.delayedCall(650, () => p.destroy());
  }

  floatText(x, y, str, color = "#fde047") {
    const t = this.add
      .text(x, y - 12, str, { fontSize: "18px", color })
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.tweens.add({
      targets: t,
      y: y - 44,
      alpha: 0,
      duration: 750,
      onComplete: () => t.destroy(),
    });
  }

  hitStop(ms) {
    if (this.hasWon || this.gameOver || this.transitioning || this.hitStopping)
      return;
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
    this.livesText.setColor(on ? "#ef4444" : "#ffffff");
  }
}
