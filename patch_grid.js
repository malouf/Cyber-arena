const fs = require('fs');
let code = fs.readFileSync('/home/engine/project/app/src/routes/practice.tsx', 'utf-8');

const obstaclesCode = `  const gridSize = 16
  const visionRange = 6
  const rows = Array.from({ length: gridSize }, (_, i) => i)
  const cols = Array.from({ length: gridSize }, (_, i) => i)
  
  // Static obstacles for practice arena
  const obstacles = [
    {x: 5, y: 4}, {x: 5, y: 5}, {x: 5, y: 6}, {x: 5, y: 7},
    {x: 10, y: 8}, {x: 10, y: 9}, {x: 10, y: 10}, {x: 10, y: 11},
    {x: 8, y: 2}, {x: 9, y: 2}, {x: 8, y: 13}, {x: 9, y: 13}
  ]
`;

code = code.replace(/  const gridSize = 10\n  const rows = Array.from\(\{ length: gridSize \}, \(_, i\) => i\)\n  const cols = Array.from\(\{ length: gridSize \}, \(_, i\) => i\)/, obstaclesCode);

// Add isWall check to handleCellClick
const moveValidationOld = `if (dist > 0 && dist <= simStats.pm && !isOccupiedByEnemy) {`;
const moveValidationNew = `const isWall = obstacles.some(o => o.x === cell.x && o.y === cell.y)
      if (dist > 0 && dist <= simStats.pm && !isOccupiedByEnemy && !isWall) {`;
code = code.replace(moveValidationOld, moveValidationNew);

const abilityValidationOld = `if (dist <= effectiveRange) {`;
const abilityValidationNew = `const isWall = obstacles.some(o => o.x === cell.x && o.y === cell.y)
      if (dist <= effectiveRange && (!isWall || ability.type === 'buff')) {`;
code = code.replace(abilityValidationOld, abilityValidationNew);

// Replace grid rendering container
const gridRenderOld = `        {/* Hex Grid Viewport */}
        <div className="flex-1 bg-neutral-950 border border-neutral-900 relative overflow-hidden flex items-center justify-center p-4">
          <div className="flex flex-col gap-1 items-center justify-center relative" style={{ width: 'min(80vh, 100%)' }}>`;
          
const gridRenderNew = `        {/* Hex Grid Viewport */}
        <div className="flex-1 bg-neutral-950 border border-neutral-900 relative overflow-auto scroll-smooth flex p-4 touch-pan-x touch-pan-y">
          <div className="flex flex-col gap-1 items-center m-auto relative min-w-[800px] lg:min-w-[1000px] pb-12">`;

code = code.replace(gridRenderOld, gridRenderNew);

// Update Hex cell rendering inside map
code = code.replace('const isEnemy = enemyPos.x === x && enemyPos.y === y', `const isEnemyRaw = enemyPos.x === x && enemyPos.y === y
                  const isWall = obstacles.some(o => o.x === x && o.y === y)
                  const distFromPlayer = getDistance(unitPos, cell)
                  const isVisible = distFromPlayer <= visionRange
                  
                  const isEnemy = isEnemyRaw && isVisible`);

const inValidRangeOld = `                  let inValidRange = false
                  if (activeCommand?.type === 'move') {
                    inValidRange = distance > 0 && distance <= simStats.pm
                  } else if (activeCommand?.type === 'ability') {
                    let effectiveRange = activeCommand.ability.range
                    if (selectedPassives.includes('flow_state') && persistentBuffs.flowStateRange > 0) {
                      effectiveRange += persistentBuffs.flowStateRange
                    }
                    inValidRange = distance <= effectiveRange
                  }`;
                  
const inValidRangeNew = `                  let inValidRange = false
                  if (activeCommand?.type === 'move') {
                    inValidRange = distance > 0 && distance <= simStats.pm && !isWall
                  } else if (activeCommand?.type === 'ability') {
                    let effectiveRange = activeCommand.ability.range
                    if (selectedPassives.includes('flow_state') && persistentBuffs.flowStateRange > 0) {
                      effectiveRange += persistentBuffs.flowStateRange
                    }
                    inValidRange = distance <= effectiveRange && (!isWall || activeCommand.ability.type === 'buff')
                  }`;
                  
code = code.replace(inValidRangeOld, inValidRangeNew);

const hexClassOld = `                        \${isHoveredValid ? 'bg-red-600/30' : 'bg-neutral-900'}
                        \${inValidRange && !isHoveredValid ? 'bg-white/10' : ''}`;
                        
const hexClassNew = `                        \${!isVisible ? 'bg-neutral-950 opacity-40' : (isWall ? 'bg-neutral-800' : 'bg-neutral-900')}
                        \${isHoveredValid && isVisible ? 'bg-red-600/30' : ''}
                        \${inValidRange && !isHoveredValid && isVisible ? 'bg-white/10' : ''}`;

code = code.replace(hexClassOld, hexClassNew);

const innerBorderOld = `                      {/* Inner border to simulate hex grid lines */}
                      <div className="absolute inset-[1px] bg-black" style={{ clipPath: hexStyle.clipPath, zIndex: 1 }} />`;
                      
const innerBorderNew = `                      {/* Inner border to simulate hex grid lines */}
                      <div className="absolute inset-[1px] bg-black" style={{ clipPath: hexStyle.clipPath, zIndex: 1 }} />
                      
                      {/* Fog of war overlay */}
                      {!isVisible && (
                         <div className="absolute inset-0 bg-black/60 z-[2]" style={{ clipPath: hexStyle.clipPath }} />
                      )}
                      
                      {/* Wall overlay */}
                      {isWall && isVisible && (
                         <div className="absolute inset-1 bg-neutral-800 z-[2]" style={{ clipPath: hexStyle.clipPath }} />
                      )}`;
                      
code = code.replace(innerBorderOld, innerBorderNew);

fs.writeFileSync('/home/engine/project/app/src/routes/practice.tsx', code);
