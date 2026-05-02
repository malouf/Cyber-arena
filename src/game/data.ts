import type { Soul, SoulId } from './types'

export const soulData: Record<SoulId, Soul> = {
  onde: {
    id: 'onde', name: 'Onde (Wave)', role: 'Control / Displacement',
    baseStats: { hp: 80, pa: 4, pm: 3, mana: 5 },
    baseAttack: { id: 'water_bolt', name: 'Water Bolt', paCost: 2, pmCost: 0, manaCost: 0, range: 3, damage: 15, type: 'attack', desc: 'Basic ranged attack.', initiative: 50, maxUsesPerTurn: 2 },
    ultimate: { id: 'resonance', name: 'Résonance (Ult)', paCost: 0, pmCost: 0, manaCost: 3, range: 5, damage: 40, type: 'attack', desc: 'High damage based on movement.', initiative: 20, cooldown: 3 },
    actives: [
      { id: 'impulse', name: 'Impulsion', paCost: 2, pmCost: 0, manaCost: 0, range: 2, damage: 15, type: 'attack', desc: 'Repels target 1 cell.', initiative: 60, cooldown: 1 },
      { id: 'stasis', name: 'Zone de Stase', paCost: 1, pmCost: 0, manaCost: 2, range: 3, damage: 0, type: 'trap', desc: 'Blocks an area for 1 turn.', initiative: 70, cooldown: 2 },
      { id: 'flux', name: 'Rivière de Flux', paCost: 2, pmCost: 0, manaCost: 1, range: 4, damage: 10, type: 'attack', desc: 'Damages in a line.', initiative: 40, maxUsesPerTurn: 1 },
    ],
    passives: [
      { id: 'drain_force', name: 'Drain de Force', desc: 'Gain 1 Mana when displacing an enemy.' },
      { id: 'flow_state', name: 'Flow State', desc: 'If you do not move, next spell gains +1 Range.' },
    ]
  },
  fury: {
    id: 'fury', name: 'Fury (Berserk)', role: 'Melee / Burst',
    baseStats: { hp: 120, pa: 3, pm: 4, mana: 3 },
    baseAttack: { id: 'slash', name: 'Rending Slash', paCost: 2, pmCost: 0, manaCost: 0, range: 1, damage: 25, type: 'attack', desc: 'High damage melee attack.', initiative: 50, maxUsesPerTurn: 2 },
    ultimate: { id: 'execute', name: 'Guillotine (Ult)', paCost: 3, pmCost: 0, manaCost: 2, range: 1, damage: 50, type: 'attack', desc: 'Massive execution damage.', initiative: 30, cooldown: 3 },
    actives: [
      { id: 'leap', name: 'Savage Leap', paCost: 1, pmCost: 0, manaCost: 1, range: 3, damage: 15, type: 'move_attack', desc: 'Jump to cell and damage adjacent.', initiative: 80, cooldown: 2 },
      { id: 'bloodlust', name: 'Bloodlust', paCost: 1, pmCost: 0, manaCost: 2, range: 0, damage: 0, type: 'buff', desc: 'Increases damage of next attack.', initiative: 90, cooldown: 2 },
      { id: 'whirlwind', name: 'Whirlwind', paCost: 2, pmCost: 0, manaCost: 1, range: 1, damage: 20, type: 'attack', desc: 'AoE damage around self.', initiative: 45, maxUsesPerTurn: 1 },
    ],
    passives: [
      { id: 'masochism', name: 'Masochism', desc: 'Taking damage restores 1 PA for the next turn.' },
      { id: 'momentum', name: 'Momentum', desc: 'Each cell moved increases next attack damage by 2.' },
    ]
  },
  aegis: {
    id: 'aegis', name: 'Aegis (Fortress)', role: 'Defense / Zone',
    baseStats: { hp: 150, pa: 3, pm: 2, mana: 4 },
    baseAttack: { id: 'shield_bash', name: 'Shield Bash', paCost: 2, pmCost: 0, manaCost: 0, range: 1, damage: 15, type: 'attack', desc: 'Damages target.', initiative: 50, maxUsesPerTurn: 2 },
    ultimate: { id: 'bastion', name: 'Iron Maiden (Ult)', paCost: 0, pmCost: 0, manaCost: 4, range: 2, damage: 30, type: 'attack', desc: 'Reflects damage taken previously.', initiative: 10, cooldown: 3 },
    actives: [
      { id: 'phalanx', name: 'Phalanx Wall', paCost: 1, pmCost: 0, manaCost: 2, range: 3, damage: 0, type: 'trap', desc: 'Creates impassable terrain.', initiative: 70, cooldown: 2 },
      { id: 'taunt', name: 'Magnetic Pull', paCost: 1, pmCost: 0, manaCost: 1, range: 4, damage: 0, type: 'control', desc: 'Pulls target closer.', initiative: 60, cooldown: 1 },
      { id: 'fortify', name: 'Fortify', paCost: 2, pmCost: 0, manaCost: 0, range: 0, damage: 0, type: 'buff', desc: 'Grants shield and immobilizes self.', initiative: 95, cooldown: 3 },
    ],
    passives: [
      { id: 'thorns', name: 'Thorns', desc: 'Enemies attacking from range 1 take 5 damage.' },
      { id: 'heavy_plating', name: 'Heavy Plating', desc: 'Max PM reduced by 1, reduce all incoming damage by 3.' },
    ]
  }
}

// Static obstacles for practice arena
export const obstacles = [
  {x: 5, y: 4}, {x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7},
  {x: 10, y: 8}, {x: 10, y: 9}, {x: 10, y: 10}, {x: 10, y: 11},
  {x: 8, y: 2}, {x: 9, y: 2}, {x: 8, y: 13}, {x: 9, y: 13}
]