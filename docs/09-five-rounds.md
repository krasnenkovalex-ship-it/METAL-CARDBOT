# Five Round Milestone — v5

## Delivered in source
Five playable stage configurations in `src/data/rounds.ts`, two stage-specific puzzles each, six AI enemies/round, four pickups/round, transition screen with Next Round and saved unlock. Three heroes retain distinct combat stats and transform.

| Round | Environment | Core world mechanic | Educational tasks | Encounter |
|---|---|---|---|---|
| 1 | Technoforest | Spring and energy bridge | Color pattern + battery counting | Ground robots, drone, optional sentinel |
| 2 | Sky Valley | Wind + moving floating platforms | Light sequence memory + rotating lift gear | Charging robot, hovering drone, turret |
| 3 | Gear Factory | Conveyor and moving gears | Gear alignment + structural logic | Boss sentinel shield, armored chargers |
| 4 | Ice Caves | Ice slide + ice moving ledges | Mirror alignment + snow sequence | Hopping robots, drones, turret |
| 5 | Storm Citadel | Lightning effects + spring | Match 3 wire pairs + boss launch code memory | Boss sentinel with three health phases |

### Enemy intelligence
Deterministic `EnemyBrain.ts` selects patrol, warning, charge, recovery. Chargers wind up before dash; drones hover and dive; hoppers bounce; turrets project visible slow bolts; boss uses phases as health falls. Combat logic and skill-specific damage reside in `CombatSystem.ts`.

### Interactive objects
- Energy bridges and world gates react to puzzle completion.
- A glowing secret target can be shot (or struck) to activate a physical health pickup.
- Moving elevated platforms and themed jump boosters change traversal.
- Five biomes have additional platforms and scenery, not only new labels.
- Puzzles automatically launch on approach; cancelled puzzles reopen only after leaving.

### QA / product limitations
- Unit tests: five stages, progression guard, four puzzle modes, telegraphed AI.
- Browser smoke: each of five stage scenes boots, memory/dial clicks, Next Round button; existing hero/mouse/mobile smoke.
- No claim of full autonomous playthrough from round 1 to 5 unless separately demonstrated.
- Shared underlying terrain means this is a **five-round expansion of the vertical slice**, not five wholly independently drawn environments.
- Original vector-based stylized characters are **not** screen-accurate official franchise art. Do not upload TV rip sprites.
- No real-device performance measurements or child playtest yet.
- Still aiming toward 10 worlds; rounds 6–10 are not implemented.
