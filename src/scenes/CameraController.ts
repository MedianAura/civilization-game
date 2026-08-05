import Phaser from "phaser";

const MAX_ZOOM = 2;
/** Absolute floor, in case a region is ever smaller than the window. */
const ZOOM_FLOOR = 0.15;
const ZOOM_STEP = 1.12;
const KEY_PAN_SPEED = 700; // world px per second at zoom 1

/**
 * Pan and zoom over a region larger than the window.
 *
 * Panning is on the *right* button, not the left: the left drag already means
 * "paint a zone", and a camera that steals it would make the zone tool
 * unusable. Arrow keys and WASD do the same job for anyone who dislikes
 * dragging with the wrong finger.
 */
export class CameraController {
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private panning = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly worldWidth: number,
    private readonly worldHeight: number
  ) {
    const camera = scene.cameras.main;
    camera.setBounds(0, 0, worldWidth, worldHeight);

    // `setBounds(..., true)` centres once, at the moment it is called — it is not
    // a standing mode, so zooming out past "the region fits" still stranded the
    // world against one edge with black beside it. Capping the zoom instead means
    // the void cannot be reached in the first place.
    scene.scale.on(Phaser.Scale.Events.RESIZE, () => this.clampZoom());

    // A right-drag must not open the browser menu on top of the game.
    scene.input.mouse?.disableContextMenu();

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) this.panning = true;
    });
    scene.input.on(Phaser.Input.Events.POINTER_UP, () => {
      this.panning = false;
    });

    scene.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer) => {
      if (!this.panning || !pointer.isDown) return;
      // Divide by zoom: dragging an inch should move the world an inch on screen,
      // not an inch in world units.
      camera.scrollX -= (pointer.x - pointer.prevPosition.x) / camera.zoom;
      camera.scrollY -= (pointer.y - pointer.prevPosition.y) / camera.zoom;
    });

    scene.input.on(
      Phaser.Input.Events.POINTER_WHEEL,
      (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
        this.zoomAt(pointer, dy);
      }
    );

    const keyboard = scene.input.keyboard;
    if (keyboard) {
      for (const [name, code] of [
        ["up", Phaser.Input.Keyboard.KeyCodes.W],
        ["down", Phaser.Input.Keyboard.KeyCodes.S],
        ["left", Phaser.Input.Keyboard.KeyCodes.A],
        ["right", Phaser.Input.Keyboard.KeyCodes.D],
        ["up2", Phaser.Input.Keyboard.KeyCodes.UP],
        ["down2", Phaser.Input.Keyboard.KeyCodes.DOWN],
        ["left2", Phaser.Input.Keyboard.KeyCodes.LEFT],
        ["right2", Phaser.Input.Keyboard.KeyCodes.RIGHT],
      ] as const) {
        this.keys[name] = keyboard.addKey(code);
      }
    }
  }

  /** The furthest out you can go before the region stops filling the window. */
  private get minZoom(): number {
    const camera = this.scene.cameras.main;
    const fill = Math.max(camera.width / this.worldWidth, camera.height / this.worldHeight);
    return Math.max(ZOOM_FLOOR, Math.min(fill, MAX_ZOOM));
  }

  private clampZoom(): void {
    const camera = this.scene.cameras.main;
    const clamped = Phaser.Math.Clamp(camera.zoom, this.minZoom, MAX_ZOOM);
    if (clamped !== camera.zoom) camera.setZoom(clamped);
  }

  /** Keeps the tile under the cursor under the cursor while the zoom changes. */
  private zoomAt(pointer: Phaser.Input.Pointer, deltaY: number): void {
    const camera = this.scene.cameras.main;
    const before = { x: pointer.worldX, y: pointer.worldY };

    const next = deltaY > 0 ? camera.zoom / ZOOM_STEP : camera.zoom * ZOOM_STEP;
    camera.setZoom(Phaser.Math.Clamp(next, this.minZoom, MAX_ZOOM));

    // worldX/worldY are derived from the camera, so they have to be re-read after
    // the zoom to know how far the point under the cursor drifted.
    camera.preRender();
    camera.scrollX += before.x - pointer.worldX;
    camera.scrollY += before.y - pointer.worldY;
  }

  update(deltaMs: number): void {
    const camera = this.scene.cameras.main;
    const step = (KEY_PAN_SPEED * (deltaMs / 1000)) / camera.zoom;

    const held = (a: string, b: string): boolean => Boolean(this.keys[a]?.isDown || this.keys[b]?.isDown);
    if (held("left", "left2")) camera.scrollX -= step;
    if (held("right", "right2")) camera.scrollX += step;
    if (held("up", "up2")) camera.scrollY -= step;
    if (held("down", "down2")) camera.scrollY += step;
  }

  centreOn(x: number, y: number): void {
    this.scene.cameras.main.centerOn(x, y);
  }
}
