import type { EntityState, Soul } from "../../game/types";
import type { ArenaPhase } from "./types";

type Props = {
  pSoul: Soul;
  playerStats: EntityState;
  simStats: { pa: number; pm: number; mana: number };
  enemyStats: EntityState;
  phase: ArenaPhase;
  onAbort: () => void;
};

export function ArenaHeader({
  pSoul,
  playerStats,
  simStats,
  enemyStats,
  phase,
  onAbort,
}: Props) {
  const phaseLabel =
    phase === "planning"
      ? "Planning"
      : phase === "resolving"
        ? "Resolving"
        : "Playback";

  return (
    <header className="px-6 py-4 border-b border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black z-50">
      <div className="flex items-center gap-6">
        <button
          onClick={onAbort}
          className="text-neutral-500 hover:text-white transition-colors uppercase font-bold text-xs tracking-widest"
        >
          ← Abort
        </button>
        <div className="h-4 w-px bg-neutral-800" />
        <h1 className="text-xl font-black uppercase tracking-tighter text-white">
          Sim<span className="text-red-600">.</span>Arena
        </h1>
        <span
          className={`rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${
            phase === "planning"
              ? "border-white/30 text-white"
              : phase === "resolving"
                ? "border-red-600/60 text-red-500"
                : "border-blue-500/50 text-blue-400"
          }`}
        >
          {phaseLabel}
        </span>
      </div>

      <div className="flex gap-8 items-end">
        <div className="text-right">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 text-left">
            Subject: {pSoul.name}
          </p>
          <div className="flex gap-4">
            <div>
              <p className="text-[8px] text-red-600 uppercase mb-1">
                HP ({playerStats.hp})
              </p>
              <div className="flex gap-[2px]">
                {Array.from({ length: Math.ceil(playerStats.maxHp / 10) }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-1.5 ${
                        i < Math.ceil(playerStats.hp / 10)
                          ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                          : "bg-neutral-900"
                      }`}
                    />
                  ),
                )}
              </div>
            </div>
            <div>
              <p className="text-[8px] text-neutral-400 uppercase mb-1">PA</p>
              <div className="flex gap-1">
                {Array.from({ length: playerStats.maxPa }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-1.5 ${
                      i < simStats.pa
                        ? "bg-white"
                        : "bg-neutral-900 border border-neutral-800"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[8px] text-neutral-400 uppercase mb-1">PM</p>
              <div className="flex gap-1">
                {Array.from({ length: playerStats.maxPm }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-1.5 ${
                      i < simStats.pm
                        ? "bg-neutral-400"
                        : "bg-neutral-900 border border-neutral-800"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-[8px] text-blue-500 uppercase mb-1">Mana</p>
              <div className="flex gap-1">
                {Array.from({ length: playerStats.maxMana }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-1.5 rounded-full ${
                      i < simStats.mana
                        ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]"
                        : "bg-neutral-900"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-neutral-900 hidden md:block" />

        <div className="text-right">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 text-right">
            Target: Enemy
          </p>
          <div>
            <p className="text-[8px] text-red-600 uppercase mb-1 text-right">
              HP ({enemyStats.hp})
            </p>
            <div className="flex gap-[2px] justify-end">
              {Array.from({ length: Math.ceil(enemyStats.maxHp / 10) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-1.5 ${
                      i < Math.ceil(enemyStats.hp / 10)
                        ? "bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]"
                        : "bg-neutral-900"
                    }`}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
