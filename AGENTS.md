# METAL CARDBOT 2D — team rules
1. This is a *separate 2D Phaser reboot*. The old PlayCanvas 3D prototype is on other branches.
2. `src/data/levels.ts` contains the plan for 10 levels; Levels 1–5 are implemented using shared physics/world geometry and five themed round configurations in `src/data/rounds.ts`. Levels 6–10 remain concepts only. Never claim 10 playable levels. Do not claim independent full gameplay walkthroughs without evidence.
3. Art quality is the main milestone: layered backgrounds, rigged/animated character atlases, original interactive props and VFX. Geometric graphics are temporary, not publishable final art.
4. Puzzle activates automatically when hero approaches. Right answer changes the world (bridge, gate, boss shield). No F/E required for puzzles.
5. Non-punitive gameplay for a five-year-old: no failure timer, pictorial clues, unlimited retry and optional spoken hints.
6. W/A/S/D and arrows, Space jump, E transformation. Implement keyboard-layout-independent controls and tested mobile touch control before mobile release.
7. All official Metal Cardbot / Blue Cop characters, logos and music require rights for public distribution. Do not commit ripped assets or use protected Mario graphics.
8. Each PR: unit tests, typecheck, build, browser smoke, screenshots, art approval. Real device FPS cannot be invented.
9. Five functional rounds must be a meaningful playable sequence, not just five names. Keep interactions distinctive and all ten puzzles solvable; see docs/09-five-rounds.md.
10. Every attack telegraphs clearly and can be avoided by a five-year-old. Avoid surprise punishment and softlocks.
