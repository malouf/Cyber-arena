import type { Doc } from "./_generated/dataModel";

export type Pos = { x: number; y: number };

export type EntityState = Doc<"matches">["players"][number]["state"];
export type ValidatedAction = Doc<"turnSubmissions">["queue"][number];
export type CombatEvent = Doc<"matchEvents">["events"][number];

export type TurnState = {
  cooldowns: Record<string, number>;
  usesThisTurn: Record<string, number>;
  // Add other transient states if needed
};

export function getDistance(c1: Pos, c2: Pos) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
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
      interrupts: 0,
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

      if (action.type === "move") {
        actor.state.pm -= action.pmCost;
        actor.state.pa -= action.paCost;
        actor.state.mana -= action.manaCost;
        actor.state.pos = action.target;

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
          if (pickup.type === "hp") {
            actor.state.hp = Math.min(
              actor.state.maxHp,
              actor.state.hp + pickup.value,
            );
            events.push({
              type: "log",
              text: `${actor.name} picked up HP! (+${pickup.value})`,
            });
          } else if (pickup.type === "mana") {
            actor.state.mana = Math.min(
              actor.state.maxMana,
              actor.state.mana + pickup.value,
            );
            events.push({
              type: "log",
              text: `${actor.name} picked up Mana! (+${pickup.value})`,
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

        const targetPos = action.target;
        const targetPlayer = currentPlayers.find(
          (p: any) =>
            p.state.pos.x === targetPos.x &&
            p.state.pos.y === targetPos.y &&
            p.state.hp > 0,
        );

        const dist = getDistance(actor.state.pos, targetPos);
        const hit =
          dist <= action.range &&
          (targetPlayer !== undefined || action.range === 0); // range 0 is self

        if (hit && targetPlayer) {
          let damage = action.damage;
          // Apply passives/modifiers
          if (targetPlayer.state.passives.includes("heavy_plating")) {
            damage = Math.max(0, damage - 3);
          }

          targetPlayer.state.hp -= damage;

          // Update analytics
          analytics[slot].damageDealt += damage;
          analytics[targetPlayer.slot].damageTaken += damage;
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
          events.push({
            type: "log",
            text: `${actor.name}'s ${action.name} missed!`,
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
      p.state.pa = p.state.maxPa;
      p.state.pm = p.state.maxPm;
      p.state.mana = Math.min(p.state.maxMana, p.state.mana + 1);

      events.push({
        type: "stats",
        entity: p.slot,
        pa: p.state.pa,
        pm: p.state.pm,
        mana: p.state.mana,
      });
    }
  });

  return {
    nextPlayers: currentPlayers,
    nextMapObjects: currentMapObjects,
    events,
    analytics,
  };
}
