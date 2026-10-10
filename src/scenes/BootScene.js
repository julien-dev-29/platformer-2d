import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.makePlaceholders();
    this.scene.start('Game');
  }

  makePlaceholders() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    // --- Joueur 36x36 : Gungeoneer vu du dessus, canon vers +X (rotation souris) ---
    g.clear();
    // ombre
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(18, 20, 13);
    // canon
    g.fillStyle(0x3a3f4a, 1);
    g.fillRect(18, 15, 14, 6);
    g.fillStyle(0x22262e, 1);
    g.fillRect(29, 14, 4, 8);
    // corps (manteau bleu)
    g.fillStyle(0x1d3557, 1);
    g.fillCircle(18, 18, 12);
    g.fillStyle(0x457b9d, 1);
    g.fillCircle(18, 18, 9);
    g.fillStyle(0xa8dadc, 1);
    g.fillCircle(15, 15, 3);
    // visière / yeux vers +X
    g.fillStyle(0x10131a, 1);
    g.fillRect(18, 12, 8, 12);
    g.fillStyle(0xffe66d, 1);
    g.fillRect(22, 14, 3, 3);
    g.fillRect(22, 21, 3, 3);
    g.generateTexture('player', 36, 36);

    // --- Mur 64x32 : brique de donjon ---
    g.clear();
    g.fillStyle(0x23232e, 1);
    g.fillRect(0, 0, 64, 32);
    g.fillStyle(0x3a3a4d, 1);
    g.fillRect(1, 1, 62, 30);
    // rangées de briques
    g.fillStyle(0x2c2c3a, 1);
    g.fillRect(1, 15, 62, 2);
    g.fillRect(21, 1, 2, 14);
    g.fillRect(43, 17, 2, 14);
    // reflets + rivets
    g.fillStyle(0x4a4a63, 1);
    g.fillRect(1, 1, 62, 2);
    g.fillStyle(0x191921, 1);
    g.fillRect(4, 5, 3, 3);
    g.fillRect(36, 22, 3, 3);
    g.fillRect(53, 6, 3, 3);
    g.lineStyle(2, 0x14141c, 1);
    g.strokeRect(0, 0, 64, 32);
    g.generateTexture('ground', 64, 32);

    // --- Pièce 20x20 (bonus, inutilisée en top-down) ---
    g.clear();
    g.fillStyle(0x7a5c00, 1);
    g.fillCircle(10, 11, 9);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(10, 10, 8);
    g.fillStyle(0xffef9e, 1);
    g.fillCircle(7, 7, 3);
    g.lineStyle(2, 0xaa8800, 1);
    g.strokeCircle(10, 10, 8);
    g.generateTexture('coin', 20, 20);

    // --- Chaser 32x32 : blob énervé ---
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(16, 18, 13);
    // pics
    g.fillStyle(0x7f1d1d, 1);
    g.fillTriangle(4, 12, 0, 6, 9, 7);
    g.fillTriangle(28, 12, 32, 6, 23, 7);
    g.fillTriangle(4, 24, 0, 30, 9, 27);
    g.fillTriangle(28, 24, 32, 30, 23, 27);
    // corps
    g.fillStyle(0x991b1b, 1);
    g.fillCircle(16, 16, 13);
    g.fillStyle(0xef4444, 1);
    g.fillCircle(16, 16, 10);
    g.fillStyle(0xfca5a5, 1);
    g.fillCircle(12, 12, 4);
    // yeux furieux
    g.fillStyle(0xffffff, 1);
    g.fillRect(9, 13, 6, 7);
    g.fillRect(18, 13, 6, 7);
    g.fillStyle(0x111111, 1);
    g.fillRect(11, 15, 3, 4);
    g.fillRect(20, 15, 3, 4);
    // bouche dentée
    g.fillStyle(0x450a0a, 1);
    g.fillRect(11, 23, 11, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(12, 23, 3, 2);
    g.fillRect(17, 23, 3, 2);
    g.generateTexture('enemy', 32, 32);

    // --- Balle joueur 14x14 : plasma cyan avec halo ---
    g.clear();
    g.fillStyle(0x00ffff, 0.25);
    g.fillCircle(7, 7, 7);
    g.fillStyle(0x0891b2, 1);
    g.fillCircle(7, 7, 5);
    g.fillStyle(0xa5f3fc, 1);
    g.fillCircle(7, 7, 3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(7, 7, 1.5);
    g.generateTexture('bullet', 14, 14);

    // --- Tireur 36x36 : mage violet ---
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(18, 20, 14);
    // chapeau
    g.fillStyle(0x4c1d95, 1);
    g.fillTriangle(6, 16, 18, 0, 30, 16);
    g.fillStyle(0x7c3aed, 1);
    g.fillTriangle(11, 15, 18, 4, 25, 15);
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(18, 4, 2.5);
    // robe
    g.fillStyle(0x5b21b6, 1);
    g.fillCircle(18, 22, 11);
    g.fillStyle(0x8b5cf6, 1);
    g.fillCircle(18, 22, 8);
    // visage
    g.fillStyle(0xf5d0fe, 1);
    g.fillCircle(18, 21, 5);
    g.fillStyle(0x111111, 1);
    g.fillRect(14, 19, 3, 4);
    g.fillRect(20, 19, 3, 4);
    // gemme
    g.fillStyle(0xf0abfc, 1);
    g.fillCircle(18, 29, 2.5);
    g.generateTexture('shooter', 36, 36);

    // --- Balle ennemie 12x12 : base neutre blanche (teintée par pattern) ---
    g.clear();
    g.fillStyle(0xffffff, 0.3);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xe5e5e5, 1);
    g.fillCircle(6, 6, 4);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(6, 6, 2.5);
    g.generateTexture('enemyBullet', 12, 12);

    // --- Boss 48x48 : Grand Mage couronné ---
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillCircle(24, 27, 20);
    // grand chapeau étoilé
    g.fillStyle(0x2e1065, 1);
    g.fillTriangle(8, 22, 24, 0, 40, 22);
    g.fillStyle(0x7c3aed, 1);
    g.fillTriangle(14, 21, 24, 5, 34, 21);
    g.fillStyle(0xfde68a, 1);
    g.fillCircle(20, 12, 2);
    g.fillCircle(28, 8, 2);
    g.fillCircle(26, 16, 1.5);
    // couronne
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(10, 22, 28, 5);
    g.fillRect(10, 18, 4, 6);
    g.fillRect(22, 16, 4, 8);
    g.fillRect(34, 18, 4, 6);
    // robe majestueuse
    g.fillStyle(0x4c1d95, 1);
    g.fillCircle(24, 32, 14);
    g.fillStyle(0x8b5cf6, 1);
    g.fillCircle(24, 32, 10);
    // visage courroucé
    g.fillStyle(0xf5d0fe, 1);
    g.fillCircle(24, 30, 7);
    g.fillStyle(0x111111, 1);
    g.fillRect(17, 27, 5, 6);
    g.fillRect(27, 27, 5, 6);
    g.fillStyle(0xff0000, 1);
    g.fillRect(18, 29, 3, 2);
    g.fillRect(28, 29, 3, 2);
    // grosse gemme
    g.fillStyle(0xf0abfc, 1);
    g.fillCircle(24, 41, 3.5);
    g.lineStyle(2, 0xfbbf24, 1);
    g.strokeCircle(24, 41, 3.5);
    g.generateTexture('boss', 48, 48);

    // --- Coffre fermé 36x28 : bois + renforts or ---
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(3, 22, 30, 6);
    g.fillStyle(0x5b3a1e, 1);
    g.fillRect(2, 8, 32, 16);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(2, 8, 32, 5);
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(2, 8, 32, 2);
    g.fillRect(6, 8, 3, 16);
    g.fillRect(27, 8, 3, 16);
    g.fillStyle(0x78350f, 1);
    g.fillRect(14, 13, 8, 8);
    g.fillStyle(0xfde68a, 1);
    g.fillRect(16, 15, 4, 4);
    g.generateTexture('chest', 36, 28);

    // --- Coffre ouvert 36x28 : couvercle relevé + intérieur sombre ---
    g.clear();
    g.fillStyle(0x000000, 0.3);
    g.fillRect(3, 22, 30, 6);
    g.fillStyle(0x3a2512, 1);
    g.fillRect(2, 0, 32, 8);
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(2, 6, 32, 2);
    g.fillStyle(0x5b3a1e, 1);
    g.fillRect(2, 12, 32, 12);
    g.fillStyle(0x111111, 1);
    g.fillRect(6, 12, 24, 6);
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(2, 20, 32, 4);
    g.fillStyle(0xfbbf24, 1);
    g.fillRect(6, 12, 3, 12);
    g.fillRect(27, 12, 3, 12);
    g.generateTexture('chestOpen', 36, 28);

    // --- Étincelle 6x6 : base particules/juice ---
    g.clear();
    g.fillStyle(0xffffff, 0.35);
    g.fillCircle(3, 3, 3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(3, 3, 1.8);
    g.generateTexture('spark', 6, 6);

    g.destroy();
  }
}
