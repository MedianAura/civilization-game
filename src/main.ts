import Phaser from "phaser";
import { MainScene, TILE } from "./scenes/MainScene";
import { InspectorPanel } from "./ui/InspectorPanel";
import { Selection } from "./ui/Selection";
import { ToolState } from "./ui/Tool";
import { Toolbar } from "./ui/Toolbar";
import { World } from "./world/World";
import "./ui/ui.css";

const world = new World();
const selection = new Selection();
const tools = new ToolState();

const uiLayer = document.getElementById("ui-layer");
if (!uiLayer) throw new Error("#ui-layer is missing from index.html");

const inspector = new InspectorPanel(uiLayer, selection, {
  citizen: (id) => world.citizenById(id),
  tile: (x, y) => world.grid.at(x, y),
  occupant: (x, y) => world.citizenAt({ x, y }),
  zone: (id) => world.zoneById(id),
  zoneAt: (x, y) => world.zoneAt({ x, y }),
  usableTiles: (zone) => world.usableTiles(zone),
  removeZone: (id) => world.removeZone(id),
});
new Toolbar(uiLayer, tools);

// A tile panel showing "Zone: None" goes stale the moment a zone is drawn over
// it. The panel re-reads rather than caching, so a nudge is enough.
world.events.on("zone:added", () => inspector.refresh());
world.events.on("zone:removed", () => inspector.refresh());

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
game.scene.start("MainScene", { world, selection, tools });

if (import.meta.env.DEV) {
  // A dev handle on the running colony. Poking at simulation state from the
  // console beats aiming clicks at a scaled canvas, and browser-driven tests
  // need a way in that does not depend on where the sprites happen to land.
  (globalThis as typeof globalThis & { civ?: unknown }).civ = { game, world, selection, tools };
}
