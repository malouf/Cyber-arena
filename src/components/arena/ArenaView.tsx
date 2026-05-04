import { useEffect } from 'react'
import { soulData } from '../../game/data'

import { ArenaHeader } from './ArenaHeader'
import { GridRenderer } from './GridRenderer'
import { CommandPanel } from './CommandPanel'
import { SequencePanel } from './SequencePanel'
import { useGameStore } from './gameStore'
import type {PlayerBuild} from './DraftPhase';
import type { EntityState } from '../../game/engine'
import type { Ability } from '../../game/types'

type Props = {
  build: PlayerBuild
  onAbort: () => void
  onPhaseChange?: (phase: 'planning' | 'resolving' | 'playback') => void
}

export function ArenaView({ build, onAbort, onPhaseChange }: Props) {
  const pSoul = soulData[build.primary]
  const sSoul = soulData[build.secondary]

  const player = useGameStore((s) => s.server.player)
  const enemy = useGameStore((s) => s.server.enemy)
  const cooldowns = useGameStore((s) => s.server.cooldowns)
  const phase = useGameStore((s) => s.ui.phase)
  const activeCommand = useGameStore((s) => s.ui.activeCommand)

  const setActiveCommand = useGameStore((s) => s.setActiveCommand)
  const getSimulatedResources = useGameStore((s) => s.getSimulatedResources)
  const isResolvingFn = useGameStore((s) => s.isResolving)
  const initializeGame = useGameStore((s) => s.initializeGame)

  useEffect(() => {
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

    initializeGame(initialPlayerState, initialEnemyState)
  }, [build, initializeGame, pSoul])

  useEffect(() => {
    onPhaseChange?.(phase)
  }, [phase, onPhaseChange])

  const simStats = getSimulatedResources()
  const isResolving = isResolvingFn()

  const handleSetActiveCommand = (command: { type: 'move' } | { type: 'ability'; ability: Ability } | null) => {
    setActiveCommand(command)
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
        playerStats={player}
        simStats={simStats}
        enemyStats={enemy}
        phase={phase}
        onAbort={onAbort}
      />
      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 h-[calc(100vh-100px)]">
        <GridRenderer buildPassives={build.passives} />

        <div className="w-full lg:w-[400px] flex flex-col gap-4">
          <CommandPanel
            activeCommand={activeCommand}
            setActiveCommand={handleSetActiveCommand}
            simStats={simStats}
            equippedAbilities={equippedAbilities}
            pSoul={pSoul}
            cooldowns={cooldowns}
            disabled={isResolving}
          />
          <SequencePanel />
        </div>
      </div>
    </main>
  )
}