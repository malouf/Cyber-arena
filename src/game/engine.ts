import { obstacles } from "./data";
import { selectEnemyActions } from "./ai";
import type {
  Action,
  CombatEvent,
  EntityState,
  Interactable,
  Pos,
  TurnState,
} from "./types";

function getDistance(c1: Pos, c2: Pos) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
}

function getNeighbors(pos: Pos): Array<Pos> {
  return [
    { x: pos.x + 1, y: pos.y },
    { x: pos.x - 1, y: pos.y },
    { x: pos.x, y: pos.y + 1 },
    { x: pos.x, y: pos.y - 1 },
    { x: pos.x + 1, y: pos.y - 1 },
    { x: pos.x - 1, y: pos.y + 1 },
  ];
}

export interface ResolveTurnParams {
  interactables?: Array<Interactable>;
  isRestTurn?: boolean;
  skipRequested?: boolean;
}

export function resolveTurn(
  pState: EntityState,
  eState: EntityState,
  pQueue: Array<Action>,
  turnState: TurnState,
  params: ResolveTurnParams = {},
): {
  events: Array<CombatEvent>;
  nextTurnState: TurnState;
  interactables: Array<Interactable>;
} {
  const events: Array<CombatEvent> = [];
  const {
    interactables: initialInteractables = [],
    isRestTurn = false,
    skipRequested = false,
  } = params;

  // Clone interactables to track state
  const interactables = initialInteractables.map((i) => ({ ...i }));

  // Clone state for simulation
  const pStats = {
    ...pState,
    pa: pState.pa + turnState.bonusPa + (isRestTurn ? 1 : 0),
    effects: pState.effects.map((e) => ({ ...e })),
  };
  const eStats = {
    ...eState,
    effects: eState.effects.map((e) => ({ ...e })),
  };
  let pPos = { ...pState.pos };
  let ePos = { ...eState.pos };

  const newCooldowns = { ...turnState.cooldowns };
  const newUses = { ...turnState.usesThisTurn };
  let cellsMovedThisTurn = 0;
  let nextBonusPa = 0;
  let nextFlowStateRange = 0;

  events.push({ type: "log", text: "> INITIATING SEQUENCE RESOLUTION" });

  // --- PROCESS STATUS EFFECTS (DoT) ---
  [pStats, eStats].forEach((stats) => {
    stats.effects
      .filter((e) => e.type === "dot")
      .forEach((dot) => {
        const dmg = dot.value || 0;
        stats.hp -= dmg;
        events.push({
          type: "log",
          text: `> ${stats.id === "player" ? "Player" : "Enemy"} takes ${dmg} DoT from ${dot.name}.`,
        });
        events.push({
          type: "effect",
          pos: { ...(stats.id === "player" ? pPos : ePos) },
          text: `-${dmg}`,
          color: "text-orange-500",
          target: stats.id,
        });
        events.push({ type: "stats", entity: stats.id, hp: stats.hp });
      });
  });

  // Apply rest bonus logging
  if (isRestTurn || skipRequested) {
    events.push({ type: "log", text: "> REST BONUS APPLIED: +1 PA" });
    events.push({ type: "rest_triggered", entity: "player" });
  }

  // --- AI LOGIC ---
  const eQueue: Array<Action> =
    eStats.hp > 0 ? selectEnemyActions(eStats, pStats, interactables) : [];

  // Helper to check for interactables at position
  const checkInteractables = (entity: "player" | "enemy", pos: Pos) => {
    const triggered: Array<Interactable> = [];
    for (const interactable of interactables) {
      if (
        interactable.pos.x === pos.x &&
        interactable.pos.y === pos.y &&
        (interactable.triggeredBy === entity ||
          interactable.triggeredBy === "both")
      ) {
        triggered.push(interactable);
      }
    }
    return triggered;
  };

  const applyDamage = (
    target: "player" | "enemy",
    amount: number,
    isMelee: boolean,
  ) => {
    const stats = target === "player" ? pStats : eStats;
    let finalDamage = amount;

    // Shield check
    const shieldIndex = stats.effects.findIndex((e) => e.type === "shield");
    if (shieldIndex !== -1 && finalDamage > 0) {
      const shield = stats.effects[shieldIndex];
      const absorbed = Math.min(shield.value || 0, finalDamage);
      if (shield.value !== undefined) shield.value -= absorbed;
      finalDamage -= absorbed;
      events.push({
        type: "log",
        text: `> Shield absorbed ${absorbed} damage!`,
      });
      if ((shield.value || 0) <= 0) {
        stats.effects.splice(shieldIndex, 1);
        events.push({ type: "log", text: `> Shield BROKEN!` });
      }
    }

    if (target === "player") {
      // Check for heavy_plating passive
      if (pStats.passives.includes("heavy_plating")) {
        const mitigated = Math.min(3, finalDamage);
        finalDamage = Math.max(0, finalDamage - 3);
        events.push({
          type: "log",
          text: `> Heavy Plating mitigated ${mitigated} damage!`,
        });
      }
      pStats.hp -= finalDamage;
      events.push({
        type: "effect",
        pos: { ...pPos },
        text: `-${finalDamage}`,
        color: "text-red-500",
        target: "player",
      });
      events.push({ type: "stats", entity: "player", hp: pStats.hp });

      if (pStats.passives.includes("masochism") && finalDamage > 0) {
        nextBonusPa += 1;
      }
      if (pStats.passives.includes("thorns") && isMelee) {
        eStats.hp -= 5;
        events.push({
          type: "effect",
          pos: { ...ePos },
          text: `-5`,
          color: "text-red-500",
          target: "enemy",
        });
        events.push({ type: "stats", entity: "enemy", hp: eStats.hp });
        events.push({ type: "log", text: "> Thorns reflected 5 DMG!" });
      }
    } else {
      eStats.hp -= finalDamage;
      events.push({
        type: "effect",
        pos: { ...ePos },
        text: `-${finalDamage}`,
        color: "text-red-500",
        target: "enemy",
      });
      events.push({ type: "stats", entity: "enemy", hp: eStats.hp });
    }
  };

  const applyEffect = (target: "player" | "enemy", effect: any) => {
    const stats = target === "player" ? pStats : eStats;
    stats.effects.push({ ...effect });
    events.push({
      type: "log",
      text: `> Applied ${effect.name} to ${target === "player" ? "Player" : "Enemy"}!`,
    });
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

      const isPlayer = action.entity === "player";
      const stats = isPlayer ? pStats : eStats;

      // Stun check
      if (stats.effects.some((e) => e.type === "stun")) {
        events.push({
          type: "log",
          text: `> ${isPlayer ? "Player" : "Enemy"} is STUNNED and skips action!`,
        });
        continue;
      }

      events.push({ type: "delay", ms: 900 });

      const myPos = isPlayer ? pPos : ePos;
      const hisPos = isPlayer ? ePos : pPos;
      const targetPos = isPlayer ? ePos : pPos;

      if (action.type === "move") {
        if (isPlayer) {
          const startPos = pPos;
          cellsMovedThisTurn += getDistance(startPos, action.target);
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

          // Check for interactables at new position
          const triggered = checkInteractables("player", pPos);
          for (const int of triggered) {
            if (int.type === "mana_well") {
              pStats.mana = Math.min(pStats.maxMana, pStats.mana + int.value);
              events.push({
                type: "log",
                text: `> Mana Well restored ${int.value} Mana!`,
              });
              events.push({
                type: "stats",
                entity: "player",
                mana: pStats.mana,
              });
              events.push({
                type: "interact",
                entity: "player",
                interactableId: int.id,
                interactableType: int.type,
              });
            }
          }
        } else {
          ePos = action.target;
          events.push({ type: "move", entity: "enemy", pos: { ...ePos } });

          // Check for interactables for enemy
          const triggered = checkInteractables("enemy", ePos);
          for (const int of triggered) {
            if (int.type === "mana_well") {
              eStats.mana = Math.min(eStats.maxMana, eStats.mana + int.value);
              events.push({
                type: "interact",
                entity: "enemy",
                interactableId: int.id,
                interactableType: int.type,
              });
            }
          }
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

        // --- SPECIAL ABILITIES ---
        if (ability.id === "whirlwind") {
          const dist = getDistance(myPos, hisPos);
          if (dist <= 1) {
            applyDamage(isPlayer ? "enemy" : "player", dmg, true);
            if (ability.effect)
              applyEffect(isPlayer ? "enemy" : "player", ability.effect);
            events.push({
              type: "log",
              text: `> ${ability.name} hits for ${dmg} DMG.`,
            });
          } else {
            events.push({
              type: "log",
              text: `> ${ability.name} hits nothing.`,
            });
          }
          continue;
        }

        if (ability.id === "taunt") {
          const dist = getDistance(myPos, hisPos);
          if (dist <= effectiveRange && dist > 1) {
            const neighbors = getNeighbors(hisPos);
            let bestNeighbor = hisPos;
            let minDist = dist;
            for (const n of neighbors) {
              const d = getDistance(n, myPos);
              if (d < minDist) {
                const isWall = obstacles.some(
                  (o) => o.x === n.x && o.y === n.y,
                );
                const isMe = n.x === myPos.x && n.y === myPos.y;
                // Check for interactable walls
                const isInteractableWall = interactables.some(
                  (int) =>
                    int.type === "wall" &&
                    int.pos.x === n.x &&
                    int.pos.y === n.y,
                );
                if (!isWall && !isMe && !isInteractableWall) {
                  minDist = d;
                  bestNeighbor = n;
                }
              }
            }
            if (bestNeighbor.x !== hisPos.x || bestNeighbor.y !== hisPos.y) {
              if (isPlayer) {
                ePos = bestNeighbor;
                events.push({
                  type: "move",
                  entity: "enemy",
                  pos: { ...ePos },
                });
              } else {
                pPos = bestNeighbor;
                events.push({
                  type: "move",
                  entity: "player",
                  pos: { ...pPos },
                });
              }
              events.push({
                type: "log",
                text: `> Magnetic Pull pulls target closer!`,
              });

              // Drain Force passive check
              if (isPlayer && pStats.passives.includes("drain_force")) {
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
            }
          } else {
            events.push({
              type: "log",
              text: `> Magnetic Pull FAILED or already adjacent.`,
            });
          }
          continue;
        }

        if (ability.id === "resonance") {
          if (currentDist <= effectiveRange) {
            const bonusDmg = cellsMovedThisTurn * 5;
            const finalResonanceDmg = dmg + bonusDmg;
            applyDamage(
              isPlayer ? "enemy" : "player",
              finalResonanceDmg,
              false,
            );
            if (ability.effect)
              applyEffect(isPlayer ? "enemy" : "player", ability.effect);
            events.push({
              type: "log",
              text: `> Resonance hits for ${finalResonanceDmg} DMG! (+${bonusDmg} from movement)`,
            });
          }
          continue;
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
            if (ability.effect) applyEffect("enemy", ability.effect);
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

        if (ability.type === "buff") {
          if (ability.effect) {
            applyEffect(isPlayer ? "player" : "enemy", ability.effect);
          }
          continue;
        }

        // Handle trap abilities (create walls)
        if (ability.type === "trap") {
          const newWall: Interactable = {
            id: `trap_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: "wall",
            pos: action.target,
            duration: ability.cooldown || 1,
            value: 0,
            ownerId: "player",
            triggeredBy: "both",
          };
          interactables.push(newWall);
          events.push({
            type: "log",
            text: `> ${ability.name} created a wall at [${action.target.x}, ${action.target.y}]!`,
          });
          continue;
        }

        if (ability.type === "move_attack") {
          cellsMovedThisTurn += getDistance(myPos, action.target);
          if (isPlayer) {
            pPos = action.target;
            events.push({ type: "move", entity: "player", pos: { ...pPos } });
          } else {
            ePos = action.target;
            events.push({ type: "move", entity: "enemy", pos: { ...ePos } });
          }
          events.push({
            type: "log",
            text: `> ${ability.name} leaps to [${action.target.x}, ${action.target.y}]!`,
          });

          const newDist = getDistance(
            isPlayer ? pPos : ePos,
            isPlayer ? ePos : pPos,
          );
          if (newDist <= 1) {
            applyDamage(isPlayer ? "enemy" : "player", dmg, true);
            if (ability.effect)
              applyEffect(isPlayer ? "enemy" : "player", ability.effect);
            events.push({
              type: "log",
              text: `> ${ability.name} hits for ${dmg} DMG.`,
            });
          } else {
            events.push({
              type: "log",
              text: `> No adjacent targets for ${ability.name}.`,
            });
          }
        } else {
          if (currentDist <= effectiveRange) {
            if (
              action.target.x === targetPos.x &&
              action.target.y === targetPos.y
            ) {
              if (isPlayer) {
                applyDamage("enemy", dmg, currentDist <= 1);
                if (ability.effect) applyEffect("enemy", ability.effect);
                events.push({
                  type: "log",
                  text: `> ${ability.name} hits Enemy! ${dmg} DMG.`,
                });
              } else {
                applyDamage("player", dmg, currentDist <= 1);
                if (ability.effect) applyEffect("player", ability.effect);
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

  // Update interactable durations and remove expired ones
  const updatedInteractables = interactables.filter((i) => {
    if (i.duration > 0) {
      i.duration -= 1;
      return i.duration !== 0;
    }
    return true;
  });

  // End of turn cleanup
  [pStats, eStats].forEach((stats) => {
    stats.effects = stats.effects
      .map((e) => ({ ...e, duration: e.duration - 1 }))
      .filter((e) => e.duration > 0);
  });

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
      isRestTurn: false,
    },
    interactables: updatedInteractables,
  };
}
