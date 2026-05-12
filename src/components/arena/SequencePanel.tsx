import { useShallow } from "zustand/shallow";
import { useGameStore } from "./gameStore";
import {
  selectActionQueue,
  selectLogs,
  selectPhase,
  selectSkipRequested,
} from "./selectors";

export function SequencePanel() {
  const actionQueue = useGameStore(selectActionQueue);
  const logs = useGameStore(selectLogs);
  const phase = useGameStore(selectPhase);
  const skipRequested = useGameStore(selectSkipRequested);
  const isResolving = phase !== "planning";
  const clearQueue = useGameStore((s) => s.clearQueue);
  const runTurnResolution = useGameStore((s) => s.runTurnResolution);
  const requestSkip = useGameStore((s) => s.requestSkip);

  const { player, enemy, cooldowns, usesThisTurn, persistentBuffs } =
    useGameStore(
      useShallow((s) => ({
        player: s.server.player,
        enemy: s.server.enemy,
        cooldowns: s.server.cooldowns,
        usesThisTurn: s.server.usesThisTurn,
        persistentBuffs: s.server.persistentBuffs,
      })),
    );

  const handleResolveTurn = async () => {
    if (phase !== "planning") return;
    if (actionQueue.length === 0) return;

    await runTurnResolution(player, enemy, [...actionQueue], {
      cooldowns: { ...cooldowns },
      usesThisTurn: { ...usesThisTurn },
      flowStateRange: persistentBuffs.flowStateRange,
      bonusPa: persistentBuffs.bonusPa,
      bonusPm: persistentBuffs.bonusPm,
      isRestTurn: skipRequested,
    });
  };

  const handleSkipTurn = () => {
    if (phase !== "planning") return;
    requestSkip();
    if (actionQueue.length > 0) {
      handleResolveTurn();
    }
  };

  const commitLabel =
    phase === "resolving"
      ? "Resolving..."
      : phase === "playback"
        ? "Playback..."
        : skipRequested
          ? "Commit (Rest)"
          : "Commit Sequence";

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      <div className="bg-neutral-950 border border-neutral-900 p-4 flex flex-col h-1/2">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              Sequence [{actionQueue.length}]
            </h3>
            {skipRequested && (
              <span className="text-[8px] font-bold text-green-500 bg-green-900/20 px-2 py-0.5 border border-green-600/30">
                REST
              </span>
            )}
          </div>
          <button
            disabled={isResolving}
            onClick={clearQueue}
            className="text-[9px] font-bold text-neutral-600 hover:text-red-600 uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
          {actionQueue.length === 0 ? (
            <p className="text-[9px] text-neutral-700 font-mono">
              No commands queued. Click abilities or use Skip Turn for rest
              bonus.
            </p>
          ) : (
            actionQueue.map((action, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-[9px] font-mono bg-neutral-900 px-3 py-2 border border-neutral-800"
              >
                <span className="text-neutral-300">
                  {(i + 1).toString().padStart(2, "0")}{" "}
                  {action.name.toUpperCase()}
                </span>
                <div className="flex gap-2">
                  <span className="text-neutral-600">
                    Init:{action.initiative}
                  </span>
                  {action.pmCost > 0 && (
                    <span className="text-neutral-500">-{action.pmCost}PM</span>
                  )}
                  {action.paCost > 0 && (
                    <span className="text-neutral-300">-{action.paCost}PA</span>
                  )}
                  {action.manaCost > 0 && (
                    <span className="text-blue-500">-{action.manaCost}M</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <button
            disabled={actionQueue.length === 0 || isResolving}
            onClick={handleResolveTurn}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.3em] transition-all
              ${
                actionQueue.length > 0 && !isResolving
                  ? skipRequested
                    ? "bg-green-600 text-white hover:bg-green-500"
                    : "bg-white text-black hover:bg-red-600 hover:text-white"
                  : "bg-neutral-900 text-neutral-700 cursor-not-allowed"
              }`}
          >
            {commitLabel}
          </button>
          {actionQueue.length === 0 && !isResolving && (
            <button
              onClick={handleSkipTurn}
              className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest border border-green-600/50 bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-colors"
            >
              Skip (Rest)
            </button>
          )}
        </div>
      </div>

      <div className="bg-neutral-950 border border-neutral-900 p-4 flex-1 overflow-y-auto font-mono text-[9px] text-neutral-500 space-y-1">
        {logs.map((log, i) => (
          <div key={i} className={log.startsWith(">") ? "text-white" : ""}>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
}
