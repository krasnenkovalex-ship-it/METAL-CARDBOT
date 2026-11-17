# METAL CARDBOT 2D — Physics Rebuild, Vertical Slice 1

## Goal
Fix the verified user-facing problems in v5: blocked movement around platforms, unpredictable automatic spring activation, low-quality generic quizzes and unfounded confidence from basic scene smoke tests. The previous five-round campaign stays untouched on its own branch.

## Implemented in this branch
- `PlayerMotor.ts`: smooth per-second acceleration and braking (rather than frame-count shortcuts), coyote time (125 ms), jump buffer (135 ms), early-release jump cut and ice friction. Pure deterministic tests at 30 and 60 FPS.
- `SpringContact.ts` + `SpringPad.ts`: spring is triggered by actual foot contact and descent, not simply by `Math.abs(player.x - 2030)`. Includes cooldown and physical compression/spark feedback.
- `KinematicPlatform.ts`: physical velocity-based movable Arcade body and visual art follow, instead of tweening static colliders; explicit one-way collision rules. Tests include a Playwright component scene for rider alignment.
- `WorldPuzzleRules.ts`, `WorldPuzzle.ts`: two automatically triggered first-level challenges are part of the world:
  - reactor: select a physical color node and matching socket; each connection adds a visible cable; final connection opens the bridge;
  - generator: memorize three flashed power relays, then press the real nodes to activate the gate.
- The other four stages keep their previous v5 puzzle implementation until the rebuilt first level is approved.
- Existing robot/car transformation, mouse shooting, hand attacks and 3-hero selection remain.

## Acceptance and evidence
- Unit tests: new player motor, spring collision and world puzzle state.
- Browser: real keyboard movement to reactor, real mouse matching of three wiring pairs, bridge opening; contact spring bounce; mobile transformation; 5 stage boots; action controls; first two non-rebuilt puzzle modes.
- Additional browser test: physically moving stage-2 upper ledge and player alignment on it, not just a screenshot.
- GitHub Actions URL linked from pull request. **Do not call this a validated full playthrough**; it currently verifies isolated paths and components, not a continuous 1→5 journey.

## Art truth
- **Source-controlled** character sprites and scenes are still original SVG stand-ins. This branch does not contain final licensed official Metal Cardbot art.
- A **separate locally packaged single-file preview** can use original generated panoramic painting and higher-detail hero portraits, but the generated image assets are not part of this GitHub commit. The preview has syntax/data-URI checks; its independent local Chromium run is blocked by environment policy. Do not treat it as fully validated or claim that it matches the GitHub screenshot.
- Further work needs a real spritesheet/rig, complete tileset, animated particles, audio and a separate art approval review.

## Known limits / next production milestone
1. An independently authored level-map and consistent physical geometry for meaningful route branches, not x-coordinate scripts or five copies of the same layout.
2. Real motion-capture/playtest of spring, moving ledge and mobile feel across 30/60 FPS. Add any failing cases as regression tests.
3. Move two more puzzle types into the world and provide progression feedback without text dependence.
4. Only then revisit polish and five levels; do not patch the v5 graph indefinitely.

**Gate:** keep PR draft; never merge into main without manual gameplay and visual review.
