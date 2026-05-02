import fs from 'fs'

let code = fs.readFileSync('src/routes/practice.tsx', 'utf8')

// Add imports
code = code.replace(
  `import { useState } from 'react'`,
  `import { useState } from 'react'\nimport { SoulId, Ability, Action, Soul } from '../game/types'\nimport { soulData, obstacles } from '../game/data'`
)

// Remove everything from type SoulId to the end of soulData
const startIdx = code.indexOf(`type SoulId = 'onde' | 'fury' | 'aegis'`)
const endIdx = code.indexOf(`function PracticeArena() {`)

if (startIdx !== -1 && endIdx !== -1) {
  code = code.substring(0, startIdx) + code.substring(endIdx)
}

// Remove Action type inside PracticeArena
const actionTypeStr = `  type Action = { type: 'move' | 'ability', target: { x: number, y: number }, ability?: Ability, paCost: number, pmCost: number, manaCost: number, name: string, initiative: number }\n`
code = code.replace(actionTypeStr, '')

// Remove obstacles array at the bottom
const obstaclesStr = `  // Static obstacles for practice arena
  const obstacles = [
    {x: 5, y: 4}, {x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7},
    {x: 10, y: 8}, {x: 10, y: 9}, {x: 10, y: 10}, {x: 10, y: 11},
    {x: 8, y: 2}, {x: 9, y: 2}, {x: 8, y: 13}, {x: 9, y: 13}
  ]
`
code = code.replace(obstaclesStr, '')

fs.writeFileSync('src/routes/practice.tsx', code)
console.log('practice.tsx updated successfully!')
