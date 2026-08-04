import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    port: 8080,
  },
  build: {
    minify: "terser",
    rolldownOptions: {
      output: {
        // Rolldown (Vite 8's bundler) only accepts the function form here —
        // the `{ phaser: ["phaser"] }` object form silently became a hard error.
        manualChunks(id: string): string | undefined {
          return id.includes("/phaser/") ? "phaser" : undefined;
        },
      },
    },
  },
});
