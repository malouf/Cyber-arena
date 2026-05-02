import { useEffect, useReducer, useRef } from 'react'
import { resolveTurn as engineResolveTurn } from '../../game/engine'
import type { Ability } from '../../game/types'
import { soulData, obstacles } from '../../game/data'
import type { EntityState, Pos, TurnState } from '../../game/engine'

import { type PlayerBuild } from './DraftPhase'
import { ArenaHeader } from './ArenaHeader'
import { GridRenderer } from './GridRenderer'
import { CommandPanel } from './CommandPanel'
import { SequencePanel } from './SequencePanel'
import {
  createInitialGameState,
  gameReducer,
  getSimulatedResources,
  type ActiveCommand,
  type ArenaPhase,
} from './gameReducer'

type Props = {
  build: PlayerBuild
  onAbort: () => void
  onPhaseChange?: (phase: ArenaPhase) => void
}

export function ArenaView({ build, onAbort, onPhaseChange }: Props) {
  const pSoul = soulData[build.primary]
  const sSoul = soulData[build.secondary]

  let basePm = pSoul.baseStats.pm
  if (build.passives.includes('heavy_plating')) {
    basePm = Math.max(0, basePm - 1)
  }

  const initialPlayerState: EntityState = {
    id: 'player',
    hp: pSoul.baseStats.hp,
    maxHp: pSoul.baseStats.hp,
    pa: pSoul.baseStats.pa,
    maxPa: pSoul.baseStats.pa,
    pm: basePm,
    maxPm: basePm,
    mana: Math.min(2, pSoul.baseStats.mana),
    maxMana: pSoul.baseStats.mana,
    pos: { x: 2, y: 5 },
    passives: build.passives,
  }

  const initialEnemyState: EntityState = {
    id: 'enemy',
    hp: 120,
    maxHp: 120,
    pa: 0,
    maxPa: 0,
    pm: 0,
    maxPm: 0,
    mana: 0,
    maxMana: 0,
    pos: { x: 7, y: 5 },
    passives: [],
  }

  const [state, dispatch] = useReducer(
    gameReducer,
    {
      player: initialPlayerState,
      enemy: initialEnemyState,
    },
    ({ player, enemy }) =>
      createInitialGameState({
        player,
        enemy,
        initialLogs: ['System online. Select a command to begin sequence.'],
      }),
  )

  const effectIdRef = useRef(1)

  useEffect(() => {
    onPhaseChange?.(state.ui.phase)
  }, [state.ui.phase, onPhaseChange])

  const getDistance = (c1: Pos, c2: Pos) => {
    const dx = c2.x - c1.x
    const dy = c2.y - c1.y
    return Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dx + dy))
  }

  const simStats = getSimulatedResources(state.server)
  const isResolving = state.ui.phase !== 'planning'

  const handleSetActiveCommand = (command: ActiveCommand) => {
    dispatch({ type: 'setActiveCommand', command })
  }

  const handleCellClick = (cell: Pos) => {
    if (state.ui.phase !== 'planning') return
    if (!state.ui.activeCommand) return

    const lastPos = state.server.actionQueue.reduce(
      (pos, action) =>
        action.type === 'move'
          ? action.target
          : action.type === 'ability' && action.ability?.type === 'move_attack'
            ? action.target
            : pos,
      state.server.player.pos,
    )

    const dist = getDistance(lastPos, cell)
    const isOccupiedByEnemy =
      cell.x === state.server.enemy.pos.x && cell.y === state.server.enemy.pos.y
    const isWall = obstacles.some((obstacle) => obstacle.x === cell.x && obstacle.y === cell.y)

    if (state.ui.activeCommand.type === 'move') {
      if (dist > 0 && dist <= simStats.pm && !isOccupiedByEnemy && !isWall) {
        dispatch({
          type: 'queueAction',
          action: {
            type: 'move',
            target: cell,
            paCost: 0,
            pmCost: dist,
            manaCost: 0,
            name: 'Move',
            initiative: 100,
          },
        })
      } else {
        dispatch({
          type: 'applyEvent',
          event: { type: 'log', text: 'Invalid move target.' },
        })
      }
      return
    }

    const ability: Ability = state.ui.activeCommand.ability

    let effectiveRange = ability.range
    if (
      build.passives.includes('flow_state') &&
      state.server.persistentBuffs.flowStateRange > 0
    ) {
      effectiveRange += state.server.persistentBuffs.flowStateRange
    }

    const currentCooldown = state.server.cooldowns[ability.id] || 0
    if (currentCooldown > 0) {
      dispatch({
        type: 'applyEvent',
        event: {
          type: 'log',
          text: `${ability.name} is on cooldown for ${currentCooldown} more turns.`,
        },
      })
      return
    }

    const currentUses = state.server.usesThisTurn[ability.id] || 0
    const queuedUses = state.server.actionQueue.filter(
      (action) => action.type === 'ability' && action.ability?.id === ability.id,
    ).length

    if (ability.maxUsesPerTurn && currentUses + queuedUses >= ability.maxUsesPerTurn) {
      dispatch({
        type: 'applyEvent',
        event: {
          type: 'log',
          text: `Max uses per turn reached for ${ability.name}.`,
        },
      })
      return
    }

    if (!(dist <= effectiveRange && (!isWall || ability.type === 'buff'))) {
      dispatch({
        type: 'applyEvent',
        event: {
          type: 'log',
          text: `Target out of range for ${ability.name}.`,
        },
      })
      return
    }

    if (!(simStats.pa >= ability.paCost && simStats.mana >= ability.manaCost)) {
      dispatch({
        type: 'applyEvent',
        event: {
          type: 'log',
          text: `Insufficient resources for ${ability.name}.`,
        },
      })
      return
    }

    if (ability.type === 'move_attack' && (isOccupiedByEnemy || isWall)) {
      dispatch({
        type: 'applyEvent',
        event: {
          type: 'log',
          text: 'Cannot leap onto occupied cell.',
        },
      })
      return
    }

    dispatch({
      type: 'queueAction',
      action: {
        type: 'ability',
        target: cell,
        ability,
        paCost: ability.paCost,
        pmCost: ability.pmCost,
        manaCost: ability.manaCost,
        name: ability.name,
        initiative: ability.initiative,
      },
    })
  }

  const resolveTurn = async () => {
    if (state.ui.phase !== 'planning') return
    if (state.server.actionQueue.length === 0) return

    dispatch({ type: 'startTurnResolution' })

    const turnState: TurnState = {
      cooldowns: state.server.cooldowns,
      usesThisTurn: state.server.usesThisTurn,
      flowStateRange: state.server.persistentBuffs.flowStateRange,
      bonusPa: state.server.persistentBuffs.bonusPa,
    }

    const { events, nextTurnState } = engineResolveTurn(
      state.server.player,
      state.server.enemy,
      state.server.actionQueue,
      turnState,
    )

    for (const event of events) {
      if (event.type === 'delay') {
        await new Promise((resolve) => setTimeout(resolve, event.ms))
        continue
      }

      if (event.type === 'effect') {
        const effectId = effectIdRef.current
        effectIdRef.current += 1

        dispatch({ type: 'applyEvent', event, effectId })
        setTimeout(() => {
          dispatch({ type: 'removeEffect', effectId })
        }, 1200)
      } else {
        dispatch({ type: 'applyEvent', event })
      }
    }

    dispatch({ type: 'finishTurn', nextTurnState })
  }

  const equippedAbilities = [
    pSoul.baseAttack,
    ...pSoul.actives.filter((ability) => build.actives.includes(ability.id)),
    ...sSoul.actives.filter((ability) => build.actives.includes(ability.id)),
    pSoul.ultimate,
  ]

  return (
    <main className="min-h-screen bg-black text-neutral-100 flex flex-col font-sans overflow-hidden">
      <ArenaHeader
        pSoul={pSoul}
        playerStats={state.server.player}
        simStats={simStats}
        enemyStats={state.server.enemy}
        phase={state.ui.phase}
        onAbort={onAbort}
      />
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 h-[calc(100vh-100px)]">
        <GridRenderer
          unitPos={state.server.player.pos}
          enemyPos={state.server.enemy.pos}
          actionQueue={state.server.actionQueue}
          activeCommand={state.ui.activeCommand}
          simStats={simStats}
          selectedPassives={build.passives}
          flowStateRange={state.server.persistentBuffs.flowStateRange}
          hoveredCell={state.ui.hoveredCell}
          setHoveredCell={(cell) => dispatch({ type: 'setHoveredCell', cell })}
          onCellClick={handleCellClick}
          visualEffects={state.ui.visualEffects}
          isResolving={isResolving}
        />

        <div className="w-full lg:w-[400px] flex flex-col gap-4">
          <CommandPanel
            activeCommand={state.ui.activeCommand}
            setActiveCommand={handleSetActiveCommand}
            simStats={simStats}
            equippedAbilities={equippedAbilities}
            pSoul={pSoul}
            cooldowns={state.server.cooldowns}
            disabled={isResolving}
          />
          <SequencePanel
            actionQueue={state.server.actionQueue}
            onClearQueue={() => dispatch({ type: 'clearQueue' })}
            isResolving={isResolving}
            resolveTurn={resolveTurn}
            logs={state.ui.logs}
            phase={state.ui.phase}
          />
        </div>
      </div>
    </main>
  )
}
