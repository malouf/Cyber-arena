import { useCallback, useEffect } from "react";
import { useGameStore } from "./gameStore";
import { selectPhase, selectSkipRequested, selectTurnTimer } from "./selectors";

export function TurnClock() {
  const phase = useGameStore(selectPhase);
  const turnTimer = useGameStore(selectTurnTimer);
  const skipRequested = useGameStore(selectSkipRequested);

  const setTurnTimer = useGameStore((s) => s.setTurnTimer);
  const requestSkip = useGameStore((s) => s.requestSkip);
  const runTurnResolution = useGameStore((s) => s.runTurnResolution);
  const clearQueue = useGameStore((s) => s.clearQueue);

  const player = useGameStore((s) => s.server.player);
  const enemy = useGameStore((s) => s.server.enemy);
  const cooldowns = useGameStore((s) => s.server.cooldowns);
  const usesThisTurn = useGameStore((s) => s.server.usesThisTurn);
  const persistentBuffs = useGameStore((s) => s.server.persistentBuffs);
  const actionQueue = useGameStore((s) => s.server.actionQueue);

  // Countdown timer for planning phase
  useEffect(() => {
    if (phase !== "planning") return;

    const interval = setInterval(() => {
      setTurnTimer(turnTimer - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, turnTimer, setTurnTimer]);

  // Auto-commit when timer hits 0
  useEffect(() => {
    if (phase === "planning" && turnTimer <= 0 && actionQueue.length > 0) {
      // Auto-commit with skip bonus
      requestSkip();
      runTurnResolution(player, enemy, [...actionQueue], {
        cooldowns: { ...cooldowns },
        usesThisTurn: { ...usesThisTurn },
        flowStateRange: persistentBuffs.flowStateRange,
        bonusPa: persistentBuffs.bonusPa,
        bonusPm: persistentBuffs.bonusPm,
        isRestTurn: true,
      });
    } else if (
      phase === "planning" &&
      turnTimer <= 0 &&
      actionQueue.length === 0
    ) {
      // No actions queued, just reset timer
      setTurnTimer(60);
    }
  }, [turnTimer, phase, actionQueue]);

  const handleSkipTurn = useCallback(() => {
    if (phase !== "planning") return;
    requestSkip();
    // If there are queued actions, commit with rest bonus
    if (actionQueue.length > 0) {
      runTurnResolution(player, enemy, [...actionQueue], {
        cooldowns: { ...cooldowns },
        usesThisTurn: { ...usesThisTurn },
        flowStateRange: persistentBuffs.flowStateRange,
        bonusPa: persistentBuffs.bonusPa,
        bonusPm: persistentBuffs.bonusPm,
        isRestTurn: true,
      });
    }
  }, [phase, actionQueue]);

  const handleClearAndReset = useCallback(() => {
    clearQueue();
    setTurnTimer(60);
  }, [clearQueue, setTurnTimer]);

  if (phase !== "planning") return null;

  const timerPercent = (turnTimer / 60) * 100;
  const isLow = turnTimer <= 10;

  return (
    <div className="bg-black border-b border-neutral-900 px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
            Turn
          </span>
          <span className="text-lg font-black text-white">
            {useGameStore.getState().server.turnNumber}
          </span>
        </div>

        {/* Timer Bar */}
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-neutral-900 relative overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                isLow ? "bg-red-600" : "bg-white"
              }`}
              style={{ width: `${timerPercent}%` }}
            />
          </div>
          <span
            className={`text-xs font-mono ${isLow ? "text-red-500 animate-pulse" : "text-neutral-500"}`}
          >
            {turnTimer}s
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {skipRequested ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-600/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
              Rest Bonus Active
            </span>
          </div>
        ) : (
          <>
            <button
              onClick={handleSkipTurn}
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-neutral-700 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip Turn
            </button>
            {actionQueue.length > 0 && (
              <button
                onClick={handleClearAndReset}
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-red-900/50 bg-red-900/10 text-red-500 hover:bg-red-900/30 transition-colors"
              >
                Clear Queue
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
