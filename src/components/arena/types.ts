import type {
  Ability,
  Action,
  CombatStats,
  EntityState,
  Interactable,
} from "../../game/types";

export type ArenaPhase = "drafting" | "planning" | "resolving" | "playback";

export type ActiveCommand =
  | { type: "move" }
  | { type: "ability"; ability: Ability }
  | null;

export type VisualEffect = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
};

export type GameServerState = {
  player: EntityState;
  enemy: EntityState;
  actionQueue: Array<Action>;
  cooldowns: Record<string, number>;
  usesThisTurn: Record<string, number>;
  persistentBuffs: {
    flowStateRange: number;
    bonusPa: number;
  };
  interactables: Array<Interactable>;
  turnNumber: number;
  skipRequested: boolean;
};

export type GameUiState = {
  phase: ArenaPhase;
  activeCommand: ActiveCommand;
  hoveredCell: { x: number; y: number } | null;
  logs: Array<string>;
  visualEffects: Array<VisualEffect>;
  turnTimer: number;
  turnTimerMax: number;
  showStats: boolean;
  combatStats: CombatStats;
  enemyCombatStats: CombatStats;
};

export type GameState = {
  server: GameServerState;
  ui: GameUiState;
};

export type SimulatedResources = {
  pa: number;
  pm: number;
  mana: number;
};
