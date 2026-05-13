import type { Doc } from "./_generated/dataModel";

export type Pos = { x: number; y: number };

export type EntityState = Doc<"matches">["players"][number]["state"];
export type ValidatedAction = Doc<"turnSubmissions">["queue"][number];
export type CombatEvent = Doc<"matchEvents">["events"][number];

export function getDistance(c1: Pos, c2: Pos) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
}

function applyRng(damage: number): number {
  const rngFactor = 0.9 + Math.random() * 0.2;
  return Math.round(damage * rngFactor);
}

function processPassives(
  actor: any,
  target: any,
  action: ValidatedAction,
  damage: number,
  events: Array<CombatEvent>,
): { damage: number; mitigation: number } {
  let finalDamage = damage;
  let mitigation = 0;

  // Mitigation passives on target
  if (target.state.passives.includes("heavy_plating")) {
    const reduced = Math.min(finalDamage, 3);
    finalDamage -= reduced;
    mitigation += reduced;
    events.push({
      type: "mitigation",
      entity: target.slot,
      amount: reduced,
      source: "Heavy Plating",
    });
  }

  // Reflect/Thorns passives
  if (target.state.passives.includes("thorns") && action.range === 1) {
    const reflectDamage = 5;
    actor.state.hp -= reflectDamage;
    events.push({
      type: "effect",
      pos: actor.state.pos,
      text: `Thorns: -${reflectDamage}`,
      color: "text-red-400",
    });
  }

  // Offensive passives on actor
  if (
    actor.state.passives.includes("opportunist") &&
    target.state.hp < target.state.maxHp / 2
  ) {
    finalDamage += 5;
    events.push({
      type: "log",
      text: `Opportunist: +5 DMG!`,
    });
  }

  if (actor.state.passives.includes("momentum")) {
    // tracking distance would be better but keeping it simple
  }

  return { damage: finalDamage, mitigation };
}

