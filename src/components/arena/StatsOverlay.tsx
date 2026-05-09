import { useGameStore } from "./gameStore";
import { selectCombatStats } from "./selectors";

export function StatsOverlay() {
  const combatStats = useGameStore(selectCombatStats);
  const toggleStatsOverlay = useGameStore((s) => s.toggleStatsOverlay);
  const resetCombatStats = useGameStore((s) => s.resetCombatStats);

  const formatNumber = (n: number, decimals = 1) => {
    return n.toFixed(decimals);
  };

  const mitigationPct =
    combatStats.totalDamageTaken + combatStats.totalDamageMitigated > 0
      ? (
          (combatStats.totalDamageMitigated /
            (combatStats.totalDamageTaken + combatStats.totalDamageMitigated)) *
          100
        ).toFixed(1)
      : "0.0";

  const damagePerAction =
    combatStats.totalActionsExecuted > 0
      ? (combatStats.totalDamageDealt / combatStats.totalActionsExecuted).toFixed(
          1,
        )
      : "0.0";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
      <div className="bg-neutral-950 border border-neutral-800 p-6 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black uppercase tracking-widest text-white">
            Combat Analytics
          </h2>
          <div className="flex gap-2">
            <button
              onClick={resetCombatStats}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={toggleStatsOverlay}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* DPS */}
          <div className="col-span-2 border border-neutral-900 p-4 bg-neutral-900/50">
            <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
              Damage Per Second (DPS)
            </div>
            <div className="text-3xl font-black text-white">
              {formatNumber(combatStats.dps)}
            </div>
            <div className="text-[9px] text-neutral-500 mt-1">
              Based on {combatStats.turnCount} turns
            </div>
          </div>

          {/* Damage Dealt */}
          <div className="border border-neutral-900 p-3">
            <div className="text-[8px] font-bold text-red-600 uppercase tracking-widest mb-1">
              Damage Dealt
            </div>
            <div className="text-2xl font-black text-red-400">
              {combatStats.totalDamageDealt}
            </div>
            <div className="text-[9px] text-neutral-500 mt-1">
              {damagePerAction} per action
            </div>
          </div>

          {/* Damage Taken */}
          <div className="border border-neutral-900 p-3">
            <div className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
              Damage Taken
            </div>
            <div className="text-2xl font-black text-neutral-300">
              {combatStats.totalDamageTaken}
            </div>
            <div className="text-[9px] text-neutral-500 mt-1">
              Mitigated: {combatStats.totalDamageMitigated} ({mitigationPct}%)
            </div>
          </div>

          {/* Mana Spent */}
          <div className="border border-neutral-900 p-3">
            <div className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mb-1">
              Mana Spent
            </div>
            <div className="text-2xl font-black text-blue-400">
              {combatStats.totalManaSpent}
            </div>
            <div className="text-[9px] text-neutral-500 mt-1">
              Efficiency: {combatStats.totalDamageDealt > 0 && combatStats.totalManaSpent > 0
                ? formatNumber(combatStats.totalDamageDealt / combatStats.totalManaSpent)
                : "0.0"} dmg/mana
            </div>
          </div>

          {/* Actions Executed */}
          <div className="border border-neutral-900 p-3">
            <div className="text-[8px] font-bold text-white uppercase tracking-widest mb-1">
              Actions Executed
            </div>
            <div className="text-2xl font-black text-white">
              {combatStats.totalActionsExecuted}
            </div>
            <div className="text-[9px] text-neutral-500 mt-1">
              Over {combatStats.turnCount} turns
            </div>
          </div>

          {/* Distance Moved */}
          <div className="border border-neutral-900 p-3">
            <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mb-1">
              Distance Moved
            </div>
            <div className="text-2xl font-black text-neutral-300">
              {combatStats.totalDistanceMoved}
            </div>
            <div className="text-[9px] text-neutral-500 mt-1">
              Cells traveled
            </div>
          </div>

          {/* Healing Done */}
          <div className="border border-neutral-900 p-3">
            <div className="text-[8px] font-bold text-green-500 uppercase tracking-widest mb-1">
              Healing Done
            </div>
            <div className="text-2xl font-black text-green-400">
              {combatStats.totalHealingDone}
            </div>
            <div className="text-[9px] text-neutral-500 mt-1">
              Self/healing effects
            </div>
          </div>
        </div>

        {/* Effective Damage Summary */}
        <div className="mt-4 p-4 border border-red-900/30 bg-red-900/5">
          <div className="text-[9px] font-bold text-red-500 uppercase tracking-widest mb-2">
            Effective Damage Output
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-neutral-500">
              Base Damage + Mitigation Bonus
            </span>
            <span className="text-xl font-black text-white">
              {combatStats.effectiveDamage}
            </span>
          </div>
          <div className="mt-2 flex gap-4">
            <div>
              <span className="text-[8px] text-neutral-600">Base: </span>
              <span className="text-[10px] font-mono text-neutral-400">
                {combatStats.totalDamageDealt}
              </span>
            </div>
            <div>
              <span className="text-[8px] text-neutral-600">Mitigated: </span>
              <span className="text-[10px] font-mono text-green-500">
                +{combatStats.totalDamageMitigated}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}