import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { soulData } from "../../game/data";
import { generateEnemyBuild } from "../../game/ai";

import { ArenaHeader } from "./ArenaHeader";
import { GridRenderer } from "./GridRenderer";
import { CommandPanel } from "./CommandPanel";
import { SequencePanel } from "./SequencePanel";
import { StatsOverlay } from "./StatsOverlay";
import { TurnClock } from "./TurnClock";
import { useGameStore } from "./gameStore";
import {
  getSimulatedResources,
  selectActiveCommand,
  selectEnemy,
  selectInteractables,
  selectPhase,
  selectPlayer,
} from "./selectors";
import type { PlayerBuild } from "./DraftPhase";
import type { Ability, EntityState } from "../../game/types";

type Props = {
  build: PlayerBuild;
  onAbort: () => void;
  onPhaseChange?: (phase: "planning" | "resolving" | "playback") => void;
};

export type ArenaPhase = "planning" | "resolving" | "playback";

export function ArenaView({ build, onAbort, onPhaseChange }: Props) {
  const pSoul = soulData[build.primary];

  const player = useGameStore(useShallow(selectPlayer));
  const enemy = useGameStore(useShallow(selectEnemy));
  const cooldowns = useGameStore((s) => s.server.cooldowns);
  const phase = useGameStore(selectPhase);
  const activeCommand = useGameStore(selectActiveCommand);
  const interactables = useGameStore(selectInteractables);
  const showStats = useGameStore((s) => s.ui.showStats);

  const setActiveCommand = useGameStore((s) => s.setActiveCommand);
  const simStats = useGameStore(useShallow(getSimulatedResources));
  const initializeGame = useGameStore((s) => s.initializeGame);

  // Extract passive IDs from loadout
  const passiveIds = useMemo(() => {
    const ids: Array<string> = [];
    for (const slot of build.loadout) {
      if (slot.kind === "passive") {
        ids.push(slot.passive.id);
      }
    }
    return ids;
  }, [build.loadout]);

  useEffect(() => {
    // Calculate base PM (may be reduced by heavy_plating)
    let basePm = pSoul.baseStats.pm;
    if (passiveIds.includes("heavy_plating")) {
      basePm = Math.max(0, basePm - 1);
    }

    const initialPlayerState: EntityState = {
      id: "player",
      hp: pSoul.baseStats.hp,
      maxHp: pSoul.baseStats.hp,
      pa: pSoul.baseStats.pa,
      maxPa: pSoul.baseStats.pa,
      pm: basePm,
      maxPm: basePm,
      mana: Math.min(2, pSoul.baseStats.mana),
      maxMana: pSoul.baseStats.mana,
      pos: { x: 2, y: 5 },
      passives: passiveIds,
      loadout: build.loadout,
      effects: [],
    };

    const initialEnemyState = generateEnemyBuild();

    initializeGame(initialPlayerState, initialEnemyState);
  }, [build, initializeGame, pSoul, passiveIds]);

  useEffect(() => {
    onPhaseChange?.(phase as "planning" | "resolving" | "playback");
  }, [phase, onPhaseChange]);

  const isResolving = phase !== "planning";

  const handleSetActiveCommand = (
    command: { type: "move" } | { type: "ability"; ability: Ability } | null,
  ) => {
    setActiveCommand(command);
  };

  return (
    <main className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans overflow-hidden">
      <ArenaHeader
        pSoul={pSoul}
        playerStats={player}
        simStats={simStats}
        enemyStats={enemy}
        phase={phase as "planning" | "resolving" | "playback"}
        onAbort={onAbort}
        onToggleStats={() => useGameStore.getState().toggleStatsOverlay()}
      />

      {/* Turn Clock */}
      <TurnClock />

      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 h-[calc(100vh-140px)]">
        <GridRenderer
          buildPassives={passiveIds}
          interactables={interactables}
        />

        <div className="w-full lg:w-[400px] flex flex-col gap-4">
          <CommandPanel
            activeCommand={activeCommand}
            setActiveCommand={handleSetActiveCommand}
            simStats={simStats}
            loadout={build.loadout}
            cooldowns={cooldowns}
            disabled={isResolving}
          />
          <SequencePanel />
        </div>
      </div>

      {/* Stats Overlay */}
      {showStats && <StatsOverlay />}
    </main>
  );
}
