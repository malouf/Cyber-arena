import { useGameStore } from "./gameStore";

export function SequencePanel() {
  const actionQueue = useGameStore((s) => s.server.actionQueue);
  const logs = useGameStore((s) => s.ui.logs);
  const phase = useGameStore((s) => s.ui.phase);
  const isResolving = useGameStore((s) => s.isResolving());
  const clearQueue = useGameStore((s) => s.clearQueue);
  const runTurnResolution = useGameStore((s) => s.runTurnResolution);

  const player = useGameStore((s) => s.server.player);
  const enemy = useGameStore((s) => s.server.enemy);
  const cooldowns = useGameStore((s) => s.server.cooldowns);
  const usesThisTurn = useGameStore((s) => s.server.usesThisTurn);
  const persistentBuffs = useGameStore((s) => s.server.persistentBuffs);

  const resolveTurn = async () => {
    if (phase !== "planning") return;
    if (actionQueue.length === 0) return;

    await runTurnResolution(player, enemy, [...actionQueue], {
      cooldowns: { ...cooldowns },
      usesThisTurn: { ...usesThisTurn },
      flowStateRange: persistentBuffs.flowStateRange,
      bonusPa: persistentBuffs.bonusPa,
    });
  };

  const commitLabel =
    phase === "resolving"
      ? "Resolving..."
      : phase === "playback"
        ? "Playback..."
        : "Commit Sequence";

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      <div className="bg-neutral-950 border border-neutral-900 p-4 flex flex-col h-1/2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
            Sequence [{actionQueue.length}]
          </h3>
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
              No commands queued.
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

        <button
          disabled={actionQueue.length === 0 || isResolving}
          onClick={resolveTurn}
          className={`w-full py-4 text-xs font-black uppercase tracking-[0.3em] transition-all
            ${
              actionQueue.length > 0 && !isResolving
                ? "bg-white text-black hover:bg-red-600 hover:text-white"
                : "bg-neutral-900 text-neutral-700 cursor-not-allowed"
            }`}
        >
          {commitLabel}
        </button>
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
