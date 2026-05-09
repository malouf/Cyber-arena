import type { CombatEvent, CombatStats, TurnStats } from "./types";

/**
 * Process a set of combat events to calculate turn statistics
 */
export function calculateTurnStats(events: Array<CombatEvent>): TurnStats {
  const stats: TurnStats = {
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
    manaSpent: 0,
    actionsExecuted: 0,
    distanceMoved: 0,
    damageMitigated: 0,
  };

  for (const event of events) {
    switch (event.type) {
      case "effect":
        // Parse effect text for damage values
        if (event.text.startsWith("-")) {
          const value = parseInt(event.text.slice(1), 10);
          if (!isNaN(value)) {
            stats.damageDealt += value;
          }
        }
        break;

      case "stats":
        // Used for tracking mana spent and healing
        break;

      case "rest_triggered":
        // Rest bonus - could add bonus tracking
        break;

      default:
        break;
    }
  }

  return stats;
}

/**
 * Aggregate multiple turn stats into cumulative combat stats
 */
export function aggregateStats(
  previous: CombatStats,
  turnStats: TurnStats,
): CombatStats {
  const newTotal: CombatStats = {
    totalDamageDealt: previous.totalDamageDealt + turnStats.damageDealt,
    totalDamageTaken: previous.totalDamageTaken + turnStats.damageTaken,
    totalHealingDone: previous.totalHealingDone + turnStats.healingDone,
    totalManaSpent: previous.totalManaSpent + turnStats.manaSpent,
    totalActionsExecuted: previous.totalActionsExecuted + turnStats.actionsExecuted,
    totalDistanceMoved: previous.totalDistanceMoved + turnStats.distanceMoved,
    totalDamageMitigated: previous.totalDamageMitigated + turnStats.damageMitigated,
    turnCount: previous.turnCount + 1,
    dps: 0,
    effectiveDamage: 0,
  };

  // Calculate DPS (damage per turn)
  if (newTotal.turnCount > 0) {
    newTotal.dps = newTotal.totalDamageDealt / newTotal.turnCount;
  }

  // Effective damage accounts for mitigation
  newTotal.effectiveDamage = newTotal.totalDamageDealt + newTotal.totalDamageMitigated;

  return newTotal;
}

export const initialCombatStats: CombatStats = {
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  totalHealingDone: 0,
  totalManaSpent: 0,
  totalActionsExecuted: 0,
  totalDistanceMoved: 0,
  totalDamageMitigated: 0,
  turnCount: 0,
  dps: 0,
  effectiveDamage: 0,
};

/**
 * Calculate specific metrics
 */
export function calculateDPS(totalDamage: number, turnCount: number): number {
  if (turnCount === 0) return 0;
  return totalDamage / turnCount;
}

export function calculateMitigationPercentage(
  mitigated: number,
  totalDamageTaken: number,
): number {
  if (totalDamageTaken + mitigated === 0) return 0;
  return (mitigated / (totalDamageTaken + mitigated)) * 100;
}

export function calculateResourceEfficiency(
  damage: number,
  manaSpent: number,
): number {
  if (manaSpent === 0) return 0;
  return damage / manaSpent;
}