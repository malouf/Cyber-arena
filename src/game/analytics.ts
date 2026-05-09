import type { CombatEvent, CombatStats, TurnStats } from "./types";

/**
 * Process a set of combat events to calculate turn statistics for a specific entity
 */
export function calculateTurnStats(
  events: Array<CombatEvent>,
  entityId: "player" | "enemy",
): TurnStats {
  const stats: TurnStats = {
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
    manaSpent: 0,
    actionsExecuted: 0,
    distanceMoved: 0,
    damageMitigated: 0,
    abilityBreakdown: {},
  };

  let prevMana: number | null = null;
  let prevPos: { x: number; y: number } | null = null;

  for (const event of events) {
    switch (event.type) {
      case "effect":
        if (event.text.startsWith("-")) {
          const value = parseInt(event.text.slice(1), 10);
          if (!isNaN(value)) {
            if (event.target === entityId) {
              stats.damageTaken += value;
            } else if (event.target) {
              stats.damageDealt += value;
            }
          }
        } else if (event.text.startsWith("+")) {
          const value = parseInt(event.text.slice(1), 10);
          if (!isNaN(value) && event.target === entityId) {
            stats.healingDone += value;
          }
        }
        break;

      case "stats":
        if (event.entity === entityId && event.mana !== undefined) {
          if (prevMana !== null && event.mana < prevMana) {
            stats.manaSpent += prevMana - event.mana;
          }
          prevMana = event.mana;
        }
        break;

      case "move":
        if (event.entity === entityId) {
          if (prevPos) {
            const dist = Math.max(
              Math.abs(event.pos.x - prevPos.x),
              Math.abs(event.pos.y - prevPos.y),
              Math.abs(event.pos.x + event.pos.y - (prevPos.x + prevPos.y)),
            );
            stats.distanceMoved += dist;
          }
          prevPos = event.pos;
        }
        break;

      case "mitigation":
        if (event.entity === entityId) {
          stats.damageMitigated += event.amount;
        }
        break;

      case "healing":
        if (event.entity === entityId) {
          stats.healingDone += event.amount;
        }
        break;

      case "attack":
        if (event.entity === entityId && event.hit) {
          const abilityName = event.abilityName || "Basic Attack";
          stats.abilityBreakdown[abilityName] =
            (stats.abilityBreakdown[abilityName] || 0) + event.damage;
        }
        break;

      case "log":
        if (
          event.text.includes("mitigated") &&
          entityId === "player" &&
          event.text.includes("Heavy Plating")
        ) {
          const match = event.text.match(/mitigated (\d+)/);
          if (match) stats.damageMitigated += parseInt(match[1], 10);
        }
        if (event.text.includes("absorbed") && entityId === "player") {
          const match = event.text.match(/absorbed (\d+)/);
          if (match) stats.damageMitigated += parseInt(match[1], 10);
        }
        break;

      default:
        break;
    }
  }

  // Count actions (non-move) as actions executed
  stats.actionsExecuted = events.filter(
    (e) =>
      e.type === "log" &&
      e.text.includes("uses") &&
      ((entityId === "player" && e.text.includes("Player")) ||
        (entityId === "enemy" && e.text.includes("Enemy"))),
  ).length;

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
    totalActionsExecuted:
      previous.totalActionsExecuted + turnStats.actionsExecuted,
    totalDistanceMoved: previous.totalDistanceMoved + turnStats.distanceMoved,
    totalDamageMitigated:
      previous.totalDamageMitigated + turnStats.damageMitigated,
    turnCount: previous.turnCount + 1,
    dps: 0,
    effectiveDamage: 0,
    abilityBreakdown: { ...previous.abilityBreakdown },
  };

  // Aggregate ability breakdown
  for (const [abilityId, damage] of Object.entries(
    turnStats.abilityBreakdown,
  )) {
    newTotal.abilityBreakdown[abilityId] =
      (newTotal.abilityBreakdown[abilityId] || 0) + damage;
  }

  // Calculate DPS (damage per turn)
  if (newTotal.turnCount > 0) {
    newTotal.dps = newTotal.totalDamageDealt / newTotal.turnCount;
  }

  // Effective damage accounts for mitigation
  newTotal.effectiveDamage =
    newTotal.totalDamageDealt + newTotal.totalDamageMitigated;

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
  abilityBreakdown: {},
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
