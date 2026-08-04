import Phaser from "phaser";

export class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, "Civilization Game", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#8fbc8f",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 40, "boot ok", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#555555",
      })
      .setOrigin(0.5);
  }
}
