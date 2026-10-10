export const FPS = 30;

// Mettez à true quand les MP3 sont déposés dans public/voice/*.mp3
export const VOICEOVER = false;

export type Chapter = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  seconds: number;
  narration: string;
  code?: {file: string; lines: string[]};
  capture?: string;
  voice?: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    kicker: 'DEVLOG',
    title: "D'un rectangle vert au bullet hell",
    subtitle: 'Comment ce jeu a été construit, étape par étape',
    seconds: 10,
    narration:
      "Un rectangle vert. Quelques sessions plus tard : un bullet hell psychédélique, avec boss, blank et fusil à pompe. Voici comment ce jeu a été construit, étape par étape.",
  },
  {
    id: 'placeholders',
    kicker: 'ÉTAPE 1',
    title: 'Des placeholders, pas des assets',
    subtitle: 'Gameplay first : si c\'est fun en rectangles, ce sera fun en pixel-art',
    seconds: 15,
    narration:
      "Tout commence avec des placeholders : des formes générées en code, aucun asset à dessiner. Un joueur vert, des pièces jaunes, un platformer minimal. La règle : si c'est amusant avec des rectangles, les graphismes ne feront qu'amplifier.",
    code: {
      file: 'BootScene.js — makePlaceholders()',
      lines: [
        'g.fillStyle(0x00ff00, 1);',
        'g.fillRect(0, 0, 32, 48);',
        "g.generateTexture('player', 32, 48);",
      ],
    },
  },
  {
    id: 'topdown',
    kicker: 'ÉTAPE 2',
    title: 'Virage top-down façon Gungeon',
    subtitle: 'Gravité à zéro, visée souris, roulade, chargeurs',
    seconds: 20,
    narration:
      "Le virage : fini le platformer, direction le twin-stick façon Enter the Gungeon. Gravité à zéro, déplacement ZQSD, tir vers la souris, roulade d'esquive avec invincibilité, et rechargement au chargeur. Le socle du jeu est posé.",
    code: {
      file: 'GameScene.js — startDodge()',
      lines: [
        'this.isDodging = true;',
        'this.invincibleUntil = time + 300;',
        'this.player.setVelocity(dx * 600, dy * 600);',
      ],
    },
  },
  {
    id: 'patterns',
    kicker: 'ÉTAPE 3',
    title: 'Les ennemis ripostent',
    subtitle: 'Visé, salves, anneaux, spirale — le bullet hell est né',
    seconds: 20,
    narration:
      "Ensuite, les ennemis ripostent : tir visé, salve de trois, double anneau, puis spirale continue en fond. Balles teintées, halo lumineux, fond qui dérive. Le bullet hell est né — et la roulade devient vitale.",
    code: {
      file: 'GameScene.js — fireSpiral()',
      lines: [
        'for (let k = 0; k < arms; k++)',
        '  spawnEnemyBullet(a + k * PI * 2 / arms);',
        'spiralAngle += 0.35;',
      ],
    },
  },
  {
    id: 'blank-pompe',
    kicker: 'ÉTAPE 4',
    title: 'Blank et pompe',
    subtitle: 'Deux mécaniques cultes du genre',
    seconds: 20,
    narration:
      "Deux mécaniques cultes : le blank, qui efface tout l'écran en cas de panique, et un coffre qui cache un fusil à pompe à cinq plombs. Risque, récompense, et ce petit 'clic' satisfaisant à chaque tir.",
    code: {
      file: 'GameScene.js — fireBlank()',
      lines: [
        'enemyBullets.getChildren().forEach(b => b.destroy());',
        'enemies.forEach(e => damageEnemy(e));',
        'invincibleUntil = time.now + 1000;',
      ],
    },
  },
  {
    id: 'salles',
    kicker: 'ÉTAPE 5',
    title: 'Trois salles, un run',
    subtitle: 'Portes, récompenses, difficulté croissante',
    seconds: 15,
    narration:
      "Une arène, c'est court. Trois salles en enfilade, une porte qui s'ouvre au nettoyage, une vie et un blank bonus entre chaque. Un run a désormais un début, un milieu, et une fin.",
    code: {
      file: 'GameScene.js — rooms',
      lines: [
        '{ chasers: 2, shooters: 1 },',
        '{ chasers: 3, shooters: 1 },',
        '{ boss: 1, chasers: 2 },',
      ],
    },
  },
  {
    id: 'boss',
    kicker: 'ÉTAPE 6',
    title: 'Le Grand Mage',
    subtitle: '24 PV, 3 phases, barre de vie',
    seconds: 20,
    narration:
      "Le final : le Grand Mage. Vingt-quatre points de vie, trois phases qui changent ses patterns et sa couleur, des renforts, une barre de vie. Le test final de tout ce que le joueur a appris.",
    code: {
      file: 'GameScene.js — checkBossPhase()',
      lines: [
        'const frac = hp / maxHP;',
        'newPhase = frac > .66 ? 1 : frac > .33 ? 2 : 3;',
        'shake(); renfort(); teinte rouge;',
      ],
    },
  },
  {
    id: 'juice',
    kicker: 'ÉTAPE 7',
    title: 'Feeling et sons, zéro asset',
    subtitle: 'Hit-stop, ralenti, particules, WebAudio',
    seconds: 20,
    narration:
      "Enfin, le feeling : freeze de soixante millisecondes à chaque kill, ralenti à un point de vie, particules, et une bande-son entièrement synthétisée en WebAudio. Aucun fichier audio : que du code.",
    code: {
      file: 'sfx.js — tone()',
      lines: [
        'o.frequency.setValueAtTime(freq, t0);',
        'o.frequency.exponentialRampToValueAtTime(end);',
        'gain 0 → pic → silence;',
      ],
    },
  },
  {
    id: 'outro',
    kicker: 'À TOI DE JOUER',
    title: 'Rectangle vert, bullet hell',
    subtitle: 'Le jeu tourne dans le navigateur — roule, tire, survis',
    seconds: 10,
    narration:
      "Rectangle vert, bullet hell. Le jeu tourne dans le navigateur. À toi de jouer — et surtout, de rouler.",
  },
];

export const TOTAL_FRAMES = CHAPTERS.reduce((acc, c) => acc + c.seconds * FPS, 0);
