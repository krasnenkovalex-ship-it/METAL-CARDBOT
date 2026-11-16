# Game Design Document v0.1 — METAL CARDBOT labyrinth
## Vision
A polished, joyful 3D maze adventure in Russian for age 5, designed to be played alongside a parent. Two goals: adventure and useful learning, without making learning feel like a test.
## Core loop
1. A 10–20-second story beat establishes one clear objective.
2. Explore a distinct area with recognizable landmarks.
3. An interactive puzzle automatically starts on approach.
4. Solve it physically (connect, place, steer, remember), and see the world change.
5. Gather one optional collectible or rescue a companion.
6. Reach checkpoint, receive feedback, and stop naturally.
## Vertical slice: The Energy Gate (first milestone)
Start in a small clearing; control a friendly placeholder robot. Approach an energy station; trigger automatically, solve an introductory color puzzle, and watch the locked gate open. One visible objective throughout.
## Camera and controls
Third-person follow camera; physical WASD for locomotion, Space jump. Movement disabled while puzzle is open. Test AZERTY/Russian layouts where possible. Simple touch interface is a release gate.
## Longer campaign proposal
Ten short missions: Arrival; Echo Valley; Gear Factory Boss; Letter City; Counting Canyon; Ice Reactor Boss; Magnetic Valley; Cloud Lab; Storm Citadel Boss; Finale and Homebase.
The current build has ten short sequential missions in the shared Tech Forest world. The separate regions and bosses named above remain a longer campaign proposal, not implemented levels. See [09-ten-mission-campaign.md](09-ten-mission-campaign.md) for what can actually be played.
## Difficulty for five-year-olds
Two modes: Explorer (gentle, assisted, hints) and Hero (more movement and strategy). No forced timer, no loss of earned progress, replayable challenges. Parent can enable narration.
## Bosses
Short predictable attack cycles plus three environment-based puzzles. Boss never blocks progress permanently. No graphic violence.
## Success criteria
A child understands the first objective without reading, approaches the station naturally, sees the cause-and-effect of solving it, and can finish the section without adult intervention after the first instruction. Qualitative playtests required before asserting success.
## Art direction
High-quality stylized 3D with readable silhouettes, carefully authored animations, rich forest lighting, real landmark navigation and a 3D asset budget. Procedural boxes exist only in engineering prototyping, never in marketing screenshots.

