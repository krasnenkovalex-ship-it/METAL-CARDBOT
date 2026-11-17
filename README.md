# METAL CARDBOT — 2D REBOOT (Phaser 4)

A **separate, isolated 2D development branch** for a browser side-scrolling game. The earlier PlayCanvas 3D work stays on its own branches.

## Status
**Five playable Phaser stages, still in active development.** The gameplay now includes 5 themed rounds with 10 educational puzzles (choice, memory, color matching, and gear rotation), advanced telegraphed AI enemies, three transforming heroes, and stage-to-stage transitions. The campaign target is 10 unique worlds; rounds 6–10 remain planned, not implemented. These five rounds share a modular base level layout with varied physical side routes and biome mechanics. They are not yet approved as five fully independently art-directed levels.

## Technology
Phaser 4.2.1 + TypeScript + Vite + Arcade Physics + GitHub Actions. Node.js 22+.

## Getting started
```sh
npm install
npm run dev
npm test
npm run build
```

## Playing
Launch the app, select a hero and an unlocked round. Walk with A/D or arrows, Space to jump, E to transform, 1/2/3 to swap hero, left mouse to shoot and right mouse to punch (J/K alternatives); touchscreen has dedicated buttons.

A round requires **2 puzzles + 4 energy crystals**, and in stages 3 and 5, defeating an armored boss. Reach the portal to see the next-round screen. Completed rounds unlock in localStorage.

World interactions: a shootable bonus switch, bounce pads, moving platforms, convoy belts, sky wind and lightning visuals. Learning activities start automatically when approaching a terminal.

## QA commands
```sh
npm test
npm run typecheck
npm run build
npm run test:browser
```
CI captures browser screenshots and packages the dist preview. Screenshots, code checks and automated smoke tests are not a replacement for completing all five stages manually or measuring FPS on a phone.

## Scope and art direction
Read `AGENTS.md` and `docs/production-roadmap.md`. Use original or legally cleared artwork. Blue Cop / Metal Cardbot are third-party intellectual property; this repository is not affiliated with rights holders, and no ripped franchise assets or copyrighted soundtrack may be committed.

**Important:** This is a provisional branch in the existing public repository, *not* a newly created separate GitHub repository. A ZIP of the full starter is also provided in the ChatGPT conversation for creating an independent private repository.
