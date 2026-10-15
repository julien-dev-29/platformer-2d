export class HudSytem {
  constructor(scene, run) {
    this.s = scene;
    this.run = run;
  }

  create() {
    this.root = this.s.add.container(0, 0).setDepth(40).setScrollFactor(0);
  }

  syncWeaponHUD() {
    const st = WEAPONS[this.currentWeapon];
    const backup = this.unlocked.find((u) => u !== this.currentWeapon);
    this.ammoText.setText(`Munitions: ${this.ammo}/${st.magSize}`);
    this.weaponText.setText(
      backup ? `${st.name} [X] + ${WEAPONS[backup].name}` : `${st.name} [X]`,
    );
  }
}
