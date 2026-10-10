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
