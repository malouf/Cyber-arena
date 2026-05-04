import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  getDistance,
  getLastQueuedPos,
  getSimulatedResources,
  isCellOccupiedByEnemy,
  isCellWall,
} from "./selectors";
import type {
  Action,
  CombatEvent,
  EntityState,
  TurnState,
} from "../../game/types";
import type { ActiveCommand, GameState } from "./types";

type GameStore = GameState & {
  initializeGame: (
    player: EntityState,
    enemy: EntityState,
    initialLogs?: Array<string>,
  ) => void;
  setActiveCommand: (command: ActiveCommand) => void;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
  handleCellClick: (
    cell: { x: number; y: number },
    buildPassives: Array<string>,
  ) => void;
  queueAction: (action: Action) => void;
  clearQueue: () => void;
  startTurnResolution: () => void;
  applyEvent: (
    event: Exclude<CombatEvent, { type: "delay" }>,
    effectId?: number,
  ) => void;
  removeEffect: (effectId: number) => void;
  finishTurn: (nextTurnState: TurnState) => void;
  runTurnResolution: (
    player: EntityState,
    enemy: EntityState,
    queue: Array<Action>,
    turnState: TurnState,
  ) => Promise<void>;
};

export const useGameStore = create<GameStore>()(
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
      },
      actionQueue: [],
      cooldowns: {},
      usesThisTurn: {},
      persistentBuffs: { flowStateRange: 0, bonusPa: 0 },
    },
    ui: {
      phase: "planning",
      activeCommand: null,
      hoveredCell: null,
      logs: ["System online. Select a command to begin sequence."],
      visualEffects: [],
    },

    initializeGame: (player, enemy, initialLogs) =>
      set((state) => {
        state.server.player = player;
        state.server.enemy = enemy;
        state.server.actionQueue = [];
        state.server.cooldowns = {};
        state.server.usesThisTurn = {};
        state.server.persistentBuffs = { flowStateRange: 0, bonusPa: 0 };
        state.ui.phase = "planning";
        state.ui.activeCommand = null;
        state.ui.hoveredCell = null;
        state.ui.visualEffects = [];
        state.ui.logs = initialLogs ?? [
          "System online. Select a command to begin sequence.",
        ];
      }),

    setActiveCommand: (command) =>
      set((state) => {
        state.ui.activeCommand = command;
      }),

    setHoveredCell: (cell) =>
      set((state) => {
        state.ui.hoveredCell = cell;
      }),

    handleCellClick: (cell, buildPassives) =>
      set((state) => {
        const { ui, server } = state;

        if (ui.phase !== "planning") return;
        if (!ui.activeCommand) return;

        const lastPos = getLastQueuedPos(state);
        const dist = getDistance(lastPos, cell);
        const isOccupiedByEnemy = isCellOccupiedByEnemy(state, cell);
        const isWall = isCellWall(cell);

        const simStats = getSimulatedResources(state);

        if (ui.activeCommand.type === "move") {
          if (
            dist > 0 &&
            dist <= simStats.pm &&
            !isOccupiedByEnemy &&
            !isWall
          ) {
            state.server.actionQueue.push({
              type: "move",
              target: cell,
              paCost: 0,
              pmCost: dist,
              manaCost: 0,
              name: "Move",
              initiative: 100,
            });
            state.ui.activeCommand = null;
          } else {
            state.ui.logs = ["Invalid move target.", ...state.ui.logs].slice(
              0,
              15,
            );
          }
          return;
        }

        const ability = ui.activeCommand.ability;

        let effectiveRange = ability.range;
        if (
          buildPassives.includes("flow_state") &&
          server.persistentBuffs.flowStateRange > 0
        ) {
          effectiveRange += server.persistentBuffs.flowStateRange;
        }

        const currentCooldown = server.cooldowns[ability.id] || 0;
        if (currentCooldown > 0) {
          state.ui.logs = [
            `${ability.name} is on cooldown for ${currentCooldown} more turns.`,
            ...state.ui.logs,
          ].slice(0, 15);
          return;
        }

        const currentUses = server.usesThisTurn[ability.id] || 0;
        const queuedUses = server.actionQueue.filter(
          (action: Action) =>
            action.type === "ability" && action.ability?.id === ability.id,
        ).length;

        if (
          ability.maxUsesPerTurn &&
          currentUses + queuedUses >= ability.maxUsesPerTurn
        ) {
          state.ui.logs = [
            `Max uses per turn reached for ${ability.name}.`,
            ...state.ui.logs,
          ].slice(0, 15);
          return;
        }

        if (!(dist <= effectiveRange && (!isWall || ability.type === "buff"))) {
          state.ui.logs = [
            `Target out of range for ${ability.name}.`,
            ...state.ui.logs,
          ].slice(0, 15);
          return;
        }

        if (
          !(simStats.pa >= ability.paCost && simStats.mana >= ability.manaCost)
        ) {
          state.ui.logs = [
            `Insufficient resources for ${ability.name}.`,
            ...state.ui.logs,
          ].slice(0, 15);
          return;
        }

        if (ability.type === "move_attack" && (isOccupiedByEnemy || isWall)) {
          state.ui.logs = [
            "Cannot leap onto occupied cell.",
            ...state.ui.logs,
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
          initiative: ability.initiative,
        });
        state.ui.activeCommand = null;
      }),

    queueAction: (action) =>
      set((state) => {
        state.server.actionQueue.push(action);
        state.ui.activeCommand = null;
      }),

    clearQueue: () =>
      set((state) => {
        state.server.actionQueue = [];
        state.ui.activeCommand = null;
      }),

    startTurnResolution: () =>
      set((state) => {
        state.ui.phase = "resolving";
        state.ui.activeCommand = null;
        state.ui.hoveredCell = null;
      }),

    applyEvent: (event, effectId) =>
      set((state) => {
        const nextUiPhase =
          state.ui.phase === "resolving" ? "playback" : state.ui.phase;

        if (event.type === "log") {
          state.ui.phase = nextUiPhase;
          state.ui.logs = [event.text, ...state.ui.logs].slice(0, 15);
          return;
        }

        if (event.type === "effect") {
          if (effectId === undefined) return;
          state.ui.phase = nextUiPhase;
          state.ui.visualEffects.push({
            id: effectId,
            x: event.pos.x,
            y: event.pos.y,
            text: event.text,
            color: event.color,
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

        const entity = event.entity;
        if (entity === "player") {
          if (event.hp !== undefined) state.server.player.hp = event.hp;
          if (event.pa !== undefined) state.server.player.pa = event.pa;
          if (event.pm !== undefined) state.server.player.pm = event.pm;
          if (event.mana !== undefined) state.server.player.mana = event.mana;
        } else {
          if (event.hp !== undefined) state.server.enemy.hp = event.hp;
          if (event.pa !== undefined) state.server.enemy.pa = event.pa;
          if (event.pm !== undefined) state.server.enemy.pm = event.pm;
          if (event.mana !== undefined) state.server.enemy.mana = event.mana;
        }
        state.ui.phase = nextUiPhase;
      }),

    removeEffect: (effectId) =>
      set((state) => {
        state.ui.visualEffects = state.ui.visualEffects.filter(
          (e) => e.id !== effectId,
        );
      }),

    finishTurn: (nextTurnState) =>
      set((state) => {
        state.server.actionQueue = [];
        state.server.cooldowns = nextTurnState.cooldowns;
        state.server.usesThisTurn = nextTurnState.usesThisTurn;
        state.server.persistentBuffs = {
          flowStateRange: nextTurnState.flowStateRange,
          bonusPa: nextTurnState.bonusPa,
        };
        state.ui.phase = "planning";
        state.ui.activeCommand = null;
      }),

    runTurnResolution: async (player, enemy, queue, turnState) => {
      const { startTurnResolution, applyEvent, removeEffect, finishTurn } =
        get();

      if (queue.length === 0) return;

      startTurnResolution();

      const { resolveTurn } = await import("../../game/engine");

      const { events, nextTurnState } = resolveTurn(
        player,
        enemy,
        queue,
        turnState,
      );
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

      finishTurn(nextTurnState);
    },
  })),
);
