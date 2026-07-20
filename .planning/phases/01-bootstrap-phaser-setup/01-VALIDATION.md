---
phase: 1
slug: bootstrap-phaser-setup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-20
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Derived from `01-RESEARCH.md` § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — greenfield repo, no `package.json` yet. Phase 1 is scaffolding only; its success criteria are compiler/build/structure checks, not behavioral tests. Vitest deferred to Phase 3 (pure-TS GameState) where unit tests first have something to assert. |
| **Config file** | none — Wave 0 creates `package.json`, `tsconfig.json`, `eslint.config.js` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` (= `tsc --noEmit && vite build`) |
| **Estimated runtime** | ~5–15 seconds (cold `vite build` on a Phaser-sized bundle) |

---

## Sampling Rate

- **After every task commit:** `npx tsc --noEmit`
- **After every plan wave:** `npm run build` + `npm run lint` + structural existence check
- **Before `/gsd-verify-work`:** `npm run build` green, `npm run lint` green, and one manual `npm run dev` browser glance (blank canvas, zero console errors)
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

Phase 1 has **no traceable REQ-IDs** (pure scaffolding, per ROADMAP.md and CONTEXT.md).
Verification is anchored to the four ROADMAP success criteria instead.

| Success Criterion | Test Type | Automated Command | Automatable | Status |
|---|---|---|---|---|
| SC-1: Vite dev server runs with HMR, Phaser 4 loads without errors | smoke | `npm run build` succeeds; scripted `vite` boot-and-kill emits no error output | partial — HMR loop itself is interactive | ⬜ pending |
| SC-2: TypeScript compiles in strict mode with no warnings | automated | `npx tsc --noEmit` (exit 0) | ✅ full | ⬜ pending |
| SC-3: Game scene initializes and renders a blank canvas | smoke | `vite build` succeeds AND `dist/index.html` + `dist/assets/*.js` exist | partial — true pixel proof needs Playwright | ⬜ pending |
| SC-4: Project structure follows Phaser conventions | automated | existence check: `src/game.config.ts`, `src/main.ts`, `src/scenes/{Boot,Preload,Game}Scene.ts`, `src/game/{entities,jobs,resources}/`, `src/ui/`, `public/assets/{tilesets,maps,sprites}/` | ✅ full | ⬜ pending |
| Lint gate (D-09 ESLint flat config) | automated | `npm run lint` (exit 0) | ✅ full | ⬜ pending |

*Task-level rows are appended by `/gsd-execute-phase` as tasks land.*

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `package.json` — scripts `dev`, `build`, `lint`, `typecheck`; `typescript` pinned `~5.9.3` (NOT bare/latest — TypeScript 7.0 breaks `typescript-eslint`, whose peer range is `>=4.8.4 <6.1.0`)
- [ ] `tsconfig.json` — `strict: true`, `moduleResolution: "bundler"`, `types: ["vite/client"]`
- [ ] `eslint.config.js` — flat config, `typescript-eslint` v8
- [ ] No test framework installed — intentional. Phase 1's criteria are fully served by `tsc`, `vite build`, `eslint`, and structural checks.

---

## Manual-Only Verifications

| Behavior | Criterion | Why Manual | Test Instructions |
|----------|-----------|------------|-------------------|
| HMR actually hot-reloads without stacking duplicate canvases | SC-1 | Requires a live dev server + file edit + browser observation; no cheap headless equivalent | `npm run dev`, open the page, edit `GameScene.ts`, save. Confirm exactly one `<canvas>` element remains in the DOM and no `Phaser.Game` instance leaks (validates the `import.meta.hot.dispose(() => game.destroy(true))` guard). |
| Blank canvas visibly renders, centered, aspect-preserved | SC-3 | Pixel-level proof requires browser automation (Playwright), a dependency Phase 1 does not otherwise need | `npm run dev`, open the page. Confirm a centered 1280×720-logical canvas scaled via `Phaser.Scale.FIT`, and a clean browser console. |

*Adding Playwright for headless visual proof is deferred — revisit when a phase needs visual regression coverage.*

---

## Validation Sign-Off

- [ ] All tasks have an `<automated>` verify command or a Wave 0 dependency
- [ ] Sampling continuity: no 3 consecutive tasks without an automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags in any verify command (`vite build`, not `vite`; `tsc --noEmit`, not `tsc --watch`)
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
