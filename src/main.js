import Phaser from "phaser";
import BootScene from "./scenes/BootScene.js";
import GameScene from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#1a1a2e",
  pixelArt: true,
  scale: {
    parent: "game",
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: "100%",
    height: "100%",
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scene: [BootScene, GameScene],
};

window.game = new Phaser.Game(config);
