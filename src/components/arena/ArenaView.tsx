import { useEffect, useMemo } from "react";
import { useShallow } from "zustand/shallow";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMatchSync } from "../../hooks/useMatchSync";

import { soulData } from "../../game/data";
import { ArenaHeader } from "./ArenaHeader";
import { GridRenderer } from "./GridRenderer";
import { CommandPanel } from "./CommandPanel";
import { SequencePanel } from "./SequencePanel";
import { StatsOverlay } from "./StatsOverlay";
import { TurnClock } from "./TurnClock";
import { useGameStore } from "./gameStore";
import { useMultiplayerStore } from "./multiplayerStore";
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

type MatchMode = {
  matchId: string;
  clientId: string;
};

type Props = {
  build?: PlayerBuild;
  matchMode?: MatchMode;
  onAbort: () => void;
  onPhaseChange?: (phase: "planning" | "resolving" | "playback") => void;
};

export type ArenaPhase = "planning" | "resolving" | "playback";

export function ArenaView({ build, matchMode, onAbort, onPhaseChange }: Props) {
  const pSoul = build ? soulData[build.primary] : null;

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

  const queue = useMultiplayerStore((s) => s.queue);
  const clearQueue = useMultiplayerStore((s) => s.clearQueue);
  const pendingSubmit = useMultiplayerStore((s) => s.pendingSubmit);
  const setPendingSubmit = useMultiplayerStore((s) => s.setPendingSubmit);

  const submitTurn = useMutation(api.matches.submitTurn);
  const turnNumber = useGameStore((s) => s.server.turnNumber);

  // Sync with server state in multiplayer mode
  const { status, winner } = useMatchSync(
    matchMode?.matchId ?? null,
    matchMode?.clientId ?? null,
  );

  // Extract passive IDs from loadout for local mode
  const passiveIds = useMemo(() => {
    if (!build) return [];
    const ids: Array<string> = [];
    for (const slot of build.loadout) {
      if (slot.kind === "passive") {
        ids.push(slot.passive.id);
      }
    }
    return ids;
  }, [build?.loadout]);

  // For local mode, initialize from build
  useEffect(() => {
    if (matchMode || !build || !pSoul) return;

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

    import("../../game/ai").then(({ generateEnemyBuild }) => {
      const initialEnemyState = generateEnemyBuild();
      initializeGame(initialPlayerState, initialEnemyState);
    });
  }, [build, initializeGame, pSoul, passiveIds, matchMode]);

  useEffect(() => {
    onPhaseChange?.(phase as "planning" | "resolving" | "playback");
  }, [phase, onPhaseChange]);

  const isResolving = phase !== "planning";

  const handleSetActiveCommand = (
    command: { type: "move" } | { type: "ability"; ability: Ability } | null,
  ) => {
    setActiveCommand(command);
  };

  // Multiplayer: handle cell click from queue
  const handleCellClickMultiplayer = (
    cell: { x: number; y: number },
    command: { type: "move" } | { type: "ability"; ability: Ability } | null,
  ) => {
    if (!command || !matchMode || pendingSubmit) return;
    if (queue.length >= 6) return;

    const action =
      command.type === "move"
        ? { type: "move" as const, target: cell }
        : {
            type: "ability" as const,
            target: cell,
            abilityId: command.ability.id,
          };

    useMultiplayerStore.getState().addToQueue(action);
    handleSetActiveCommand(null);
  };

  // Multiplayer: submit turn
  const handleSubmitTurn = async () => {
    if (!matchMode || queue.length === 0 || pendingSubmit) return;

    setPendingSubmit(true);
    try {
      await submitTurn({
        matchId: matchMode.matchId,
        clientId: matchMode.clientId,
        turnNumber,
        queue,
      });
      clearQueue();
    } catch (error) {
      console.error("Turn submission failed:", error);
      setPendingSubmit(false);
    }
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

      {/* Turn Clock - disabled in multiplayer */}
      {!matchMode && <TurnClock />}

      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 h-[calc(100vh-140px)]">
        <GridRenderer
          buildPassives={passiveIds}
          interactables={interactables}
          onCellClick={
            matchMode && activeCommand
              ? (cell) => handleCellClickMultiplayer(cell, activeCommand)
              : undefined
          }
        />

        <div className="w-full lg:w-[400px] flex flex-col gap-4">
          {/* Multiplayer: Queue Control */}
          {matchMode && (
            <section className="border border-neutral-900 bg-neutral-950 p-4 space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 flex justify-between">
                <span>Multiplayer Queue</span>
                {activeCommand && (
                  <span className="text-red-500 animate-pulse">
                    Select target for{" "}
                    {activeCommand.type === "ability"
                      ? activeCommand.ability.name
                      : "Move"}
                  </span>
                )}
              </h3>

              {/* Queue Display */}
              <div className="space-y-2 max-h-32 overflow-auto pr-1">
                {queue.length === 0 ? (
                  <p className="text-[11px] text-neutral-600">
                    Select a command from the panel below, then click on the
                    grid to queue actions.
                  </p>
                ) : (
                  queue.map((action, index) => (
                    <div
                      key={index}
                      className="text-[11px] font-mono border border-neutral-800 p-2 flex justify-between items-center"
                    >
                      <span>
                        {index + 1}. {action.type.toUpperCase()}{" "}
                        {action.abilityId ? `(${action.abilityId})` : ""} → [
                        {action.target.x},{action.target.y}]
                      </span>
                      <button
                        onClick={() =>
                          useMultiplayerStore.getState().removeFromQueue(index)
                        }
                        className="text-neutral-500 hover:text-white text-xs ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={clearQueue}
                  disabled={queue.length === 0 || pendingSubmit}
                  className="border border-neutral-800 py-2 text-[10px] uppercase tracking-widest hover:border-white disabled:opacity-40"
                >
                  Clear ({queue.length})
                </button>
                <button
                  onClick={handleSubmitTurn}
                  disabled={queue.length === 0 || pendingSubmit}
                  className="bg-white text-black py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white disabled:opacity-40"
                >
                  {pendingSubmit ? "Submitting..." : "Commit"}
                </button>
              </div>

              {pendingSubmit && (
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 text-center">
                  Waiting for opponent...
                </p>
              )}
            </section>
          )}

          <CommandPanel
            activeCommand={activeCommand}
            setActiveCommand={handleSetActiveCommand}
            simStats={simStats}
            loadout={
              player.loadout.length > 0
                ? player.loadout
                : (build?.loadout ?? [])
            }
            cooldowns={cooldowns}
            disabled={isResolving || (!!matchMode && pendingSubmit)}
          />
          <SequencePanel />
        </div>
      </div>

      {/* Stats Overlay */}
      {showStats && <StatsOverlay />}

      {/* Match Completed Overlay */}
      {matchMode && status === "completed" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="border border-red-900 bg-red-950/30 p-8 text-center space-y-4 max-w-md">
            <h2 className="text-2xl font-black uppercase tracking-tight text-red-500">
              Match Complete
            </h2>
            <p className="text-lg text-white">
              {winner === "player"
                ? "Victory!"
                : winner === "enemy"
                  ? "Defeat"
                  : "Draw"}
            </p>
            <button
              onClick={onAbort}
              className="mt-4 border border-neutral-700 px-6 py-3 text-xs uppercase tracking-widest hover:border-white"
            >
              Return to Menu
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
