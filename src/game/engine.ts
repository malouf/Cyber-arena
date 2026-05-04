import { obstacles } from "./data";
import type { Ability, Action } from "./types";

export type Pos = { x: number; y: number };

export type EntityState = {
  id: "player" | "enemy";
  hp: number;
  maxHp: number;
  pa: number;
  maxPa: number;
  pm: number;
  maxPm: number;
  mana: number;
  maxMana: number;
  pos: Pos;
  passives: Array<string>;
};

export type CombatEvent =
  | { type: "log"; text: string }
  | { type: "effect"; text: string; color: string; pos: Pos }
  | { type: "move"; entity: "player" | "enemy"; pos: Pos }
  | {
      type: "stats";
      entity: "player" | "enemy";
      hp?: number;
      pa?: number;
      pm?: number;
      mana?: number;
    }
  | { type: "delay"; ms: number };

export type TurnState = {
  cooldowns: Record<string, number>;
  usesThisTurn: Record<string, number>;
  flowStateRange: number;
  bonusPa: number;
};

function getDistance(c1: Pos, c2: Pos) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
}

export function resolveTurn(
  pState: EntityState,
  eState: EntityState,
  pQueue: Array<Action>,
  turnState: TurnState,
): { events: Array<CombatEvent>; nextTurnState: TurnState } {
  const events: Array<CombatEvent> = [];

  // Clone state for simulation
  const pStats = { ...pState };
  const eStats = { ...eState };
  let pPos = { ...pState.pos };
  let ePos = { ...eState.pos };

  const newCooldowns = { ...turnState.cooldowns };
  const newUses = { ...turnState.usesThisTurn };
  let cellsMovedThisTurn = 0;
  let nextBonusPa = 0;
  let nextFlowStateRange = 0;

  events.push({ type: "log", text: "> INITIATING SEQUENCE RESOLUTION" });

  // --- AI LOGIC ---
  const eQueue: Array<Action> = [];
  if (eStats.hp > 0) {
    const dist = getDistance(ePos, pPos);
    if (dist > 1) {
      const dx = pPos.x > ePos.x ? 1 : pPos.x < ePos.x ? -1 : 0;
      const dy = pPos.y > ePos.y ? 1 : pPos.y < ePos.y ? -1 : 0;
      const newEnemyPos = { x: ePos.x + dx, y: ePos.y + dy };
      const isAIWall = obstacles.some(
        (o) => o.x === newEnemyPos.x && o.y === newEnemyPos.y,
      );
      if ((newEnemyPos.x !== pPos.x || newEnemyPos.y !== pPos.y) && !isAIWall) {
        eQueue.push({
          type: "move",
          target: newEnemyPos,
          initiative: 100,
          name: "Move",
          paCost: 0,
          pmCost: 1,
          manaCost: 0,
        });
      }
      if (getDistance(newEnemyPos, pPos) <= 1) {
        eQueue.push({
          type: "ability",
          target: pPos,
          name: "Basic Attack",
          initiative: 50,
          paCost: 0,
          pmCost: 0,
          manaCost: 0,
          ability: {
            id: "bot_attack",
            name: "Basic Attack",
            damage: 15,
            range: 1,
            type: "attack",
          } as Ability,
        });
      }
    } else {
      eQueue.push({
        type: "ability",
        target: pPos,
        name: "Basic Attack",
        initiative: 50,
        paCost: 0,
        pmCost: 0,
        manaCost: 0,
        ability: {
          id: "bot_attack",
          name: "Basic Attack",
          damage: 15,
          range: 1,
          type: "attack",
        } as Ability,
      });
    }
  }

  const applyDamage = (
    target: "player" | "enemy",
    amount: number,
    isMelee: boolean,
  ) => {
    if (target === "player") {
      let finalDamage = amount;
      if (pStats.passives.includes("heavy_plating"))
        finalDamage = Math.max(0, finalDamage - 3);
      pStats.hp -= finalDamage;
      events.push({
        type: "effect",
        pos: { ...pPos },
        text: `-${finalDamage}`,
        color: "text-red-500",
      });
      events.push({ type: "stats", entity: "player", hp: pStats.hp });

      if (pStats.passives.includes("masochism") && finalDamage > 0) {
        nextBonusPa = 1;
      }
      if (pStats.passives.includes("thorns") && isMelee) {
        eStats.hp -= 5;
        events.push({
          type: "effect",
          pos: { ...ePos },
          text: `-5`,
          color: "text-red-500",
        });
        events.push({ type: "stats", entity: "enemy", hp: eStats.hp });
        events.push({ type: "log", text: "> Thorns reflected 5 DMG!" });
      }
    } else {
      eStats.hp -= amount;
      events.push({
        type: "effect",
        pos: { ...ePos },
        text: `-${amount}`,
        color: "text-red-500",
      });
      events.push({ type: "stats", entity: "enemy", hp: eStats.hp });
    }
  };

  const maxSteps = Math.max(pQueue.length, eQueue.length);

  for (let i = 0; i < maxSteps; i++) {
    const pAction = pQueue[i]
      ? { ...pQueue[i], entity: "player" as const }
      : null;
    const eAction = eQueue[i]
      ? { ...eQueue[i], entity: "enemy" as const }
      : null;

    const stepActions = [];
    if (pAction) stepActions.push(pAction);
    if (eAction) stepActions.push(eAction);

    stepActions.sort((a, b) => b.initiative - a.initiative);

    for (const action of stepActions) {
      if (pStats.hp <= 0 && action.entity === "player") continue;
      if (eStats.hp <= 0 && action.entity === "enemy") continue;

      events.push({ type: "delay", ms: 900 });

      const isPlayer = action.entity === "player";
      const targetPos = isPlayer ? ePos : pPos;

      if (action.type === "move") {
        if (isPlayer) {
          cellsMovedThisTurn += getDistance(pPos, action.target);
          pPos = action.target;
          pStats.pm -= action.pmCost;
          pStats.pa -= action.paCost;
          pStats.mana -= action.manaCost;
          events.push({ type: "move", entity: "player", pos: { ...pPos } });
          events.push({
            type: "stats",
            entity: "player",
            pm: pStats.pm,
            pa: pStats.pa,
            mana: pStats.mana,
          });
        } else {
          ePos = action.target;
          events.push({ type: "move", entity: "enemy", pos: { ...ePos } });
        }
        events.push({
          type: "log",
          text: `> ${isPlayer ? "Player" : "Enemy"} moved to [${action.target.x}, ${action.target.y}] (Init ${action.initiative})`,
        });
      } else {
        if (isPlayer) {
          pStats.pm -= action.pmCost;
          pStats.pa -= action.paCost;
          pStats.mana -= action.manaCost;
          events.push({
            type: "stats",
            entity: "player",
            pm: pStats.pm,
            pa: pStats.pa,
            mana: pStats.mana,
          });
        }

        const ability = action.ability || (action as any);
        const currentDist = getDistance(isPlayer ? pPos : ePos, action.target);

        if (isPlayer && ability.id) {
          if (ability.cooldown) newCooldowns[ability.id] = ability.cooldown;
          if (ability.maxUsesPerTurn)
            newUses[ability.id] = (newUses[ability.id] || 0) + 1;
        }

        let dmg = ability.damage || 0;
        if (
          isPlayer &&
          pStats.passives.includes("momentum") &&
          ability.type.includes("attack")
        ) {
          dmg += cellsMovedThisTurn * 2;
        }

        let effectiveRange = ability.range;
        if (isPlayer && pStats.passives.includes("flow_state")) {
          effectiveRange += turnState.flowStateRange;
        }

        if (ability.id === "impulse" && isPlayer) {
          if (
            currentDist <= effectiveRange &&
            action.target.x === targetPos.x &&
            action.target.y === targetPos.y
          ) {
            const dx = ePos.x > pPos.x ? 1 : ePos.x < pPos.x ? -1 : 0;
            const dy = ePos.y > pPos.y ? 1 : ePos.y < pPos.y ? -1 : 0;
            ePos = { x: ePos.x + dx, y: ePos.y + dy };
            events.push({ type: "move", entity: "enemy", pos: { ...ePos } });
            applyDamage("enemy", dmg, false);
            events.push({
              type: "log",
              text: `> Impulsion pushes Enemy to [${ePos.x}, ${ePos.y}]! ${dmg} DMG.`,
            });
            if (pStats.passives.includes("drain_force")) {
              pStats.mana = Math.min(pStats.maxMana, pStats.mana + 1);
              events.push({
                type: "stats",
                entity: "player",
                mana: pStats.mana,
              });
              events.push({
                type: "log",
                text: `> Drain de Force restored 1 Mana!`,
              });
            }
          } else {
            events.push({ type: "log", text: `> Impulsion MISSED.` });
          }
          continue;
        }

        if (ability.type === "move_attack") {
          if (isPlayer) {
            cellsMovedThisTurn += getDistance(pPos, action.target);
            pPos = action.target;
            events.push({ type: "move", entity: "player", pos: { ...pPos } });
            events.push({
              type: "log",
              text: `> ${ability.name} leaps to [${pPos.x}, ${pPos.y}]!`,
            });

            if (getDistance(pPos, ePos) <= 1) {
              applyDamage("enemy", dmg, true);
              events.push({
                type: "log",
                text: `> ${ability.name} hits Enemy for ${dmg} DMG.`,
              });
            } else {
              events.push({
                type: "log",
                text: `> No adjacent targets for ${ability.name}.`,
              });
            }
          }
        } else {
          if (currentDist <= effectiveRange) {
            if (
              action.target.x === targetPos.x &&
              action.target.y === targetPos.y
            ) {
              if (isPlayer) {
                applyDamage("enemy", dmg, currentDist <= 1);
                events.push({
                  type: "log",
                  text: `> ${ability.name} hits Enemy! ${dmg} DMG.`,
                });
              } else {
                applyDamage("player", dmg, currentDist <= 1);
                events.push({
                  type: "log",
                  text: `> Enemy uses ${ability.name}! ${dmg} DMG.`,
                });
              }
            } else {
              events.push({
                type: "log",
                text: `> ${isPlayer ? "Player" : "Enemy"} attacks empty cell [${action.target.x}, ${action.target.y}].`,
              });
            }
          } else {
            events.push({
              type: "log",
              text: `> ${ability.name} FAILED: Target now out of range.`,
            });
          }
        }
      }
    }
  }

  if (cellsMovedThisTurn === 0 && pStats.passives.includes("flow_state")) {
    nextFlowStateRange = 1;
    events.push({
      type: "log",
      text: `> Flow State active: Next turn spells gain +1 Range.`,
    });
  }

  // End of turn cleanup
  pStats.pa = pStats.maxPa;
  pStats.pm = pStats.maxPm;
  pStats.mana = Math.min(pStats.maxMana, pStats.mana + 1);
  events.push({
    type: "stats",
    entity: "player",
    pa: pStats.pa,
    pm: pStats.pm,
    mana: pStats.mana,
  });

  const updatedCooldowns: Record<string, number> = {};
  for (const id in newCooldowns) {
    if (newCooldowns[id] > 1) {
      updatedCooldowns[id] = newCooldowns[id] - 1;
    }
  }

  events.push({ type: "log", text: `> TURN ENDED. RESOURCES RESTORED.` });

  return {
    events,
    nextTurnState: {
      cooldowns: updatedCooldowns,
      usesThisTurn: {},
      flowStateRange: nextFlowStateRange,
      bonusPa: nextBonusPa,
    },
  };
}
