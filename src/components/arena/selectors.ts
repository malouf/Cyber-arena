import { obstacles } from "../../game/data";
import type { Action, Pos } from "../../game/types";
import type { GameState, SimulatedResources } from "./types";

export const getDistance = (c1: Pos, c2: Pos) => {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy));
};

export const getSimulatedResources = (state: GameState): SimulatedResources => {
  const { server } = state;
  return server.actionQueue.reduce(
    (acc, action) => ({
      pa: acc.pa - action.paCost,
      pm: acc.pm - action.pmCost,
      mana: acc.mana - action.manaCost,
    }),
    {
      pa: server.player.pa + server.persistentBuffs.bonusPa,
      pm: server.player.pm,
      mana: server.player.mana,
    },
  );
};

export const getLastQueuedPos = (state: GameState): Pos => {
  const { server } = state;
  return server.actionQueue.reduce((pos: Pos, action: Action) => {
    if (action.type === "move") return action.target;
    if (action.ability?.type === "move_attack") return action.target;
    return pos;
  }, server.player.pos);
};

export const isCellOccupiedByEnemy = (state: GameState, cell: Pos): boolean => {
  return (
    cell.x === state.server.enemy.pos.x && cell.y === state.server.enemy.pos.y
  );
};

export const isCellWall = (cell: Pos): boolean => {
  return obstacles.some((o) => o.x === cell.x && o.y === cell.y);
};

export const selectServer = (state: GameState) => state.server;
export const selectUi = (state: GameState) => state.ui;
export const selectPlayer = (state: GameState) => state.server.player;
export const selectEnemy = (state: GameState) => state.server.enemy;
export const selectActionQueue = (state: GameState) => state.server.actionQueue;
export const selectPhase = (state: GameState) => state.ui.phase;
export const selectActiveCommand = (state: GameState) => state.ui.activeCommand;
export const selectLogs = (state: GameState) => state.ui.logs;
export const selectVisualEffects = (state: GameState) => state.ui.visualEffects;
