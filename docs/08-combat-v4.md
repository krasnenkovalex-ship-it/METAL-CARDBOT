# 2D combat / Three-hero milestone (v0.4)

## Why this iteration exists
Previous build had only hero movement and a 2-button puzzle. There was no mouse combat, no enemy AI and only a generic blue robot. This milestone adds playable distinct characters, combat, enemy variety and visual feedback.

## Character roster
- **Blue Cop**: fast blue police mecha; blue energy projectile; balanced 4 HP.
- **Mega Trucker**: orange heavy construction robot / dump truck; slower and heavier projectiles; 6 HP.
- **Phoenix Fire**: red fire-rescue mecha / ladder fire engine; fast fire bolts; 3 HP.

These are original **fan-game stylizations / SVG stand-ins**, not screenshots, extracted official game assets or a rights grant. Final portrait/animation fidelity must be reviewed with legitimate references and proper permission for public redistribution.

## Inputs
- A / D or arrow keys: move.
- Space: jump (robot only).
- E: transform into vehicle and back.
- 1 / 2 / 3: switch to Blue Cop / Mega Trucker / Phoenix Fire at any time outside puzzle overlays.
- **Left mouse click:** directional energy projectile toward clicked world position.
- **Right mouse click:** short-range punch/slam to the side hero faces. Browser context menu disabled over game.
- J / K: shoot forward / melee (keyboard alternatives).
- On touch screens: directional pad, Jump, Transform, Shoot and Punch.

## Enemies and damage
- Ground crawlers: close-range patrol with approach behaviour and 3 HP.
- Flying drones: hover, drift and close contact, 2 HP.
- Armored sentinel: high-health miniboss, sends slow telegraphed projectiles.
- Contact damage has 1.3-second recovery cooldown. Getting hurt returns to a checkpoint; unlocked puzzle gates and collected crystals remain. No game over.
- Every shot and punch is validated by distance, direction, cooldown and hit effects.

## Definition of done
CI must show green unit, typecheck, build and browser tests. Browser scenarios cover three-character selection, left/right click attacks, automatic puzzle start, bridge unlock and mobile transformation.
Manual test remains needed: hit each of six enemy positions, all 4 energy cells, generator, portal, Safari/Android touch and measured frame rates. No claim of production-quality 12-frame animation or complete 10-level campaign.

## Known blockers
- GitHub repo is public; art is temporary fan imagery, not licensed official Blue Cop/Mega Trucker/Phoenix Fire art.
- Only one level in Phaser is playable; nine remain GDD plans.
- Full E2E through the final portal and real-device performance are not yet covered.