export function resolveMatchTurn(
  players: Doc<"matches">["players"],
  submissions: Array<Doc<"turnSubmissions">>,
  _obstacles: Array<Pos>,
  mapObjects: Doc<"matches">["mapObjects"],
): {
  nextPlayers: Doc<"matches">["players"];
  nextMapObjects: Doc<"matches">["mapObjects"];
  events: Array<CombatEvent>;
  analytics: Record<string, any>;
} {
  const events: Array<CombatEvent> = [];
  const analytics: Record<string, any> = {};
  const currentMapObjects = JSON.parse(JSON.stringify(mapObjects));

  // Initialize analytics for each player
  players.forEach((p: any) => {
    analytics[p.slot] = {
      damageDealt: 0,
      damageTaken: 0,
      healingDone: 0,
      shieldingDone: 0,
      damageMitigated: 0,
      resourceEfficiency: 0,
      interrupts: 0,
      distanceMoved: 0,
      actionsExecuted: 0,
      abilityBreakdown: {},
    };
  });

  // Deep clone players for resolution
  const currentPlayers = JSON.parse(JSON.stringify(players));

  const getPlayerBySlot = (slot: string) =>
    currentPlayers.find((p: any) => p.slot === slot)!;

  const maxSteps = Math.max(...submissions.map((s: any) => s.queue.length), 0);

  for (let i = 0; i < maxSteps; i++) {
    const stepActions: Array<{ slot: string; action: ValidatedAction }> = [];
    submissions.forEach((s: any) => {
      if (s.queue[i]) {
        stepActions.push({ slot: s.playerSlot, action: s.queue[i] });
      }
    });

    // Sort by initiative
    stepActions.sort(
      (a: any, b: any) => b.action.initiative - a.action.initiative,
    );

    for (const { slot, action } of stepActions) {
      const actor = getPlayerBySlot(slot);
      if (actor.state.hp <= 0) continue;

      // Track resource usage for efficiency
      const totalCost = action.paCost + action.pmCost + action.manaCost * 2;

      if (action.type === "move") {
        if (actor.state.effects.some((e: any) => e.type === "root")) {
          events.push({
            type: "log",
            text: `${actor.name} is ROOTED and cannot move!`,
          });
          continue;
        }

        const isObstacle = _obstacles.some(
          (o) => o.x === action.target.x && o.y === action.target.y,
        );
        const isWall = currentMapObjects.some(
          (o: any) =>
            o.type === "wall" &&
            !o.collected &&
            o.pos.x === action.target.x &&
            o.pos.y === action.target.y,
        );

        if (isObstacle || isWall) {
          events.push({
            type: "log",
            text: `${actor.name} movement blocked at [${action.target.x}, ${action.target.y}]!`,
          });
          continue;
        }

        const dist = getDistance(actor.state.pos, action.target);
        actor.state.pm -= action.pmCost;
        actor.state.pa -= action.paCost;
        actor.state.mana -= action.manaCost;
        actor.state.pos = action.target;
        analytics[slot].distanceMoved += dist;
        analytics[slot].actionsExecuted += 1;

        events.push({
          type: "move",
          entity: slot,
          pos: { ...actor.state.pos },
        });

        // Check for pickups
        const pickup = currentMapObjects.find(
          (o: any) =>
            !o.collected &&
            o.pos.x === actor.state.pos.x &&
            o.pos.y === actor.state.pos.y,
        );
        if (pickup) {
          pickup.collected = true;
          if (pickup.type === "hp" || pickup.type === "hp_pack") {
            const healAmount = Math.min(
              actor.state.maxHp - actor.state.hp,
              pickup.value,
            );
            actor.state.hp += healAmount;
            analytics[slot].healingDone += healAmount;
            events.push({
              type: "healing",
              entity: slot,
              amount: healAmount,
              source: "HP Pickup",
            });
            events.push({
              type: "log",
              text: `${actor.name} picked up HP! (+${pickup.value})`,
            });
          } else if (pickup.type === "mana" || pickup.type === "mana_pack") {
            actor.state.mana = Math.min(
              actor.state.maxMana,
              actor.state.mana + pickup.value,
            );
            events.push({
              type: "resource_change",
              entity: slot,
              resource: "mana",
              amount: pickup.value,
              reason: "Mana Pickup",
            });
            events.push({
              type: "log",
              text: `${actor.name} picked up Mana! (+${pickup.value})`,
            });
          } else if (pickup.type === "pa_boost") {
            actor.state.bonusPa = (actor.state.bonusPa || 0) + pickup.value;
            events.push({
              type: "log",
              text: `${actor.name} picked up PA Boost! (+${pickup.value} next turn)`,
            });
          } else if (pickup.type === "pm_boost") {
            actor.state.bonusPm = (actor.state.bonusPm || 0) + pickup.value;
            events.push({
              type: "log",
              text: `${actor.name} picked up PM Boost! (+${pickup.value} next turn)`,
            });
          }
        }

        events.push({
          type: "stats",
          entity: slot,
          hp: actor.state.hp,
          pa: actor.state.pa,
          pm: actor.state.pm,
          mana: actor.state.mana,
        });
      } else if (action.type === "ability") {
        actor.state.pm -= action.pmCost;
        actor.state.pa -= action.paCost;
        actor.state.mana -= action.manaCost;
        analytics[slot].actionsExecuted += 1;

        const targetPos = action.target;
        const targetPlayer = currentPlayers.find(
          (p: any) =>
            p.state.pos.x === targetPos.x &&
            p.state.pos.y === targetPos.y &&
            p.state.hp > 0,
        );

        const dist = getDistance(actor.state.pos, targetPos);
        const abilityType = action.abilityType || "attack";

        // Dispatch by type
        if (abilityType === "attack" || abilityType === "move_attack") {
          const hit = dist <= action.range && targetPlayer !== undefined;

          if (hit && targetPlayer) {
            // Apply RNG to damage before processing passives
            const rngDamage = applyRng(action.damage);
            const { damage, mitigation } = processPassives(
              actor,
              targetPlayer,
              action,
              rngDamage,
              events,
            );

            targetPlayer.state.hp -= damage;

            // Update analytics
            analytics[slot].damageDealt += damage;
            analytics[targetPlayer.slot].damageTaken += damage;
            analytics[targetPlayer.slot].damageMitigated += mitigation;

            if (totalCost > 0) {
              analytics[slot].resourceEfficiency =
                analytics[slot].damageDealt /
                (actor.state.maxPa -
                  actor.state.pa +
                  (actor.state.maxMana - actor.state.mana) * 5);
            }

            const abilityId = action.abilityId || action.name;
            analytics[slot].abilityBreakdown[abilityId] =
              (analytics[slot].abilityBreakdown[abilityId] || 0) + damage;

            events.push({
              type: "attack",
              entity: slot,
              target: targetPos,
              hit: true,
              damage: damage,
              abilityName: action.name,
            });
            events.push({
              type: "effect",
              pos: targetPos,
              text: `-${damage}`,
              color: "text-red-500",
            });
            events.push({
              type: "stats",
              entity: targetPlayer.slot,
              hp: targetPlayer.state.hp,
            });
          } else {
            events.push({
              type: "attack",
              entity: slot,
              target: targetPos,
              hit: false,
              damage: 0,
              abilityName: action.name,
            });
          }
        } else if (abilityType === "buff") {
          // Handle self-buffs or ally buffs
          if (action.name === "Fortify") {
            const shieldAmount = 20;
            actor.state.hp = Math.min(
              actor.state.maxHp + shieldAmount,
              actor.state.hp + shieldAmount,
            );
            analytics[slot].shieldingDone += shieldAmount;
            events.push({
              type: "effect",
              pos: actor.state.pos,
              text: "SHIELDED",
              color: "text-blue-400",
            });
          } else if (action.name === "Healing Bloom") {
            const healAmount = 20;
            const actualHeal = Math.min(
              actor.state.maxHp - actor.state.hp,
              healAmount,
            );
            actor.state.hp += actualHeal;
            analytics[slot].healingDone += actualHeal;
            events.push({
              type: "healing",
              entity: slot,
              amount: actualHeal,
              source: "Healing Bloom",
            });
          } else if (action.name === "Overload (Ult)") {
            actor.state.bonusPa = (actor.state.bonusPa || 0) + 2;
            actor.state.bonusPm = (actor.state.bonusPm || 0) + 2;
            events.push({
              type: "log",
              text: `${actor.name} is OVERLOADED! (+2 PA/PM next turn)`,
            });
          }
        } else if (abilityType === "control") {
          if (action.name === "Blink") {
            actor.state.pos = action.target;
            events.push({
              type: "move",
              entity: slot,
              pos: { ...actor.state.pos },
            });
            events.push({
              type: "log",
              text: `${actor.name} blinked to [${actor.state.pos.x}, ${actor.state.pos.y}]!`,
            });
          } else if (targetPlayer) {
            events.push({
              type: "log",
              text: `${actor.name} pulled ${targetPlayer.name}!`,
            });
          }
        } else if (abilityType === "trap") {
          events.push({
            type: "log",
            text: `${actor.name} placed a ${action.name} at [${action.target.x}, ${action.target.y}]!`,
          });
          currentMapObjects.push({
            type: "wall",
            pos: action.target,
            value: 0,
            collected: false,
            duration: 2,
          });
        }

        events.push({
          type: "stats",
          entity: slot,
          pa: actor.state.pa,
          pm: actor.state.pm,
          mana: actor.state.mana,
        });
      }
    }
  }

  // End of turn recovery
  currentPlayers.forEach((p: any) => {
    if (p.state.hp > 0) {
      p.state.pa = p.state.maxPa + (p.state.bonusPa || 0);
      p.state.pm = p.state.maxPm + (p.state.bonusPm || 0);
      p.state.bonusPa = 0;
      p.state.bonusPm = 0;
      p.state.mana = Math.min(p.state.maxMana, p.state.mana + 1);

      // Passive: Root System
      if (p.state.passives.includes("root_system")) {
        // Simplified check: heal 5 if they have it
        const heal = 5;
        p.state.hp = Math.min(p.state.maxHp, p.state.hp + heal);
        events.push({
          type: "healing",
          entity: p.slot,
          amount: heal,
          source: "Root System",
        });
      }

      events.push({
        type: "stats",
        entity: p.slot,
        pa: p.state.pa,
        pm: p.state.pm,
        mana: p.state.mana,
      });
    }
  });

  const nextMapObjects = currentMapObjects
    .map((obj: any) => {
      if (obj.duration !== undefined) {
        return { ...obj, duration: obj.duration - 1 };
      }
      return obj;
    })
    .filter((obj: any) => obj.duration === undefined || obj.duration > 0);

  return {
    nextPlayers: currentPlayers,
    nextMapObjects,
    events,
    analytics,
  };
}
