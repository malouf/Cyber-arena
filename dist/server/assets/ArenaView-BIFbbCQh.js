import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useEffect, useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useQuery, useMutation } from "convex/react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
const soulData = {
  onde: {
    id: "onde",
    name: "Onde (Wave)",
    role: "Control / Displacement",
    baseStats: { hp: 80, pa: 4, pm: 3, mana: 5 },
    baseAttack: {
      id: "water_bolt",
      name: "Water Bolt",
      paCost: 2,
      pmCost: 0,
      manaCost: 0,
      range: 3,
      damage: 15,
      type: "attack",
      desc: "Basic ranged attack.",
      initiative: 50,
      maxUsesPerTurn: 2
    },
    ultimate: {
      id: "resonance",
      name: "Résonance (Ult)",
      paCost: 0,
      pmCost: 0,
      manaCost: 3,
      range: 5,
      damage: 40,
      type: "attack",
      desc: "High damage based on movement.",
      initiative: 20,
      cooldown: 3
    },
    actives: [
      {
        id: "impulse",
        name: "Impulsion",
        paCost: 2,
        pmCost: 0,
        manaCost: 0,
        range: 2,
        damage: 15,
        type: "attack",
        desc: "Repels target 1 cell.",
        initiative: 60,
        cooldown: 1
      },
      {
        id: "stasis",
        name: "Zone de Stase",
        paCost: 1,
        pmCost: 0,
        manaCost: 2,
        range: 3,
        damage: 0,
        type: "attack",
        desc: "Stuns the target for 1 turn.",
        initiative: 70,
        cooldown: 2,
        effect: {
          id: "stasis_stun",
          type: "stun",
          name: "Stasis",
          duration: 1
        }
      },
      {
        id: "flux",
        name: "Rivière de Flux",
        paCost: 2,
        pmCost: 0,
        manaCost: 1,
        range: 4,
        damage: 10,
        type: "attack",
        desc: "Damages in a line.",
        initiative: 40,
        maxUsesPerTurn: 1
      }
    ],
    passives: [
      {
        id: "drain_force",
        name: "Drain de Force",
        desc: "Gain 1 Mana when displacing an enemy.",
        effect: "drain_force"
      },
      {
        id: "flow_state",
        name: "Flow State",
        desc: "If you do not move, next spell gains +1 Range.",
        effect: "flow_state"
      }
    ]
  },
  fury: {
    id: "fury",
    name: "Fury (Berserk)",
    role: "Melee / Burst",
    baseStats: { hp: 120, pa: 3, pm: 4, mana: 3 },
    baseAttack: {
      id: "slash",
      name: "Rending Slash",
      paCost: 2,
      pmCost: 0,
      manaCost: 0,
      range: 1,
      damage: 25,
      type: "attack",
      desc: "High damage melee attack. Applies Bleed.",
      initiative: 50,
      maxUsesPerTurn: 2,
      effect: {
        id: "bleed",
        type: "dot",
        name: "Bleed",
        duration: 2,
        value: 10
      }
    },
    ultimate: {
      id: "execute",
      name: "Guillotine (Ult)",
      paCost: 3,
      pmCost: 0,
      manaCost: 2,
      range: 1,
      damage: 50,
      type: "attack",
      desc: "Massive execution damage.",
      initiative: 30,
      cooldown: 3
    },
    actives: [
      {
        id: "leap",
        name: "Savage Leap",
        paCost: 1,
        pmCost: 0,
        manaCost: 1,
        range: 3,
        damage: 15,
        type: "move_attack",
        desc: "Jump to cell and damage adjacent.",
        initiative: 80,
        cooldown: 2
      },
      {
        id: "bloodlust",
        name: "Bloodlust",
        paCost: 1,
        pmCost: 0,
        manaCost: 2,
        range: 0,
        damage: 0,
        type: "buff",
        desc: "Increases damage of next attack.",
        initiative: 90,
        cooldown: 2
      },
      {
        id: "whirlwind",
        name: "Whirlwind",
        paCost: 2,
        pmCost: 0,
        manaCost: 1,
        range: 1,
        damage: 20,
        type: "attack",
        desc: "AoE damage around self.",
        initiative: 45,
        maxUsesPerTurn: 1
      }
    ],
    passives: [
      {
        id: "masochism",
        name: "Masochism",
        desc: "Taking damage restores 1 PA for the next turn.",
        effect: "masochism"
      },
      {
        id: "momentum",
        name: "Momentum",
        desc: "Each cell moved increases next attack damage by 2.",
        effect: "momentum"
      }
    ]
  },
  aegis: {
    id: "aegis",
    name: "Aegis (Fortress)",
    role: "Defense / Zone",
    baseStats: { hp: 150, pa: 3, pm: 2, mana: 4 },
    baseAttack: {
      id: "shield_bash",
      name: "Shield Bash",
      paCost: 2,
      pmCost: 0,
      manaCost: 0,
      range: 1,
      damage: 15,
      type: "attack",
      desc: "Damages target.",
      initiative: 50,
      maxUsesPerTurn: 2
    },
    ultimate: {
      id: "bastion",
      name: "Iron Maiden (Ult)",
      paCost: 0,
      pmCost: 0,
      manaCost: 4,
      range: 2,
      damage: 30,
      type: "attack",
      desc: "Reflects damage taken previously.",
      initiative: 10,
      cooldown: 3
    },
    actives: [
      {
        id: "phalanx",
        name: "Phalanx Wall",
        paCost: 1,
        pmCost: 0,
        manaCost: 2,
        range: 3,
        damage: 0,
        type: "trap",
        desc: "Creates impassable terrain.",
        initiative: 70,
        cooldown: 2
      },
      {
        id: "taunt",
        name: "Magnetic Pull",
        paCost: 1,
        pmCost: 0,
        manaCost: 1,
        range: 4,
        damage: 0,
        type: "control",
        desc: "Pulls target closer.",
        initiative: 60,
        cooldown: 1
      },
      {
        id: "fortify",
        name: "Fortify",
        paCost: 2,
        pmCost: 0,
        manaCost: 0,
        range: 0,
        damage: 0,
        type: "buff",
        desc: "Grants 30 HP shield for 2 turns.",
        initiative: 95,
        cooldown: 3,
        effect: {
          id: "fortify_shield",
          type: "shield",
          name: "Fortified",
          duration: 2,
          value: 30
        }
      }
    ],
    passives: [
      {
        id: "thorns",
        name: "Thorns",
        desc: "Enemies attacking from range 1 take 5 damage.",
        effect: "thorns"
      },
      {
        id: "heavy_plating",
        name: "Heavy Plating",
        desc: "Max PM reduced by 1, reduce all incoming damage by 3.",
        effect: "heavy_plating"
      }
    ]
  }
};
const obstacles = [
  { x: 5, y: 4 },
  { x: 5, y: 5 },
  { x: 5, y: 6 },
  { x: 5, y: 7 },
  { x: 10, y: 8 },
  { x: 10, y: 9 },
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 8, y: 2 },
  { x: 9, y: 2 },
  { x: 8, y: 13 },
  { x: 9, y: 13 }
];
const initialInteractables = [
  {
    id: "well_1",
    type: "mana_well",
    pos: { x: 3, y: 8 },
    duration: -1,
    value: 2,
    triggeredBy: "player"
  },
  {
    id: "well_2",
    type: "mana_well",
    pos: { x: 12, y: 8 },
    duration: -1,
    value: 2,
    triggeredBy: "enemy"
  },
  {
    id: "well_3",
    type: "mana_well",
    pos: { x: 7, y: 7 },
    duration: -1,
    value: 1,
    triggeredBy: "both"
  }
];
const api = {};
function generateEnemyBuild() {
  const soulIds = ["onde", "fury", "aegis"];
  const primaryId = soulIds[Math.floor(Math.random() * soulIds.length)];
  const secondaryId = soulIds.filter((id) => id !== primaryId)[Math.floor(Math.random() * 2)];
  const primarySoul = soulData[primaryId];
  const secondarySoul = soulData[secondaryId];
  const baseStats = {
    hp: Math.floor(
      (primarySoul.baseStats.hp + secondarySoul.baseStats.hp) / 1.5
    ),
    pa: Math.floor((primarySoul.baseStats.pa + secondarySoul.baseStats.pa) / 2),
    pm: Math.floor((primarySoul.baseStats.pm + secondarySoul.baseStats.pm) / 2),
    mana: Math.floor(
      (primarySoul.baseStats.mana + secondarySoul.baseStats.mana) / 2
    )
  };
  const loadout = [];
  loadout.push({ kind: "elite", ability: primarySoul.ultimate });
  const allActives = [...primarySoul.actives, ...secondarySoul.actives];
  const selectedActives = allActives.sort(() => 0.5 - Math.random()).slice(0, 3);
  selectedActives.forEach((a) => loadout.push({ kind: "active", ability: a }));
  const allPassives = [...primarySoul.passives, ...secondarySoul.passives];
  const selectedPassives = allPassives.sort(() => 0.5 - Math.random()).slice(0, 2);
  selectedPassives.forEach(
    (p) => loadout.push({ kind: "passive", passive: p })
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
    passives: selectedPassives.map((p) => p.effect).filter((e) => !!e),
    loadout,
    effects: []
  };
}
function getDistance$1(c1, c2) {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
}
function getNeighbors(pos) {
  return [
    { x: pos.x + 1, y: pos.y },
    { x: pos.x - 1, y: pos.y },
    { x: pos.x, y: pos.y + 1 },
    { x: pos.x, y: pos.y - 1 },
    { x: pos.x + 1, y: pos.y - 1 },
    { x: pos.x - 1, y: pos.y + 1 }
  ];
}
function selectEnemyActions(eState, pState, interactables) {
  const queue = [];
  let currentEPos = { ...eState.pos };
  let currentEPa = eState.pa;
  const currentEPm = eState.pm;
  let currentEMana = eState.mana;
  const pPos = pState.pos;
  const moveSteps = currentEPm;
  for (let step = 0; step < moveSteps; step++) {
    const dist = getDistance$1(currentEPos, pPos);
    if (dist <= 1) break;
    const neighbors = getNeighbors(currentEPos);
    let bestNeighbor = null;
    let minDist = dist;
    for (const neighbor of neighbors) {
      const isWall = obstacles.some(
        (o) => o.x === neighbor.x && o.y === neighbor.y
      );
      const isPlayer = neighbor.x === pPos.x && neighbor.y === pPos.y;
      const isInteractableWall = interactables.some(
        (i) => i.type === "wall" && i.pos.x === neighbor.x && i.pos.y === neighbor.y
      );
      if (isWall || isPlayer || isInteractableWall) continue;
      const d = getDistance$1(neighbor, pPos);
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
        manaCost: 0
      });
    } else {
      break;
    }
  }
  const abilities = eState.loadout.filter((slot) => slot.kind !== "passive").map((slot) => slot.ability);
  const soul = soulData["fury"];
  abilities.push(soul.baseAttack);
  const availableAbilities = abilities.filter((a) => a.paCost <= currentEPa && a.manaCost <= currentEMana).sort((a, b) => b.damage - a.damage);
  for (const ability of availableAbilities) {
    const dist = getDistance$1(currentEPos, pPos);
    if (dist <= ability.range) {
      queue.push({
        type: "ability",
        target: pPos,
        name: ability.name,
        initiative: ability.initiative,
        paCost: ability.paCost,
        pmCost: ability.pmCost,
        manaCost: ability.manaCost,
        ability
      });
      currentEPa -= ability.paCost;
      currentEMana -= ability.manaCost;
      break;
    }
  }
  return queue;
}
function ArenaHeader({
  pSoul,
  playerStats,
  simStats,
  enemyStats,
  phase,
  onAbort,
  onToggleStats
}) {
  const phaseLabel = phase === "planning" ? "Planning" : phase === "resolving" ? "Resolving" : "Playback";
  return /* @__PURE__ */ jsxs("header", { className: "px-6 py-4 border-b border-neutral-900 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black z-50", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-6", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onAbort,
          className: "text-neutral-500 hover:text-white transition-colors uppercase font-bold text-xs tracking-widest",
          children: "← Abort"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-neutral-800" }),
      /* @__PURE__ */ jsxs("h1", { className: "text-xl font-black uppercase tracking-tighter text-white", children: [
        "Sim",
        /* @__PURE__ */ jsx("span", { className: "text-red-600", children: "." }),
        "Arena"
      ] }),
      /* @__PURE__ */ jsx(
        "span",
        {
          className: `rounded border px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${phase === "planning" ? "border-white/30 text-white" : phase === "resolving" ? "border-red-600/60 text-red-500" : "border-blue-500/50 text-blue-400"}`,
          children: phaseLabel
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-8 items-end", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 text-left", children: [
          "Subject: ",
          pSoul?.name ?? "---"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("p", { className: "text-[8px] text-red-600 uppercase mb-1", children: [
              "HP (",
              playerStats.hp,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-[2px]", children: Array.from({ length: Math.ceil(playerStats.maxHp / 10) }).map(
              (_, i) => /* @__PURE__ */ jsx(
                "div",
                {
                  className: `w-3 h-1.5 ${i < Math.ceil(playerStats.hp / 10) ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "bg-neutral-900"}`
                },
                i
              )
            ) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[8px] text-neutral-400 uppercase mb-1", children: "PA" }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: Array.from({ length: playerStats.maxPa }).map((_, i) => /* @__PURE__ */ jsx(
              "div",
              {
                className: `w-3 h-1.5 ${i < simStats.pa ? "bg-white" : "bg-neutral-900 border border-neutral-800"}`
              },
              i
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[8px] text-neutral-400 uppercase mb-1", children: "PM" }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: Array.from({ length: playerStats.maxPm }).map((_, i) => /* @__PURE__ */ jsx(
              "div",
              {
                className: `w-3 h-1.5 ${i < simStats.pm ? "bg-neutral-400" : "bg-neutral-900 border border-neutral-800"}`
              },
              i
            )) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-[8px] text-blue-500 uppercase mb-1", children: "Mana" }),
            /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: Array.from({ length: playerStats.maxMana }).map((_, i) => /* @__PURE__ */ jsx(
              "div",
              {
                className: `w-2 h-1.5 rounded-full ${i < simStats.mana ? "bg-blue-500 shadow-[0_0_8px_#3b82f6]" : "bg-neutral-900"}`
              },
              i
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex gap-1 mt-2", children: playerStats.effects.map((e, i) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "text-[7px] px-1.5 py-0.5 bg-white/5 text-white border border-white/10 flex items-center gap-1",
            title: `${e.type.toUpperCase()}: ${e.value || ""}`,
            children: [
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: `w-1 h-1 rounded-full ${e.type === "stun" ? "bg-amber-500" : e.type === "dot" ? "bg-orange-600" : e.type === "shield" ? "bg-blue-400" : "bg-green-500"}`
                }
              ),
              e.name,
              " ",
              /* @__PURE__ */ jsxs("span", { className: "opacity-50", children: [
                e.duration,
                "T"
              ] })
            ]
          },
          i
        )) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-8 w-px bg-neutral-900 hidden md:block" }),
      /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsx("p", { className: "text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 text-right", children: "Target: Enemy" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("p", { className: "text-[8px] text-red-600 uppercase mb-1 text-right", children: [
            "HP (",
            enemyStats.hp,
            ")"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-[2px] justify-end", children: Array.from({ length: Math.ceil(enemyStats.maxHp / 10) }).map(
            (_, i) => /* @__PURE__ */ jsx(
              "div",
              {
                className: `w-3 h-1.5 ${i < Math.ceil(enemyStats.hp / 10) ? "bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]" : "bg-neutral-900"}`
              },
              i
            )
          ) }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-1 mt-2 justify-end", children: enemyStats.effects.map((e, i) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "text-[7px] px-1.5 py-0.5 bg-red-500/5 text-red-200 border border-red-500/10 flex items-center gap-1",
              title: `${e.type.toUpperCase()}: ${e.value || ""}`,
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `w-1 h-1 rounded-full ${e.type === "stun" ? "bg-amber-500" : e.type === "dot" ? "bg-orange-600" : e.type === "shield" ? "bg-blue-400" : "bg-green-500"}`
                  }
                ),
                e.name,
                " ",
                /* @__PURE__ */ jsxs("span", { className: "opacity-50", children: [
                  e.duration,
                  "T"
                ] })
              ]
            },
            i
          )) })
        ] })
      ] }),
      onToggleStats && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onToggleStats,
          className: "px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors",
          children: "Stats"
        }
      )
    ] })
  ] });
}
function calculateTurnStats(events, entityId) {
  const stats = {
    damageDealt: 0,
    damageTaken: 0,
    healingDone: 0,
    manaSpent: 0,
    actionsExecuted: 0,
    distanceMoved: 0,
    damageMitigated: 0
  };
  let prevMana = null;
  let prevPos = null;
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
        if (event.entity === entityId && event.mana !== void 0) {
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
              Math.abs(event.pos.x + event.pos.y - (prevPos.x + prevPos.y))
            );
            stats.distanceMoved += dist;
          }
          prevPos = event.pos;
        }
        break;
      case "log":
        if (event.text.includes("mitigated") && entityId === "player" && event.text.includes("Heavy Plating")) {
          const match = event.text.match(/mitigated (\d+)/);
          if (match) stats.damageMitigated += parseInt(match[1], 10);
        }
        if (event.text.includes("absorbed") && entityId === "player") {
          const match = event.text.match(/absorbed (\d+)/);
          if (match) stats.damageMitigated += parseInt(match[1], 10);
        }
        break;
    }
  }
  stats.actionsExecuted = events.filter(
    (e) => e.type === "log" && e.text.includes("uses") && (entityId === "player" && e.text.includes("Player") || entityId === "enemy" && e.text.includes("Enemy"))
  ).length;
  return stats;
}
function aggregateStats(previous, turnStats) {
  const newTotal = {
    totalDamageDealt: previous.totalDamageDealt + turnStats.damageDealt,
    totalDamageTaken: previous.totalDamageTaken + turnStats.damageTaken,
    totalHealingDone: previous.totalHealingDone + turnStats.healingDone,
    totalManaSpent: previous.totalManaSpent + turnStats.manaSpent,
    totalActionsExecuted: previous.totalActionsExecuted + turnStats.actionsExecuted,
    totalDistanceMoved: previous.totalDistanceMoved + turnStats.distanceMoved,
    totalDamageMitigated: previous.totalDamageMitigated + turnStats.damageMitigated,
    turnCount: previous.turnCount + 1,
    dps: 0,
    effectiveDamage: 0
  };
  if (newTotal.turnCount > 0) {
    newTotal.dps = newTotal.totalDamageDealt / newTotal.turnCount;
  }
  newTotal.effectiveDamage = newTotal.totalDamageDealt + newTotal.totalDamageMitigated;
  return newTotal;
}
const initialCombatStats = {
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  totalHealingDone: 0,
  totalManaSpent: 0,
  totalActionsExecuted: 0,
  totalDistanceMoved: 0,
  totalDamageMitigated: 0,
  turnCount: 0,
  dps: 0,
  effectiveDamage: 0
};
const getDistance = (c1, c2) => {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
};
const getSimulatedResources = (state) => {
  const { server } = state;
  return server.actionQueue.reduce(
    (acc, action) => ({
      pa: acc.pa - action.paCost,
      pm: acc.pm - action.pmCost,
      mana: acc.mana - action.manaCost
    }),
    {
      pa: server.player.pa + server.persistentBuffs.bonusPa + (server.skipRequested ? 1 : 0),
      pm: server.player.pm,
      mana: server.player.mana
    }
  );
};
const getLastQueuedPos = (state) => {
  const { server } = state;
  return server.actionQueue.reduce((pos, action) => {
    if (action.type === "move") return action.target;
    if (action.ability?.type === "move_attack") return action.target;
    return pos;
  }, server.player.pos);
};
const isCellOccupiedByEnemy = (state, cell) => {
  return cell.x === state.server.enemy.pos.x && cell.y === state.server.enemy.pos.y;
};
const isCellWall = (cell) => {
  return obstacles.some((o) => o.x === cell.x && o.y === cell.y);
};
const isCellInteractableWall = (state, cell) => {
  return state.server.interactables.some(
    (i) => i.type === "wall" && i.pos.x === cell.x && i.pos.y === cell.y
  );
};
const selectPlayer = (state) => state.server.player;
const selectEnemy = (state) => state.server.enemy;
const selectActionQueue = (state) => state.server.actionQueue;
const selectPhase = (state) => state.ui.phase;
const selectActiveCommand = (state) => state.ui.activeCommand;
const selectLogs = (state) => state.ui.logs;
const selectTurnTimer = (state) => state.ui.turnTimer;
const selectSkipRequested = (state) => state.server.skipRequested;
const selectInteractables = (state) => state.server.interactables;
const selectCombatStats = (state) => state.ui.combatStats;
const selectEnemyCombatStats = (state) => state.ui.enemyCombatStats;
const TURN_TIMER_MAX = 60;
const useGameStore = create()(
  immer((set, get) => ({
    // Initial state
    server: {
      player: {
        id: "player",
        hp: 0,
        maxHp: 0,
        pa: 0,
        maxPa: 0,
        pm: 0,
        maxPm: 0,
        mana: 0,
        maxMana: 0,
        pos: { x: 0, y: 0 },
        passives: [],
        loadout: [],
        effects: []
      },
      enemy: {
        id: "enemy",
        hp: 0,
        maxHp: 0,
        pa: 0,
        maxPa: 0,
        pm: 0,
        maxPm: 0,
        mana: 0,
        maxMana: 0,
        pos: { x: 0, y: 0 },
        passives: [],
        loadout: [],
        effects: []
      },
      actionQueue: [],
      cooldowns: {},
      usesThisTurn: {},
      persistentBuffs: { flowStateRange: 0, bonusPa: 0 },
      interactables: [],
      turnNumber: 0,
      skipRequested: false
    },
    ui: {
      phase: "planning",
      activeCommand: null,
      hoveredCell: null,
      logs: ["System online. Select a command to begin sequence."],
      visualEffects: [],
      turnTimer: TURN_TIMER_MAX,
      turnTimerMax: TURN_TIMER_MAX,
      showStats: false,
      combatStats: initialCombatStats,
      enemyCombatStats: initialCombatStats
    },
    initializeGame: (player, enemy, initialLogs) => set((state) => {
      state.server.player = {
        ...player,
        loadout: player.loadout,
        effects: player.effects
      };
      state.server.enemy = {
        ...enemy,
        loadout: enemy.loadout,
        effects: enemy.effects
      };
      state.server.actionQueue = [];
      state.server.cooldowns = {};
      state.server.usesThisTurn = {};
      state.server.persistentBuffs = { flowStateRange: 0, bonusPa: 0 };
      state.server.interactables = [...initialInteractables];
      state.server.turnNumber = 0;
      state.server.skipRequested = false;
      state.ui.phase = "planning";
      state.ui.activeCommand = null;
      state.ui.hoveredCell = null;
      state.ui.visualEffects = [];
      state.ui.turnTimer = TURN_TIMER_MAX;
      state.ui.logs = initialLogs ?? [
        "System online. Select a command to begin sequence."
      ];
    }),
    setActiveCommand: (command) => set((state) => {
      state.ui.activeCommand = command;
    }),
    setHoveredCell: (cell) => set((state) => {
      state.ui.hoveredCell = cell;
    }),
    handleCellClick: (cell, buildPassives) => set((state) => {
      const { ui, server } = state;
      if (ui.phase !== "planning") return;
      if (!ui.activeCommand) return;
      const lastPos = getLastQueuedPos(state);
      const dist = getDistance(lastPos, cell);
      const isOccupiedByEnemy = isCellOccupiedByEnemy(state, cell);
      const isWall = isCellWall(cell);
      const isInteractableWall = isCellInteractableWall(state, cell);
      const simStats = getSimulatedResources(state);
      if (ui.activeCommand.type === "move") {
        if (dist > 0 && dist <= simStats.pm && !isOccupiedByEnemy && !isWall && !isInteractableWall) {
          state.server.actionQueue.push({
            type: "move",
            target: cell,
            paCost: 0,
            pmCost: dist,
            manaCost: 0,
            name: "Move",
            initiative: 100
          });
          state.ui.activeCommand = null;
        } else {
          state.ui.logs = ["Invalid move target.", ...state.ui.logs].slice(
            0,
            15
          );
        }
        return;
      }
      const ability = ui.activeCommand.ability;
      let effectiveRange = ability.range;
      if (buildPassives.includes("flow_state") && server.persistentBuffs.flowStateRange > 0) {
        effectiveRange += server.persistentBuffs.flowStateRange;
      }
      const currentCooldown = server.cooldowns[ability.id] || 0;
      if (currentCooldown > 0) {
        state.ui.logs = [
          `${ability.name} is on cooldown for ${currentCooldown} more turns.`,
          ...state.ui.logs
        ].slice(0, 15);
        return;
      }
      const currentUses = server.usesThisTurn[ability.id] || 0;
      const queuedUses = server.actionQueue.filter(
        (action) => action.type === "ability" && action.ability?.id === ability.id
      ).length;
      if (ability.maxUsesPerTurn && currentUses + queuedUses >= ability.maxUsesPerTurn) {
        state.ui.logs = [
          `Max uses per turn reached for ${ability.name}.`,
          ...state.ui.logs
        ].slice(0, 15);
        return;
      }
      if (!(dist <= effectiveRange && (!isWall && !isInteractableWall || ability.type === "buff"))) {
        state.ui.logs = [
          `Target out of range for ${ability.name}.`,
          ...state.ui.logs
        ].slice(0, 15);
        return;
      }
      if (!(simStats.pa >= ability.paCost && simStats.mana >= ability.manaCost)) {
        state.ui.logs = [
          `Insufficient resources for ${ability.name}.`,
          ...state.ui.logs
        ].slice(0, 15);
        return;
      }
      if (ability.type === "move_attack" && (isOccupiedByEnemy || isWall || isInteractableWall)) {
        state.ui.logs = [
          "Cannot leap onto occupied cell.",
          ...state.ui.logs
        ].slice(0, 15);
        return;
      }
      state.server.actionQueue.push({
        type: "ability",
        target: cell,
        ability,
        paCost: ability.paCost,
        pmCost: ability.pmCost,
        manaCost: ability.manaCost,
        name: ability.name,
        initiative: ability.initiative
      });
      state.ui.activeCommand = null;
    }),
    queueAction: (action) => set((state) => {
      state.server.actionQueue.push(action);
      state.ui.activeCommand = null;
    }),
    clearQueue: () => set((state) => {
      state.server.actionQueue = [];
      state.ui.activeCommand = null;
    }),
    startTurnResolution: () => set((state) => {
      state.ui.phase = "resolving";
      state.ui.activeCommand = null;
      state.ui.hoveredCell = null;
      state.ui.turnTimer = TURN_TIMER_MAX;
    }),
    applyEvent: (event, effectId) => set((state) => {
      const nextUiPhase = state.ui.phase === "resolving" ? "playback" : state.ui.phase;
      if (event.type === "log") {
        state.ui.phase = nextUiPhase;
        state.ui.logs = [event.text, ...state.ui.logs].slice(0, 15);
        return;
      }
      if (event.type === "effect") {
        if (effectId === void 0) return;
        state.ui.phase = nextUiPhase;
        state.ui.visualEffects.push({
          id: effectId,
          x: event.pos.x,
          y: event.pos.y,
          text: event.text,
          color: event.color
        });
        return;
      }
      if (event.type === "move") {
        if (event.entity === "player") {
          state.server.player.pos = event.pos;
        } else {
          state.server.enemy.pos = event.pos;
        }
        state.ui.phase = nextUiPhase;
        return;
      }
      if (event.type === "rest_triggered") {
        state.ui.logs = [
          "> REST BONUS: +1 PA for next turn",
          ...state.ui.logs
        ].slice(0, 15);
        return;
      }
      if (event.type === "interact") {
        return;
      }
      const entity = event.entity;
      if (entity === "player") {
        if (event.hp !== void 0) state.server.player.hp = event.hp;
        if (event.pa !== void 0) state.server.player.pa = event.pa;
        if (event.pm !== void 0) state.server.player.pm = event.pm;
        if (event.mana !== void 0) state.server.player.mana = event.mana;
      } else {
        if (event.hp !== void 0) state.server.enemy.hp = event.hp;
        if (event.pa !== void 0) state.server.enemy.pa = event.pa;
        if (event.pm !== void 0) state.server.enemy.pm = event.pm;
        if (event.mana !== void 0) state.server.enemy.mana = event.mana;
      }
      state.ui.phase = nextUiPhase;
    }),
    removeEffect: (effectId) => set((state) => {
      state.ui.visualEffects = state.ui.visualEffects.filter(
        (e) => e.id !== effectId
      );
    }),
    finishTurn: (nextTurnState) => set((state) => {
      state.server.actionQueue = [];
      state.server.cooldowns = nextTurnState.cooldowns;
      state.server.usesThisTurn = nextTurnState.usesThisTurn;
      state.server.persistentBuffs = {
        flowStateRange: nextTurnState.flowStateRange,
        bonusPa: nextTurnState.bonusPa
      };
      state.server.turnNumber += 1;
      state.server.skipRequested = false;
      state.ui.phase = "planning";
      state.ui.activeCommand = null;
      state.ui.turnTimer = TURN_TIMER_MAX;
    }),
    runTurnResolution: async (player, enemy, queue, turnState) => {
      const { startTurnResolution, applyEvent, removeEffect, finishTurn } = get();
      if (queue.length === 0) return;
      startTurnResolution();
      const { resolveTurn } = await import("./engine-D7j0TPJy.js");
      const state = get();
      const isRestTurn = state.server.skipRequested;
      const skipRequested = state.server.skipRequested;
      const { events, nextTurnState, interactables } = resolveTurn(
        player,
        enemy,
        queue,
        turnState,
        {
          interactables: state.server.interactables,
          isRestTurn,
          skipRequested
        }
      );
      set((s) => {
        s.server.interactables = interactables;
      });
      let effectId = 1;
      for (const event of events) {
        if (event.type === "delay") {
          await new Promise((resolve) => setTimeout(resolve, event.ms));
          continue;
        }
        if (event.type === "effect") {
          const currentEffectId = effectId++;
          applyEvent(event, currentEffectId);
          setTimeout(() => removeEffect(currentEffectId), 1200);
        } else {
          applyEvent(event);
        }
      }
      const playerTurnStats = calculateTurnStats(events, "player");
      const enemyTurnStats = calculateTurnStats(events, "enemy");
      set((s) => {
        s.ui.combatStats = aggregateStats(s.ui.combatStats, playerTurnStats);
        s.ui.enemyCombatStats = aggregateStats(
          s.ui.enemyCombatStats,
          enemyTurnStats
        );
      });
      finishTurn(nextTurnState);
    },
    setTurnTimer: (time) => set((state) => {
      state.ui.turnTimer = Math.max(0, time);
    }),
    requestSkip: () => set((state) => {
      state.server.skipRequested = true;
      state.ui.logs = [
        "> SKIP REQUESTED: Rest bonus (+1 PA) will apply next turn",
        ...state.ui.logs
      ].slice(0, 15);
    }),
    updateInteractables: (interactables) => set((state) => {
      state.server.interactables = interactables;
    }),
    updateCombatStats: (turnStats) => set((state) => {
      state.ui.combatStats = aggregateStats(state.ui.combatStats, turnStats);
    }),
    toggleStatsOverlay: () => set((state) => {
      state.ui.showStats = !state.ui.showStats;
    }),
    resetCombatStats: () => set((state) => {
      state.ui.combatStats = initialCombatStats;
      state.ui.enemyCombatStats = initialCombatStats;
    })
  }))
);
function GridRenderer({ buildPassives, interactables = [], onCellClick }) {
  const playerPos = useGameStore((s) => s.server.player.pos);
  const enemyPos = useGameStore((s) => s.server.enemy.pos);
  const { actionQueue, flowStateRange } = useGameStore(
    useShallow((s) => ({
      actionQueue: s.server.actionQueue,
      flowStateRange: s.server.persistentBuffs.flowStateRange
    }))
  );
  const { activeCommand, hoveredCell, visualEffects, phase } = useGameStore(
    useShallow((s) => ({
      activeCommand: s.ui.activeCommand,
      hoveredCell: s.ui.hoveredCell,
      visualEffects: s.ui.visualEffects,
      phase: s.ui.phase
    }))
  );
  const simStats = useGameStore(useShallow(getSimulatedResources));
  const isResolving = phase !== "planning";
  const setHoveredCell = useGameStore((s) => s.setHoveredCell);
  const handleCellClick = useGameStore((s) => s.handleCellClick);
  const gridSize = 16;
  const visionRange = 6;
  const rows = Array.from({ length: gridSize }, (_, i) => i);
  const cols = Array.from({ length: gridSize }, (_, i) => i);
  const getInteractableAt = (x, y) => {
    return interactables.find((i) => i.pos.x === x && i.pos.y === y);
  };
  const isDynamicWall = (x, y) => {
    const int = getInteractableAt(x, y);
    return int?.type === "wall";
  };
  const isManaWell = (x, y) => {
    const int = getInteractableAt(x, y);
    return int?.type === "mana_well";
  };
  return /* @__PURE__ */ jsx("div", { className: "flex-1 bg-neutral-950 border border-neutral-900 relative overflow-auto scroll-smooth flex p-4 touch-pan-x touch-pan-y cursor-grab active:cursor-grabbing", children: /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1 items-center m-auto relative min-w-[800px] lg:min-w-[1000px] pb-12", children: rows.map((y) => /* @__PURE__ */ jsx(
    "div",
    {
      className: "flex gap-1 justify-center relative",
      style: {
        transform: `translateX(${y % 2 !== 0 ? "2.2%" : "-2.2%"})`
      },
      children: cols.map((x) => {
        const cell = { x, y };
        const isUnit = playerPos.x === x && playerPos.y === y;
        const isEnemyRaw = enemyPos.x === x && enemyPos.y === y;
        const isWall = isCellWall(cell);
        const isDynamicWallCell = isDynamicWall(x, y);
        const manaWell = isManaWell(x, y);
        const distFromPlayer = getDistance(playerPos, cell);
        const isVisible = distFromPlayer <= visionRange;
        const isEnemy = isEnemyRaw && isVisible;
        const lastPos = actionQueue.reduce((pos, action) => {
          if (action.type === "move") return action.target;
          const ability = action.ability;
          if (ability && ability.type === "move_attack")
            return action.target;
          return pos;
        }, playerPos);
        const distance = getDistance(lastPos, cell);
        let inValidRange = false;
        if (activeCommand?.type === "move") {
          inValidRange = distance > 0 && distance <= simStats.pm && !isWall && !isDynamicWallCell && !isEnemyRaw;
        } else if (activeCommand?.type === "ability") {
          let effectiveRange = activeCommand.ability.range;
          if (buildPassives.includes("flow_state") && flowStateRange > 0) {
            effectiveRange += flowStateRange;
          }
          inValidRange = distance <= effectiveRange && (!isWall && !isDynamicWallCell || activeCommand.ability.type === "buff");
        }
        const isHoveredValid = hoveredCell && hoveredCell.x === x && hoveredCell.y === y && inValidRange;
        const hexStyle = {
          clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
          width: "clamp(2rem, 4.5vw, 4rem)",
          aspectRatio: "1 / 0.866"
        };
        return /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => {
              handleCellClick(cell, buildPassives);
              onCellClick?.(cell);
            },
            onMouseEnter: () => setHoveredCell(cell),
            onMouseLeave: () => setHoveredCell(null),
            style: hexStyle,
            className: `
                    relative group transition-all duration-300 flex items-center justify-center
                    ${inValidRange ? "cursor-pointer" : ""}
                    ${!isVisible ? "bg-neutral-950 opacity-40" : isWall || isDynamicWallCell ? "bg-neutral-800" : "bg-neutral-900"}
                    ${isHoveredValid && isVisible ? "bg-red-600/30" : ""}
                    ${inValidRange && !isHoveredValid && isVisible ? "bg-white/10" : ""}
                  `,
            children: [
              visualEffects.filter((e) => e.x === x && e.y === y).map((effect) => /* @__PURE__ */ jsx(
                "div",
                {
                  className: `absolute z-50 animate-bounce font-black text-lg ${effect.color}`,
                  style: { textShadow: "0 0 4px black" },
                  children: effect.text
                },
                effect.id
              )),
              manaWell && isVisible && /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex items-center justify-center z-20 pointer-events-none", children: [
                /* @__PURE__ */ jsx("div", { className: "w-3/5 h-3/5 rounded-full bg-blue-500/30 animate-pulse" }),
                /* @__PURE__ */ jsx("div", { className: "absolute w-2/5 h-2/5 rounded-full bg-blue-500/50" })
              ] }),
              isDynamicWallCell && isVisible && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 z-20 pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-red-900/40 border border-red-700/50" }) }),
              /* @__PURE__ */ jsxs("span", { className: "absolute top-[20%] text-[5px] font-mono opacity-20 pointer-events-none text-white", children: [
                x,
                ",",
                y
              ] }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute inset-[1px] bg-black",
                  style: { clipPath: hexStyle.clipPath, zIndex: 1 }
                }
              ),
              !isVisible && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute inset-0 bg-black/60 z-[2]",
                  style: { clipPath: hexStyle.clipPath }
                }
              ),
              (isWall || isDynamicWallCell) && isVisible && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute inset-1 bg-neutral-800 z-[2]",
                  style: { clipPath: hexStyle.clipPath }
                }
              ),
              inValidRange && !isHoveredValid && isVisible && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute inset-0 bg-white/5 z-10 pointer-events-none",
                  style: { clipPath: hexStyle.clipPath }
                }
              ),
              isHoveredValid && isVisible && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute inset-0 bg-red-600/20 z-10 pointer-events-none",
                  style: { clipPath: hexStyle.clipPath }
                }
              ),
              isUnit && /* @__PURE__ */ jsx(
                "div",
                {
                  className: `absolute z-30 w-[40%] h-[40%] rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] ${isResolving ? "animate-pulse" : ""}`
                }
              ),
              isEnemy && /* @__PURE__ */ jsxs("div", { className: "absolute z-30 w-[40%] h-[40%] bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.8)] flex items-center justify-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-1/2 h-[2px] bg-black rotate-45" }),
                /* @__PURE__ */ jsx("div", { className: "w-1/2 h-[2px] bg-black -rotate-45 absolute" })
              ] })
            ]
          },
          `${x}-${y}`
        );
      })
    },
    y
  )) }) });
}
function CommandPanel({
  activeCommand,
  setActiveCommand,
  simStats,
  loadout,
  cooldowns,
  disabled = false
}) {
  const passiveSlots = loadout.filter((s) => s.kind === "passive");
  const getSlotLabel = (slot, index) => {
    if (slot.kind === "elite") return "ELITE";
    if (slot.kind === "passive") return `P${index + 1}`;
    return `${index + 1}`;
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-neutral-950 border border-neutral-900 p-4 flex-shrink-0", children: [
    /* @__PURE__ */ jsxs("h3", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-3 flex justify-between", children: [
      /* @__PURE__ */ jsx("span", { children: "Loadout Commands" }),
      activeCommand && !disabled && /* @__PURE__ */ jsx("span", { className: "text-red-500 animate-pulse", children: "Waiting for target..." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2 mb-3", children: loadout.map((slot, index) => {
      if (slot.kind === "passive") {
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: "p-2 border border-red-900/30 bg-red-900/5 text-center",
            title: slot.passive.desc,
            children: [
              /* @__PURE__ */ jsx("div", { className: "text-[7px] text-red-600 uppercase mb-1", children: getSlotLabel(slot, index) }),
              /* @__PURE__ */ jsx("div", { className: "text-[8px] font-bold text-red-400 truncate", children: slot.passive.name })
            ]
          },
          `passive-${slot.passive.id}`
        );
      }
      const ability = slot.ability;
      const canAfford = simStats.pa >= ability.paCost && simStats.mana >= ability.manaCost;
      const isElite = slot.kind === "elite";
      const isActive = activeCommand?.type === "ability" && activeCommand.ability.id === ability.id;
      const currentCooldown = cooldowns[ability.id] || 0;
      const canUse = !disabled && canAfford && currentCooldown === 0;
      return /* @__PURE__ */ jsxs(
        "button",
        {
          disabled: !canUse,
          onClick: () => setActiveCommand({ type: "ability", ability }),
          className: `p-2 border transition-all text-left relative ${isElite ? "border-red-600/50 bg-red-900/10" : "border-neutral-800 bg-neutral-900"} ${canUse ? isActive ? "border-white bg-neutral-800" : "hover:border-neutral-500" : "opacity-40 cursor-not-allowed"}`,
          title: `${ability.name}
${ability.desc}
PA: ${ability.paCost} | M: ${ability.manaCost} | CD: ${ability.cooldown || 0}`,
          children: [
            isElite && /* @__PURE__ */ jsx("div", { className: "absolute top-0 left-0 w-1 h-full bg-red-600" }),
            isActive && /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-1 h-full bg-white" }),
            /* @__PURE__ */ jsx("div", { className: "text-[8px] text-neutral-500 uppercase mb-0.5", children: getSlotLabel(slot, index) }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `text-[9px] font-bold truncate ${isElite ? "text-red-400" : "text-white"}`,
                children: ability.name
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1", children: [
              currentCooldown > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[7px] text-red-500", children: [
                "CD:",
                currentCooldown
              ] }),
              ability.paCost > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[7px] text-neutral-400", children: [
                ability.paCost,
                "PA"
              ] }),
              ability.manaCost > 0 && /* @__PURE__ */ jsxs("span", { className: "text-[7px] text-blue-500", children: [
                ability.manaCost,
                "M"
              ] })
            ] })
          ]
        },
        ability.id
      );
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "border-t border-neutral-900 pt-3", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          disabled: disabled || simStats.pm <= 0,
          onClick: () => setActiveCommand({ type: "move" }),
          className: `w-full py-2 flex justify-between px-3 items-center border transition-all uppercase tracking-widest text-[10px] font-bold mb-2 ${!disabled && simStats.pm > 0 ? activeCommand?.type === "move" ? "bg-white text-black border-white" : "bg-neutral-900 border-neutral-700 text-white hover:border-white" : "bg-black border-neutral-900 text-neutral-700 cursor-not-allowed"}`,
          children: [
            /* @__PURE__ */ jsx("span", { children: "Move" }),
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: "PM Based" })
          ]
        }
      ),
      activeCommand && !disabled && /* @__PURE__ */ jsx("div", { className: "p-3 bg-neutral-900 border border-neutral-700 relative shadow-2xl", children: activeCommand.type === "move" ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-[10px] font-bold text-white uppercase mb-1", children: "Move" }),
        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-neutral-400 uppercase leading-relaxed", children: "Reposition unit. Costs PM based on distance." })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between mb-2 pb-2 border-b border-neutral-800", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-white uppercase", children: activeCommand.ability.name }),
          /* @__PURE__ */ jsxs("span", { className: "text-[8px] font-mono text-neutral-500", children: [
            "Init: ",
            activeCommand.ability.initiative
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-[9px] text-neutral-400 uppercase leading-relaxed mb-2", children: activeCommand.ability.desc }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-red-500 font-mono", children: [
            "RNG: ",
            activeCommand.ability.range,
            " | DMG:",
            " ",
            activeCommand.ability.damage
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "text-[9px] text-neutral-500 font-mono", children: [
            activeCommand.ability.cooldown && `CD: ${activeCommand.ability.cooldown} `,
            activeCommand.ability.maxUsesPerTurn && `Max/Turn: ${activeCommand.ability.maxUsesPerTurn}`
          ] })
        ] })
      ] }) })
    ] }),
    passiveSlots.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t border-neutral-900", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-[9px] font-bold text-red-600 uppercase tracking-widest mb-2", children: "Active Passives" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: passiveSlots.map((slot) => /* @__PURE__ */ jsx(
        "span",
        {
          className: "text-[8px] px-2 py-1 bg-red-900/20 border border-red-900/30 text-red-400",
          title: slot.passive.desc,
          children: slot.passive.name
        },
        slot.passive.id
      )) })
    ] })
  ] });
}
function SequencePanel() {
  const actionQueue = useGameStore(selectActionQueue);
  const logs = useGameStore(selectLogs);
  const phase = useGameStore(selectPhase);
  const skipRequested = useGameStore(selectSkipRequested);
  const isResolving = phase !== "planning";
  const clearQueue = useGameStore((s) => s.clearQueue);
  const runTurnResolution = useGameStore((s) => s.runTurnResolution);
  const requestSkip = useGameStore((s) => s.requestSkip);
  const { player, enemy, cooldowns, usesThisTurn, persistentBuffs } = useGameStore(
    useShallow((s) => ({
      player: s.server.player,
      enemy: s.server.enemy,
      cooldowns: s.server.cooldowns,
      usesThisTurn: s.server.usesThisTurn,
      persistentBuffs: s.server.persistentBuffs
    }))
  );
  const handleResolveTurn = async () => {
    if (phase !== "planning") return;
    if (actionQueue.length === 0) return;
    await runTurnResolution(player, enemy, [...actionQueue], {
      cooldowns: { ...cooldowns },
      usesThisTurn: { ...usesThisTurn },
      flowStateRange: persistentBuffs.flowStateRange,
      bonusPa: persistentBuffs.bonusPa,
      isRestTurn: skipRequested
    });
  };
  const handleSkipTurn = () => {
    if (phase !== "planning") return;
    requestSkip();
    if (actionQueue.length > 0) {
      handleResolveTurn();
    }
  };
  const commitLabel = phase === "resolving" ? "Resolving..." : phase === "playback" ? "Playback..." : skipRequested ? "Commit (Rest)" : "Commit Sequence";
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col gap-4 min-h-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-neutral-950 border border-neutral-900 p-4 flex flex-col h-1/2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-[10px] font-black uppercase tracking-[0.2em] text-white", children: [
            "Sequence [",
            actionQueue.length,
            "]"
          ] }),
          skipRequested && /* @__PURE__ */ jsx("span", { className: "text-[8px] font-bold text-green-500 bg-green-900/20 px-2 py-0.5 border border-green-600/30", children: "REST" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            disabled: isResolving,
            onClick: clearQueue,
            className: "text-[9px] font-bold text-neutral-600 hover:text-red-600 uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            children: "Clear All"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto space-y-2 mb-4 pr-2", children: actionQueue.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-[9px] text-neutral-700 font-mono", children: "No commands queued. Click abilities or use Skip Turn for rest bonus." }) : actionQueue.map((action, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex justify-between items-center text-[9px] font-mono bg-neutral-900 px-3 py-2 border border-neutral-800",
          children: [
            /* @__PURE__ */ jsxs("span", { className: "text-neutral-300", children: [
              (i + 1).toString().padStart(2, "0"),
              " ",
              action.name.toUpperCase()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "text-neutral-600", children: [
                "Init:",
                action.initiative
              ] }),
              action.pmCost > 0 && /* @__PURE__ */ jsxs("span", { className: "text-neutral-500", children: [
                "-",
                action.pmCost,
                "PM"
              ] }),
              action.paCost > 0 && /* @__PURE__ */ jsxs("span", { className: "text-neutral-300", children: [
                "-",
                action.paCost,
                "PA"
              ] }),
              action.manaCost > 0 && /* @__PURE__ */ jsxs("span", { className: "text-blue-500", children: [
                "-",
                action.manaCost,
                "M"
              ] })
            ] })
          ]
        },
        i
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            disabled: actionQueue.length === 0 || isResolving,
            onClick: handleResolveTurn,
            className: `flex-1 py-3 text-xs font-black uppercase tracking-[0.3em] transition-all
              ${actionQueue.length > 0 && !isResolving ? skipRequested ? "bg-green-600 text-white hover:bg-green-500" : "bg-white text-black hover:bg-red-600 hover:text-white" : "bg-neutral-900 text-neutral-700 cursor-not-allowed"}`,
            children: commitLabel
          }
        ),
        actionQueue.length === 0 && !isResolving && /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleSkipTurn,
            className: "px-4 py-3 text-[10px] font-bold uppercase tracking-widest border border-green-600/50 bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-colors",
            children: "Skip (Rest)"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-neutral-950 border border-neutral-900 p-4 flex-1 overflow-y-auto font-mono text-[9px] text-neutral-500 space-y-1", children: logs.map((log, i) => /* @__PURE__ */ jsx("div", { className: log.startsWith(">") ? "text-white" : "", children: log }, i)) })
  ] });
}
function StatsOverlay() {
  const playerStats = useGameStore(selectCombatStats);
  const enemyStats = useGameStore(selectEnemyCombatStats);
  const toggleStatsOverlay = useGameStore((s) => s.toggleStatsOverlay);
  const resetCombatStats = useGameStore((s) => s.resetCombatStats);
  const formatNumber = (n, decimals = 1) => {
    return n.toFixed(decimals);
  };
  const getMitigationPct = (stats) => stats.totalDamageTaken + stats.totalDamageMitigated > 0 ? (stats.totalDamageMitigated / (stats.totalDamageTaken + stats.totalDamageMitigated) * 100).toFixed(1) : "0.0";
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 md:p-8 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-neutral-950 border border-neutral-800 p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8 pb-4 border-b border-neutral-900", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-black uppercase tracking-tighter text-white", children: "Tactical Analytics" }),
        /* @__PURE__ */ jsxs("p", { className: "text-[10px] text-neutral-500 uppercase tracking-widest mt-1", children: [
          "Sequence performance report - Turn ",
          playerStats.turnCount
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: resetCombatStats,
            className: "px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-neutral-800 bg-neutral-900 text-neutral-500 hover:text-white hover:border-neutral-600 transition-all",
            children: "Reset Data"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: toggleStatsOverlay,
            className: "px-4 py-2 text-[10px] font-bold uppercase tracking-widest border border-neutral-700 bg-white text-black hover:bg-neutral-200 transition-all",
            children: "Close"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-white" }),
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-white", children: "Subject: Player" })
        ] }),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            label: "Damage Output",
            value: playerStats.totalDamageDealt,
            subValue: `${formatNumber(playerStats.dps)} per turn`,
            color: "text-white"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Damage Taken",
              value: playerStats.totalDamageTaken,
              subValue: `${playerStats.totalDamageMitigated} mitigated (${getMitigationPct(playerStats)}%)`,
              compact: true
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Mana Efficiency",
              value: playerStats.totalManaSpent,
              subValue: `${playerStats.totalManaSpent > 0 ? formatNumber(playerStats.totalDamageDealt / playerStats.totalManaSpent) : "0.0"} dmg/mana`,
              compact: true,
              color: "text-blue-400"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Distance",
              value: playerStats.totalDistanceMoved,
              subValue: "Cells traveled",
              compact: true
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Actions",
              value: playerStats.totalActionsExecuted,
              subValue: "Combat maneuvers",
              compact: true
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "w-2 h-2 bg-red-600" }),
          /* @__PURE__ */ jsx("h3", { className: "text-xs font-black uppercase tracking-widest text-red-500", children: "Target: Enemy" })
        ] }),
        /* @__PURE__ */ jsx(
          StatCard,
          {
            label: "Damage Output",
            value: enemyStats.totalDamageDealt,
            subValue: `${formatNumber(enemyStats.dps)} per turn`,
            color: "text-red-500"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Damage Taken",
              value: enemyStats.totalDamageTaken,
              subValue: `${enemyStats.totalDamageMitigated} mitigated (${getMitigationPct(enemyStats)}%)`,
              compact: true
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Mana Efficiency",
              value: enemyStats.totalManaSpent,
              subValue: `${enemyStats.totalManaSpent > 0 ? formatNumber(enemyStats.totalDamageDealt / enemyStats.totalManaSpent) : "0.0"} dmg/mana`,
              compact: true,
              color: "text-blue-400"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Distance",
              value: enemyStats.totalDistanceMoved,
              subValue: "Cells traveled",
              compact: true
            }
          ),
          /* @__PURE__ */ jsx(
            StatCard,
            {
              label: "Actions",
              value: enemyStats.totalActionsExecuted,
              subValue: "Combat maneuvers",
              compact: true
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-12 p-6 border border-neutral-900 bg-neutral-900/30 flex flex-col md:flex-row justify-between items-center gap-8", children: /* @__PURE__ */ jsxs("div", { className: "flex-1 w-full", children: [
      /* @__PURE__ */ jsx("div", { className: "text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4", children: "Relative Damage Dominance" }),
      /* @__PURE__ */ jsxs("div", { className: "w-full h-4 bg-neutral-800 rounded-full overflow-hidden flex", children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "h-full bg-white transition-all duration-1000",
            style: {
              width: `${playerStats.totalDamageDealt / (playerStats.totalDamageDealt + enemyStats.totalDamageDealt || 1) * 100}%`
            }
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "h-full bg-red-600 transition-all duration-1000",
            style: {
              width: `${enemyStats.totalDamageDealt / (playerStats.totalDamageDealt + enemyStats.totalDamageDealt || 1) * 100}%`
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-2", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-white", children: [
          Math.round(
            playerStats.totalDamageDealt / (playerStats.totalDamageDealt + enemyStats.totalDamageDealt || 1) * 100
          ),
          "% Player"
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-[10px] font-mono text-red-500", children: [
          Math.round(
            enemyStats.totalDamageDealt / (playerStats.totalDamageDealt + enemyStats.totalDamageDealt || 1) * 100
          ),
          "% Enemy"
        ] })
      ] })
    ] }) })
  ] }) });
}
function StatCard({
  label,
  value,
  subValue,
  color = "text-neutral-300",
  compact = false
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `border border-neutral-900 p-4 bg-black/40 ${compact ? "py-3" : "py-5"}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1", children: label }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: `${compact ? "text-xl" : "text-3xl"} font-black ${color}`,
            children: value
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "text-[9px] text-neutral-600 mt-1 uppercase", children: subValue })
      ]
    }
  );
}
function TurnClock() {
  const phase = useGameStore(selectPhase);
  const turnTimer = useGameStore(selectTurnTimer);
  const skipRequested = useGameStore(selectSkipRequested);
  const setTurnTimer = useGameStore((s) => s.setTurnTimer);
  const requestSkip = useGameStore((s) => s.requestSkip);
  const runTurnResolution = useGameStore((s) => s.runTurnResolution);
  const clearQueue = useGameStore((s) => s.clearQueue);
  const player = useGameStore((s) => s.server.player);
  const enemy = useGameStore((s) => s.server.enemy);
  const cooldowns = useGameStore((s) => s.server.cooldowns);
  const usesThisTurn = useGameStore((s) => s.server.usesThisTurn);
  const persistentBuffs = useGameStore((s) => s.server.persistentBuffs);
  const actionQueue = useGameStore((s) => s.server.actionQueue);
  useEffect(() => {
    if (phase !== "planning") return;
    const interval = setInterval(() => {
      setTurnTimer(turnTimer - 1);
    }, 1e3);
    return () => clearInterval(interval);
  }, [phase, turnTimer, setTurnTimer]);
  useEffect(() => {
    if (phase === "planning" && turnTimer <= 0 && actionQueue.length > 0) {
      requestSkip();
      runTurnResolution(player, enemy, [...actionQueue], {
        cooldowns: { ...cooldowns },
        usesThisTurn: { ...usesThisTurn },
        flowStateRange: persistentBuffs.flowStateRange,
        bonusPa: persistentBuffs.bonusPa,
        isRestTurn: true
      });
    } else if (phase === "planning" && turnTimer <= 0 && actionQueue.length === 0) {
      setTurnTimer(60);
    }
  }, [turnTimer, phase, actionQueue]);
  const handleSkipTurn = useCallback(() => {
    if (phase !== "planning") return;
    requestSkip();
    if (actionQueue.length > 0) {
      runTurnResolution(player, enemy, [...actionQueue], {
        cooldowns: { ...cooldowns },
        usesThisTurn: { ...usesThisTurn },
        flowStateRange: persistentBuffs.flowStateRange,
        bonusPa: persistentBuffs.bonusPa,
        isRestTurn: true
      });
    }
  }, [phase, actionQueue]);
  const handleClearAndReset = useCallback(() => {
    clearQueue();
    setTurnTimer(60);
  }, [clearQueue, setTurnTimer]);
  if (phase !== "planning") return null;
  const timerPercent = turnTimer / 60 * 100;
  const isLow = turnTimer <= 10;
  return /* @__PURE__ */ jsxs("div", { className: "bg-black border-b border-neutral-900 px-6 py-2 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-neutral-600 uppercase tracking-widest", children: "Turn" }),
        /* @__PURE__ */ jsx("span", { className: "text-lg font-black text-white", children: useGameStore.getState().server.turnNumber })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "w-32 h-2 bg-neutral-900 relative overflow-hidden", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: `h-full transition-all duration-1000 ${isLow ? "bg-red-600" : "bg-white"}`,
            style: { width: `${timerPercent}%` }
          }
        ) }),
        /* @__PURE__ */ jsxs(
          "span",
          {
            className: `text-xs font-mono ${isLow ? "text-red-500 animate-pulse" : "text-neutral-500"}`,
            children: [
              turnTimer,
              "s"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-3", children: skipRequested ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1 bg-green-900/20 border border-green-600/30", children: [
      /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-green-500 animate-pulse" }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-green-400 uppercase tracking-widest", children: "Rest Bonus Active" })
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleSkipTurn,
          className: "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-neutral-700 bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          children: "Skip Turn"
        }
      ),
      actionQueue.length > 0 && /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleClearAndReset,
          className: "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-red-900/50 bg-red-900/10 text-red-500 hover:bg-red-900/30 transition-colors",
          children: "Clear Queue"
        }
      )
    ] }) })
  ] });
}
const useMultiplayerStore = create((set) => ({
  matchId: null,
  clientId: null,
  isQueueing: false,
  queue: [],
  pendingSubmit: false,
  lastSyncedTurn: 0,
  setMatchContext: (matchId, clientId) => set({ matchId, clientId }),
  clearMatchContext: () => set({
    matchId: null,
    clientId: null,
    queue: [],
    pendingSubmit: false,
    lastSyncedTurn: 0
  }),
  setQueueing: (isQueueing) => set({ isQueueing }),
  addToQueue: (action) => set((state) => ({
    queue: [...state.queue, action]
  })),
  removeFromQueue: (index) => set((state) => ({
    queue: state.queue.filter((_, i) => i !== index)
  })),
  clearQueue: () => set({ queue: [] }),
  setPendingSubmit: (pending) => set({ pendingSubmit: pending }),
  setLastSyncedTurn: (turn) => set({ lastSyncedTurn: turn })
}));
function loadoutFromServer(serverLoadout) {
  const loadout = [];
  const primary = serverLoadout.primarySoul;
  const secondary = serverLoadout.secondarySoul;
  if (!soulData[primary] || !soulData[secondary]) {
    return loadout;
  }
  const pSoul = soulData[primary];
  const sSoul = soulData[secondary];
  loadout.push({ kind: "elite", ability: pSoul.ultimate });
  for (const activeId of serverLoadout.selectedActives) {
    const pActive = pSoul.actives.find((a) => a.id === activeId);
    if (pActive) {
      loadout.push({ kind: "active", ability: pActive });
      continue;
    }
    const sActive = sSoul.actives.find((a) => a.id === activeId);
    if (sActive) {
      loadout.push({ kind: "active", ability: sActive });
      continue;
    }
    if (pSoul.baseAttack.id === activeId) {
      loadout.push({ kind: "active", ability: pSoul.baseAttack });
    }
  }
  for (const passiveId of serverLoadout.selectedPassives) {
    const pPassive = pSoul.passives.find((p) => p.id === passiveId);
    if (pPassive) {
      loadout.push({ kind: "passive", passive: pPassive });
      continue;
    }
    const sPassive = sSoul.passives.find((p) => p.id === passiveId);
    if (sPassive) {
      loadout.push({ kind: "passive", passive: sPassive });
    }
  }
  return loadout;
}
function useMatchSync(matchId, clientId) {
  const initializeGame = useGameStore((s) => s.initializeGame);
  const clearQueue = useGameStore((s) => s.clearQueue);
  const setPendingSubmit = useMultiplayerStore((s) => s.setPendingSubmit);
  const setLastSyncedTurn = useMultiplayerStore((s) => s.setLastSyncedTurn);
  const lastSyncedTurn = useMultiplayerStore((s) => s.lastSyncedTurn);
  const matchState = useQuery(
    api.matches.getMatchState,
    matchId && clientId ? { matchId, clientId } : "skip"
  );
  const syncToStore = useCallback((state) => {
    const playerLoadout = loadoutFromServer(state.playerState.loadout);
    const enemyLoadout = loadoutFromServer(state.enemyState.loadout);
    const playerEntity = {
      id: "player",
      hp: state.playerState.hp,
      maxHp: state.playerState.maxHp,
      pa: state.playerState.pa,
      maxPa: state.playerState.maxPa,
      pm: state.playerState.pm,
      maxPm: state.playerState.maxPm,
      mana: state.playerState.mana,
      maxMana: state.playerState.maxMana,
      pos: state.playerState.pos,
      passives: state.playerState.passives,
      loadout: playerLoadout,
      effects: state.playerState.effects || []
    };
    const enemyEntity = {
      id: "enemy",
      hp: state.enemyState.hp,
      maxHp: state.enemyState.maxHp,
      pa: state.enemyState.pa,
      maxPa: state.enemyState.maxPa,
      pm: state.enemyState.pm,
      maxPm: state.enemyState.maxPm,
      mana: state.enemyState.mana,
      maxMana: state.enemyState.maxMana,
      pos: state.enemyState.pos,
      passives: state.enemyState.passives,
      loadout: enemyLoadout,
      effects: state.enemyState.effects || []
    };
    initializeGame(playerEntity, enemyEntity);
  }, [initializeGame]);
  useEffect(() => {
    if (!matchState) return;
    syncToStore(matchState);
    if (matchState.turnNumber !== lastSyncedTurn) {
      setLastSyncedTurn(matchState.turnNumber);
      clearQueue();
      setPendingSubmit(false);
    }
  }, [matchState, syncToStore, clearQueue, setPendingSubmit, setLastSyncedTurn, lastSyncedTurn]);
  return {
    matchState,
    canSubmit: matchState?.canSubmit ?? false,
    turnNumber: matchState?.turnNumber ?? 0,
    phase: matchState?.phase ?? "planning",
    status: matchState?.status ?? "waiting",
    winner: matchState?.winner,
    latestEvents: matchState?.latestEvents ?? [],
    isLoading: matchState === void 0
  };
}
function ArenaView({ build, matchMode, onAbort, onPhaseChange }) {
  const pSoul = build ? soulData[build.primary] : null;
  const player = useGameStore(useShallow(selectPlayer));
  const enemy = useGameStore(useShallow(selectEnemy));
  const cooldowns = useGameStore((s) => s.server.cooldowns);
  const phase = useGameStore(selectPhase);
  const activeCommand = useGameStore(selectActiveCommand);
  const interactables = useGameStore(selectInteractables);
  const showStats = useGameStore((s) => s.ui.showStats);
  const setActiveCommand = useGameStore((s) => s.setActiveCommand);
  const simStats = useGameStore(useShallow(getSimulatedResources));
  const initializeGame = useGameStore((s) => s.initializeGame);
  const queue = useMultiplayerStore((s) => s.queue);
  const clearQueue = useMultiplayerStore((s) => s.clearQueue);
  const pendingSubmit = useMultiplayerStore((s) => s.pendingSubmit);
  const setPendingSubmit = useMultiplayerStore((s) => s.setPendingSubmit);
  const submitTurn = useMutation(api.matches.submitTurn);
  const turnNumber = useGameStore((s) => s.server.turnNumber);
  const { status, winner } = useMatchSync(
    matchMode?.matchId ?? null,
    matchMode?.clientId ?? null
  );
  const passiveIds = useMemo(() => {
    if (!build) return [];
    const ids = [];
    for (const slot of build.loadout) {
      if (slot.kind === "passive") {
        ids.push(slot.passive.id);
      }
    }
    return ids;
  }, [build?.loadout]);
  useEffect(() => {
    if (matchMode || !build || !pSoul) return;
    let basePm = pSoul.baseStats.pm;
    if (passiveIds.includes("heavy_plating")) {
      basePm = Math.max(0, basePm - 1);
    }
    const initialPlayerState = {
      id: "player",
      hp: pSoul.baseStats.hp,
      maxHp: pSoul.baseStats.hp,
      pa: pSoul.baseStats.pa,
      maxPa: pSoul.baseStats.pa,
      pm: basePm,
      maxPm: basePm,
      mana: Math.min(2, pSoul.baseStats.mana),
      maxMana: pSoul.baseStats.mana,
      pos: { x: 2, y: 5 },
      passives: passiveIds,
      loadout: build.loadout,
      effects: []
    };
    const initialEnemyState = generateEnemyBuild();
    initializeGame(initialPlayerState, initialEnemyState);
  }, [build, initializeGame, pSoul, passiveIds, matchMode]);
  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);
  const isResolving = phase !== "planning";
  const handleSetActiveCommand = (command) => {
    setActiveCommand(command);
  };
  const handleCellClickMultiplayer = (cell, commandType) => {
    if (!commandType || !matchMode || pendingSubmit) return;
    if (queue.length >= 6) return;
    const action = commandType === "move" ? { type: "move", target: cell } : { type: "ability", target: cell };
    useMultiplayerStore.getState().addToQueue(action);
  };
  const handleSubmitTurn = async () => {
    if (!matchMode || queue.length === 0 || pendingSubmit) return;
    setPendingSubmit(true);
    try {
      await submitTurn({
        matchId: matchMode.matchId,
        clientId: matchMode.clientId,
        turnNumber,
        queue
      });
      clearQueue();
    } catch (error) {
      console.error("Turn submission failed:", error);
      setPendingSubmit(false);
    }
  };
  const [selectedCommandType, setSelectedCommandType] = useState(null);
  return /* @__PURE__ */ jsxs("main", { className: "min-h-screen bg-black text-neutral-100 flex flex-col font-sans overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      ArenaHeader,
      {
        pSoul,
        playerStats: player,
        simStats,
        enemyStats: enemy,
        phase,
        onAbort,
        onToggleStats: () => useGameStore.getState().toggleStatsOverlay()
      }
    ),
    !matchMode && /* @__PURE__ */ jsx(TurnClock, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col lg:flex-row p-6 gap-6 h-[calc(100vh-140px)]", children: [
      /* @__PURE__ */ jsx(
        GridRenderer,
        {
          buildPassives: passiveIds,
          interactables,
          onCellClick: matchMode && selectedCommandType ? (cell) => handleCellClickMultiplayer(cell, selectedCommandType) : void 0
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-[400px] flex flex-col gap-4", children: [
        matchMode && /* @__PURE__ */ jsxs("section", { className: "border border-neutral-900 bg-neutral-950 p-4 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedCommandType("move"),
                disabled: pendingSubmit,
                className: `py-2 border text-xs uppercase tracking-widest transition-colors ${selectedCommandType === "move" ? "border-white bg-white text-black" : "border-neutral-700 hover:border-white"} disabled:opacity-40`,
                children: "Move"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedCommandType("ability"),
                disabled: pendingSubmit,
                className: `py-2 border text-xs uppercase tracking-widest transition-colors ${selectedCommandType === "ability" ? "border-red-600 bg-red-600/20 text-red-300" : "border-neutral-700 hover:border-red-500"} disabled:opacity-40`,
                children: "Basic Attack"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-32 overflow-auto pr-1", children: queue.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-[11px] text-neutral-600", children: "Select a command, then click on the grid to queue actions." }) : queue.map((action, index) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "text-[11px] font-mono border border-neutral-800 p-2 flex justify-between items-center",
              children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  index + 1,
                  ". ",
                  action.type.toUpperCase(),
                  " → [",
                  action.target.x,
                  ",",
                  action.target.y,
                  "]"
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => useMultiplayerStore.getState().removeFromQueue(index),
                    className: "text-neutral-500 hover:text-white text-xs ml-2",
                    children: "✕"
                  }
                )
              ]
            },
            index
          )) }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: clearQueue,
                disabled: queue.length === 0 || pendingSubmit,
                className: "border border-neutral-800 py-2 text-[10px] uppercase tracking-widest hover:border-white disabled:opacity-40",
                children: [
                  "Clear (",
                  queue.length,
                  ")"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleSubmitTurn,
                disabled: queue.length === 0 || pendingSubmit,
                className: "bg-white text-black py-2 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white disabled:opacity-40",
                children: pendingSubmit ? "Submitting..." : "Commit"
              }
            )
          ] }),
          pendingSubmit && /* @__PURE__ */ jsx("p", { className: "text-[10px] uppercase tracking-[0.2em] text-neutral-500 text-center", children: "Waiting for opponent..." })
        ] }),
        /* @__PURE__ */ jsx(
          CommandPanel,
          {
            activeCommand,
            setActiveCommand: handleSetActiveCommand,
            simStats,
            loadout: build?.loadout ?? [],
            cooldowns,
            disabled: isResolving || !!matchMode
          }
        ),
        /* @__PURE__ */ jsx(SequencePanel, {})
      ] })
    ] }),
    showStats && /* @__PURE__ */ jsx(StatsOverlay, {}),
    matchMode && status === "completed" && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/80 flex items-center justify-center z-50", children: /* @__PURE__ */ jsxs("div", { className: "border border-red-900 bg-red-950/30 p-8 text-center space-y-4 max-w-md", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black uppercase tracking-tight text-red-500", children: "Match Complete" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg text-white", children: winner === "player" ? "Victory!" : winner === "enemy" ? "Defeat" : "Draw" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onAbort,
          className: "mt-4 border border-neutral-700 px-6 py-3 text-xs uppercase tracking-widest hover:border-white",
          children: "Return to Menu"
        }
      )
    ] }) })
  ] });
}
export {
  ArenaView as A,
  api as a,
  selectEnemyActions as b,
  obstacles as o,
  soulData as s,
  useMultiplayerStore as u
};
