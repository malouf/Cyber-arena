import fs from "fs";

let code = fs.readFileSync("src/routes/practice.tsx", "utf8");

// Add imports for the new engine
code = code.replace(
  `import { soulData, obstacles } from '../game/data'`,
  `import { soulData, obstacles } from '../game/data'\nimport { resolveTurn as engineResolveTurn, EntityState, TurnState, CombatEvent } from '../game/engine'`,
);

// The old resolveTurn is:
const resolveTurnOldStart = `  const resolveTurn = async () => {`;
const handleSelectPrimaryStart = `  const handleSelectPrimary = (id: SoulId) => {`;

const oldResolveStr = code.substring(
  code.indexOf(resolveTurnOldStart),
  code.indexOf(handleSelectPrimaryStart),
);

const resolveTurnNew = `  const resolveTurn = async () => {
    if (isResolving) return
    setIsResolving(true)
    setActiveCommand(null)
    
    const pState: EntityState = {
      id: 'player',
      hp: playerStats.hp,
      maxHp: playerStats.maxHp,
      pa: playerStats.pa,
      maxPa: playerStats.maxPa,
      pm: playerStats.pm,
      maxPm: playerStats.maxPm,
      mana: playerStats.mana,
      maxMana: playerStats.maxMana,
      pos: unitPos,
      passives: selectedPassives
    }

    const eState: EntityState = {
      id: 'enemy',
      hp: enemyStats.hp,
      maxHp: enemyStats.maxHp,
      pa: 0, maxPa: 0, pm: 0, maxPm: 0, mana: 0, maxMana: 0,
      pos: enemyPos,
      passives: []
    }

    const tState: TurnState = {
      cooldowns,
      usesThisTurn,
      flowStateRange: persistentBuffs.flowStateRange,
      bonusPa: persistentBuffs.bonusPa
    }

    const { events, nextTurnState } = engineResolveTurn(pState, eState, actionQueue, tState)

    // Playback events
    let currentLogs = ['> INITIATING SEQUENCE RESOLUTION']
    setLogs(prev => [...currentLogs, ...prev].slice(0, 15))

    for (const event of events) {
      if (event.type === 'delay') {
        await new Promise(r => setTimeout(r, event.ms))
      } else if (event.type === 'log') {
        currentLogs = [event.text, ...currentLogs].slice(0, 15)
        setLogs(prev => [event.text, ...prev].slice(0, 15)) // Need proper previous state injection but this gives immediate visual
      } else if (event.type === 'effect') {
        triggerEffect(event.pos.x, event.pos.y, event.text, event.color)
      } else if (event.type === 'move') {
        if (event.entity === 'player') setUnitPos(event.pos)
        if (event.entity === 'enemy') setEnemyPos(event.pos)
      } else if (event.type === 'stats') {
        if (event.entity === 'player') {
          setPlayerStats(prev => ({
            ...prev,
            hp: event.hp !== undefined ? event.hp : prev.hp,
            pa: event.pa !== undefined ? event.pa : prev.pa,
            pm: event.pm !== undefined ? event.pm : prev.pm,
            mana: event.mana !== undefined ? event.mana : prev.mana,
          }))
        } else {
          setEnemyStats(prev => ({
            ...prev,
            hp: event.hp !== undefined ? event.hp : prev.hp,
          }))
        }
      }
    }

    setActionQueue([])
    setCooldowns(nextTurnState.cooldowns)
    setUsesThisTurn(nextTurnState.usesThisTurn)
    setPersistentBuffs({ flowStateRange: nextTurnState.flowStateRange, bonusPa: nextTurnState.bonusPa })

    setIsResolving(false)
  }

`;

code = code.replace(oldResolveStr, resolveTurnNew);

fs.writeFileSync("src/routes/practice.tsx", code);
console.log("practice.tsx updated for engine integration!");
