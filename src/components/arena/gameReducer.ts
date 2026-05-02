import type { Action, Ability } from '../../game/types'
import type { CombatEvent, EntityState, Pos, TurnState } from '../../game/engine'

export type ArenaPhase = 'planning' | 'resolving' | 'playback'

export type ActiveCommand =
  | { type: 'move' }
  | { type: 'ability'; ability: Ability }
  | null

export type VisualEffect = {
  id: number
  x: number
  y: number
  text: string
  color: string
}

export type GameServerState = {
  player: EntityState
  enemy: EntityState
  actionQueue: Action[]
  cooldowns: Record<string, number>
  usesThisTurn: Record<string, number>
  persistentBuffs: {
    flowStateRange: number
    bonusPa: number
  }
}

export type GameUiState = {
  phase: ArenaPhase
  activeCommand: ActiveCommand
  hoveredCell: Pos | null
  logs: string[]
  visualEffects: VisualEffect[]
}

export type GameState = {
  server: GameServerState
  ui: GameUiState
}

type GameAction =
  | { type: 'setActiveCommand'; command: ActiveCommand }
  | { type: 'setHoveredCell'; cell: Pos | null }
  | { type: 'queueAction'; action: Action }
  | { type: 'clearQueue' }
  | { type: 'startTurnResolution' }
  | { type: 'applyEvent'; event: Exclude<CombatEvent, { type: 'delay' }>; effectId?: number }
  | { type: 'removeEffect'; effectId: number }
  | { type: 'finishTurn'; nextTurnState: TurnState }

export function createInitialGameState(args: {
  player: EntityState
  enemy: EntityState
  initialLogs?: string[]
}): GameState {
  return {
    server: {
      player: args.player,
      enemy: args.enemy,
      actionQueue: [],
      cooldowns: {},
      usesThisTurn: {},
      persistentBuffs: { flowStateRange: 0, bonusPa: 0 },
    },
    ui: {
      phase: 'planning',
      activeCommand: null,
      hoveredCell: null,
      logs: args.initialLogs ?? ['System online. Select a command to begin sequence.'],
      visualEffects: [],
    },
  }
}

export function getSimulatedResources(serverState: GameServerState) {
  return serverState.actionQueue.reduce(
    (acc, action) => ({
      pa: acc.pa - action.paCost,
      pm: acc.pm - action.pmCost,
      mana: acc.mana - action.manaCost,
    }),
    {
      pa: serverState.player.pa + serverState.persistentBuffs.bonusPa,
      pm: serverState.player.pm,
      mana: serverState.player.mana,
    },
  )
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'setActiveCommand': {
      return {
        ...state,
        ui: {
          ...state.ui,
          activeCommand: action.command,
        },
      }
    }

    case 'setHoveredCell': {
      return {
        ...state,
        ui: {
          ...state.ui,
          hoveredCell: action.cell,
        },
      }
    }

    case 'queueAction': {
      return {
        ...state,
        server: {
          ...state.server,
          actionQueue: [...state.server.actionQueue, action.action],
        },
        ui: {
          ...state.ui,
          activeCommand: null,
        },
      }
    }

    case 'clearQueue': {
      return {
        ...state,
        server: {
          ...state.server,
          actionQueue: [],
        },
        ui: {
          ...state.ui,
          activeCommand: null,
        },
      }
    }

    case 'startTurnResolution': {
      return {
        ...state,
        ui: {
          ...state.ui,
          phase: 'resolving',
          activeCommand: null,
          hoveredCell: null,
        },
      }
    }

    case 'applyEvent': {
      const event = action.event
      const nextUiPhase = state.ui.phase === 'resolving' ? 'playback' : state.ui.phase

      if (event.type === 'log') {
        return {
          ...state,
          ui: {
            ...state.ui,
            phase: nextUiPhase,
            logs: [event.text, ...state.ui.logs].slice(0, 15),
          },
        }
      }

      if (event.type === 'effect') {
        if (action.effectId === undefined) {
          return state
        }
        return {
          ...state,
          ui: {
            ...state.ui,
            phase: nextUiPhase,
            visualEffects: [
              ...state.ui.visualEffects,
              {
                id: action.effectId,
                x: event.pos.x,
                y: event.pos.y,
                text: event.text,
                color: event.color,
              },
            ],
          },
        }
      }

      if (event.type === 'move') {
        if (event.entity === 'player') {
          return {
            ...state,
            server: {
              ...state.server,
              player: {
                ...state.server.player,
                pos: event.pos,
              },
            },
            ui: {
              ...state.ui,
              phase: nextUiPhase,
            },
          }
        }

        return {
          ...state,
          server: {
            ...state.server,
            enemy: {
              ...state.server.enemy,
              pos: event.pos,
            },
          },
          ui: {
            ...state.ui,
            phase: nextUiPhase,
          },
        }
      }

      if (event.type === 'stats') {
        if (event.entity === 'player') {
          return {
            ...state,
            server: {
              ...state.server,
              player: {
                ...state.server.player,
                hp: event.hp ?? state.server.player.hp,
                pa: event.pa ?? state.server.player.pa,
                pm: event.pm ?? state.server.player.pm,
                mana: event.mana ?? state.server.player.mana,
              },
            },
            ui: {
              ...state.ui,
              phase: nextUiPhase,
            },
          }
        }

        return {
          ...state,
          server: {
            ...state.server,
            enemy: {
              ...state.server.enemy,
              hp: event.hp ?? state.server.enemy.hp,
              pa: event.pa ?? state.server.enemy.pa,
              pm: event.pm ?? state.server.enemy.pm,
              mana: event.mana ?? state.server.enemy.mana,
            },
          },
          ui: {
            ...state.ui,
            phase: nextUiPhase,
          },
        }
      }

      return state
    }

    case 'removeEffect': {
      return {
        ...state,
        ui: {
          ...state.ui,
          visualEffects: state.ui.visualEffects.filter((effect) => effect.id !== action.effectId),
        },
      }
    }

    case 'finishTurn': {
      return {
        server: {
          ...state.server,
          actionQueue: [],
          cooldowns: action.nextTurnState.cooldowns,
          usesThisTurn: action.nextTurnState.usesThisTurn,
          persistentBuffs: {
            flowStateRange: action.nextTurnState.flowStateRange,
            bonusPa: action.nextTurnState.bonusPa,
          },
        },
        ui: {
          ...state.ui,
          phase: 'planning',
          activeCommand: null,
        },
      }
    }

    default: {
      return state
    }
  }
}
