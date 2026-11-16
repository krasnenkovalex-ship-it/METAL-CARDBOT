# Character production brief — Blue Cop (M1)
**Status:** original 3D assets not yet produced. This document is a specification, not a model.
## Target
Beloved hero: Blue Cop of Metal Cardbot, blue/white transforming police patrol car with gold accents, blue torso, mechanical limbs, angular helmet/crest, wheel details and readable silhouette. The game's player-facing character is Blue Cop.
Official franchise character is not owned by this project. For the public repository, do not upload ripped TV/game models, official textures, brand logos or any third-party derivative assets without clear permission. We can implement mechanics and use original temporary models. A public licensed release requires clearance or redesigning the character.
## Model pipeline
- Robot: `public/assets/characters/hero-robot.glb`.
- Vehicle: `public/assets/characters/hero-vehicle.glb`.
- Both glTF 2.0 GLB, meters, Y-up, pivot at ground contact, face toward local -Z. Same coordinate system and pivot for seamless switching.
- Both use PBR metallic-roughness materials, baked normal maps, efficient atlas textures, and clear silhouette from third-person camera.
- Target budgets (initial proposal, to profile): desktop ~30–50k triangles for hero, mobile LOD ~8–15k; 1–2 atlases of 2048 (desktop) / 1024 (mobile), KTX2 if supported and tested.
- Robot rig: shoulders, elbows, hips, knees, ankles, neck, torso, fingers only where visible; wheels and car panels separate rigid joint children.
- Required clips: Idle, Walk, Run, JumpStart, JumpLoop, Land, TransformToCar, TransformToRobot, Hit, Victory. Car: Idle, Drive, Brake, Drift (optional).
- Transition contract: 0.85s for both forms as initial implementation. Events at 0s (start), ~0.42s (visual handoff), 0.85s (movement resumes). Final timing should be synchronized to authored animation.
- Audio: separate original SFX for joints, tires, metal locks and completion; no copyrighted TV track.
## Art acceptance
At 1280×720: appealing proportions, no square placeholder limbs, no obvious mesh clipping, natural idle and locomotion, wheel continuity, aligned shadows. Must play on a real browser via WebGL2. Capture 30s video and review with parent before extending world.
## Engineering status
- [x] Movement and transformation logic independent from render engine.
- [x] GLB resource loader uses PlayCanvas container assets and instantiateRenderEntity.
- [x] Russian-layout-safe physical keyboard input.
- [ ] Licensed and polished 3D GLB pair.
- [ ] Full authored rig animations and transitions.
- [ ] Animated car tires, impact and VFX.
- [ ] Measured desktop/mobile FPS.
