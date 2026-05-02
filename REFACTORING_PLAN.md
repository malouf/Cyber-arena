# Architecture & Refactoring Plan (UPDATED)

## Current Status: ✅ Phase 1 Completed
The massive monolithic `practice.tsx` has been successfully shattered into a clean, scalable architecture. 

### What was achieved:
1. **Data & Types Extraction**: `src/game/types.ts` and `src/game/data.ts` now hold all pure data structures and static content.
2. **The Pure Engine**: `src/game/engine.ts` contains the `resolveTurn` function. It is a 100% pure function that takes states and queues, and outputs `CombatEvents`. It has ZERO adherence to React, meaning it is **ready to be executed on the Convex backend**.
3. **UI Componentization**: `practice.tsx` is now just 20 lines. The UI lives in `src/components/arena/`:
   - `DraftPhase.tsx`
   - `ArenaHeader.tsx`
   - `GridRenderer.tsx`
   - `CommandPanel.tsx`
   - `SequencePanel.tsx`

## Next Steps (Phase 2 - State Optimization)
While the code is split cleanly, `ArenaView.tsx` still manages a lot of `useState` hooks (playerStats, enemyStats, cooldowns, actionQueue) and orchestrates the event playback.

**Goal**: Introduce a robust state manager before adding complex status effects.
- **Option A (React `useReducer`)**: Create a single `gameReducer` to handle actions like `ADD_COMMAND`, `RESOLVE_TURN`, `APPLY_EVENT`.
- **Option B (Zustand)**: Move the entire game state into a global store. This would allow deeply nested components (like `GridRenderer`) to read their data directly without massive prop drilling.

*Recommendation*: Since we want to eventually sync this state with Convex, maintaining a clear separation between "Server State" (HP, cooldowns, positions) and "Local UI State" (Hovered cell, Draft phase) is paramount. We will likely transition to using Convex as our state manager for the game variables, keeping only UI variables in React state.
