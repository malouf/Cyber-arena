import { obstacles, soulData } from "./data";
import type {
  Ability,
  Action,
  EntityState,
  Interactable,
  LoadoutSlot,
  Passive,
  Pos,
  SoulId,
} from "./types";

export function generateEnemyBuild(): EntityState {
  const soulIds: Array<SoulId> = ["onde", "fury", "aegis"];
  const primaryId = soulIds[Math.floor(Math.random() * soulIds.length)];
  const secondaryId = soulIds.filter((id) => id !== primaryId)[
    Math.floor(Math.random() * 2)
  ];

  const primarySoul = soulData[primaryId];
  const secondarySoul = soulData[secondaryId];

  const baseStats = {
    hp: Math.floor(
      (primarySoul.baseStats.hp + secondarySoul.baseStats.hp) / 1.5,
    ),
    pa: Math.floor((primarySoul.baseStats.pa + secondarySoul.baseStats.pa) / 2),
    pm: Math.floor((primarySoul.baseStats.pm + secondarySoul.baseStats.pm) / 2),
    mana: Math.floor(
      (primarySoul.baseStats.mana + secondarySoul.baseStats.mana) / 2,
    ),
  };

  const loadout: Array<LoadoutSlot> = [];
  loadout.push({ kind: "elite", ability: primarySoul.ultimate });

  const allActives = [...primarySoul.actives, ...secondarySoul.actives];
  const selectedActives = allActives
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);
  selectedActives.forEach((a) => loadout.push({ kind: "active", ability: a }));

  const allPassives = [...primarySoul.passives, ...secondarySoul.passives];
  const selectedPassives = allPassives
    .sort(() => 0.5 - Math.random())
    .slice(0, 2);
  selectedPassives.forEach((p) =>
    loadout.push({ kind: "passive", passive: p }),
  );

  return {
    id: "enemy",
    hp: baseStats.hp,
    maxHp: baseStats.hp,
    pa: baseStats.pa,
    maxPa: baseStats.pa,
    pm: baseStats.pm,
    maxPm: baseStats.pm,
    mana: baseStats.mana,
    maxMana: baseStats.mana,
    pos: { x: 13, y: 8 },
    passives: selectedPassives
      .map((p) => p.effect)
      .filter((e) => !!e) as Array<string>,
    loadout,
    effects: [],
  };
}

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

export function selectEnemyActions(
  eState: EntityState,
  pState: EntityState,
  interactables: Array<Interactable>,
): Array<Action> {
  const queue: Array<Action> = [];
  let currentEPos = { ...eState.pos };
  let currentEPa = eState.pa;
  const currentEPm = eState.pm;
  let currentEMana = eState.mana;
  const pPos = pState.pos;

  // 1. Strategic Movement: Try to get into range of an ability or just closer
  // For simplicity, we'll try to get to range 1 or 2.

  const moveSteps = currentEPm;
  for (let step = 0; step < moveSteps; step++) {
    const dist = getDistance(currentEPos, pPos);
    if (dist <= 1) break;

    const neighbors = getNeighbors(currentEPos);
    let bestNeighbor = null;
    let minDist = dist;

    for (const neighbor of neighbors) {
      const isWall = obstacles.some(
        (o) => o.x === neighbor.x && o.y === neighbor.y,
      );
      const isPlayer = neighbor.x === pPos.x && neighbor.y === pPos.y;
      const isInteractableWall = interactables.some(
        (i) =>
          i.type === "wall" && i.pos.x === neighbor.x && i.pos.y === neighbor.y,
      );
      if (isWall || isPlayer || isInteractableWall) continue;

      const d = getDistance(neighbor, pPos);
      if (d < minDist) {
        minDist = d;
        bestNeighbor = neighbor;
      }
    }

    if (bestNeighbor) {
      currentEPos = bestNeighbor;
      queue.push({
        type: "move",
        target: currentEPos,
        initiative: 100 - step,
        name: "Move",
        paCost: 0,
        pmCost: 1,
        manaCost: 0,
      });
    } else {
      break;
    }
  }

  // 2. Ability selection
  const abilities = eState.loadout
    .filter((slot) => slot.kind !== "passive")
    .map((slot) => (slot as any).ability as Ability);

  // Add basic attack
  const soul = soulData["fury"]; // fallback or default
  abilities.push(soul.baseAttack);

  // Try to use the best possible ability
  // Sort by damage desc
  const availableAbilities = abilities
    .filter((a) => a.paCost <= currentEPa && a.manaCost <= currentEMana)
    .sort((a, b) => b.damage - a.damage);

  for (const ability of availableAbilities) {
    const dist = getDistance(currentEPos, pPos);
    if (dist <= ability.range) {
      queue.push({
        type: "ability",
        target: pPos,
        name: ability.name,
        initiative: ability.initiative,
        paCost: ability.paCost,
        pmCost: ability.pmCost,
        manaCost: ability.manaCost,
        ability,
      });
      currentEPa -= ability.paCost;
      currentEMana -= ability.manaCost;
      break; // Only one ability for now to keep it simple but better than before
    }
  }

  return queue;
}
