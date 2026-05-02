# Gameplay Plan & Next Steps (Phase 4)

## Architecture Milestone Reached
With the successful extraction of `src/game/engine.ts`, the game rules are now isolated. This makes adding new gameplay mechanics significantly safer and faster.

## Immediate Gameplay Objectives

### 1. Advanced AI Simulation & Bot Drafting
The pure engine currently hardcodes the enemy's actions (basic movement and basic attacks).
- **Dynamic AI Building**: Before the match starts, generate a `PlayerBuild` for the bot (randomly selecting Primary, Secondary, Actives, and Passives).
- **AI Brain (`engine.ts`)**: Enhance the AI loop to evaluate its available skills, check cooldowns, and manage Mana.
- **Behavior Profiles**: Implement simple heuristics. For example, if the AI drafted 'Onde' (Ranged/Control), it should try to maintain distance rather than rushing in.

### 2. Status Effects & Terrain Hazards
We need to enrich the `EntityState` and `CombatEvent` system to support lingering effects.
- **New State Concept**: Add `statusEffects: Array<{ type: 'root' | 'silence' | 'vulnerable', duration: number }>` to `EntityState`.
- **Grid Hazards**: Traps like *Zone de Stase* need to be added to a `terrainFeatures` array in the state, updating dynamically and triggering when a unit steps on them.

### 3. "Nothing" Identity (VFX & Juiciness)
The aesthetic is minimalist (Black/White/Red), but it needs to feel visceral.
- **Hit Stops**: Slight artificial delays in the event playback when massive damage occurs.
- **Ghosting**: Show the projected path of a move or the AoE of a spell on the grid *before* clicking.
- **Glitch UI**: Introduce subtle CSS animations (screen tearing, noise) on the `ArenaHeader` when Ultimates are cast.

By focusing on these features offline, we will stress-test the `engine.ts`. Once it flawlessly handles complex interactions (like an AI getting pushed into a trap that roots it), we will be 100% ready for multiplayer.
