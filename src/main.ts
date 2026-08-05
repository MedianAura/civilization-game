import Phaser from "phaser";
import { MainScene, TILE } from "./scenes/MainScene";
import { CitizenPanel } from "./ui/CitizenPanel";
import { Selection } from "./ui/Selection";
import { World } from "./world/World";
import "./ui/ui.css";

const world = new World();
const selection = new Selection();

const uiLayer = document.getElementById("ui-layer");
if (!uiLayer) throw new Error("#ui-layer is missing from index.html");
new CitizenPanel(uiLayer, selection, (id) => world.citizenById(id));

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  backgroundColor: "#141414",
  width: world.grid.width * TILE,
  height: world.grid.height * TILE,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  pixelArt: true,
  scene: [MainScene],
};

const game = new Phaser.Game(config);
game.scene.start("MainScene", { world, selection });

if (import.meta.env.DEV) {
  // A dev handle on the running colony. Poking at simulation state from the
  // console beats aiming clicks at a scaled canvas, and browser-driven tests
  // need a way in that does not depend on where the sprites happen to land.
  (globalThis as typeof globalThis & { civ?: unknown }).civ = { game, world, selection };
}
