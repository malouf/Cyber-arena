import { useGameStore } from "./gameStore";
import { selectCombatStats, selectEnemyCombatStats } from "./selectors";
import type { CombatStats } from "../../game/types";

export function StatsOverlay() {
  const playerStats = useGameStore(selectCombatStats);
  const enemyStats = useGameStore(selectEnemyCombatStats);
  const toggleStatsOverlay = useGameStore((s) => s.toggleStatsOverlay);
  const resetCombatStats = useGameStore((s) => s.resetCombatStats);

  const formatNumber = (n: number, decimals = 1) => {
    return n.toFixed(decimals);
  };

  const getMitigationPct = (stats: CombatStats) =>
    stats.totalDamageTaken + stats.totalDamageMitigated > 0
      ? (
          (stats.totalDamageMitigated /
            (stats.totalDamageTaken + stats.totalDamageMitigated)) *
          100
        ).toFixed(1)
      : "0.0";

  return (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-neutral-900">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">
              Tactical Analytics
            </h2>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">
              Sequence performance report - Turn {playerStats.turnCount}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetCombatStats}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-600 transition-all"
            >
              Reset Data
            </button>
            <button
              onClick={toggleStatsOverlay}
              className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-neutral-700 bg-white text-black hover:bg-neutral-200 transition-all"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Player Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-white" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">
                Subject: Player
              </h3>
            </div>

            <StatCard
              label="Damage Output"
              value={playerStats.totalDamageDealt}
              subValue={`${formatNumber(playerStats.dps)} per turn`}
              color="text-white"
            />

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Damage Taken"
                value={playerStats.totalDamageTaken}
                subValue={`${playerStats.totalDamageMitigated} mitigated (${getMitigationPct(playerStats)}%)`}
                compact
              />
              <StatCard
                label="Mana Efficiency"
                value={playerStats.totalManaSpent}
                subValue={`${playerStats.totalManaSpent > 0 ? formatNumber(playerStats.totalDamageDealt / playerStats.totalManaSpent) : "0.0"} dmg/mana`}
                compact
                color="text-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Distance"
                value={playerStats.totalDistanceMoved}
                subValue="Cells traveled"
                compact
              />
              <StatCard
                label="Actions"
                value={playerStats.totalActionsExecuted}
                subValue="Combat maneuvers"
                compact
              />
            </div>
          </div>

          {/* Enemy Column */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-red-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-red-500">
                Target: Enemy
              </h3>
            </div>

            <StatCard
              label="Damage Output"
              value={enemyStats.totalDamageDealt}
              subValue={`${formatNumber(enemyStats.dps)} per turn`}
              color="text-red-500"
            />

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Damage Taken"
                value={enemyStats.totalDamageTaken}
                subValue={`${enemyStats.totalDamageMitigated} mitigated (${getMitigationPct(enemyStats)}%)`}
                compact
              />
              <StatCard
                label="Mana Efficiency"
                value={enemyStats.totalManaSpent}
                subValue={`${enemyStats.totalManaSpent > 0 ? formatNumber(enemyStats.totalDamageDealt / enemyStats.totalManaSpent) : "0.0"} dmg/mana`}
                compact
                color="text-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                label="Distance"
                value={enemyStats.totalDistanceMoved}
                subValue="Cells traveled"
                compact
              />
              <StatCard
                label="Actions"
                value={enemyStats.totalActionsExecuted}
                subValue="Combat maneuvers"
                compact
              />
            </div>
          </div>
        </div>

        {/* Effective Comparison */}
        <div className="mt-12 p-6 border border-neutral-900 bg-neutral-900/30 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex-1 w-full">
            <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4">
              Relative Damage Dominance
            </div>
            <div className="w-full h-4 bg-neutral-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-white transition-all duration-1000"
                style={{
                  width: `${(playerStats.totalDamageDealt / (playerStats.totalDamageDealt + enemyStats.totalDamageDealt || 1)) * 100}%`,
                }}
              />
              <div
                className="h-full bg-red-600 transition-all duration-1000"
                style={{
                  width: `${(enemyStats.totalDamageDealt / (playerStats.totalDamageDealt + enemyStats.totalDamageDealt || 1)) * 100}%`,
                }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-mono text-white">
                {Math.round(
                  (playerStats.totalDamageDealt /
                    (playerStats.totalDamageDealt +
                      enemyStats.totalDamageDealt || 1)) *
                    100,
                )}
                % Player
              </span>
              <span className="text-[10px] font-mono text-red-500">
                {Math.round(
                  (enemyStats.totalDamageDealt /
                    (playerStats.totalDamageDealt +
                      enemyStats.totalDamageDealt || 1)) *
                    100,
                )}
                % Enemy
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subValue,
  color = "text-neutral-300",
  compact = false,
}: {
  label: string;
  value: string | number;
  subValue: string;
  color?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`border border-neutral-900 p-4 bg-black/40 ${compact ? "py-3" : "py-5"}`}
    >
      <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
        {label}
      </div>
      <div
        className={`${compact ? "text-xl" : "text-3xl"} font-black ${color}`}
      >
        {value}
      </div>
      <div className="text-[9px] text-neutral-600 mt-1 uppercase">
        {subValue}
      </div>
    </div>
  );
}
